import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";

type Decimal = Prisma.Decimal;
const Decimal = Prisma.Decimal;

// GET: List all payroll periods for the vendor
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const vendorId = session.user.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: "No vendor assigned" }, { status: 400 });
    }

    const periods = await prisma.payrollPeriod.findMany({
      where: { vendorId },
      include: {
        slips: {
          include: {
            user: {
              select: { id: true, name: true, role: { select: { name: true } } },
            },
          },
        },
        _count: { select: { slips: true } },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(periods);
  } catch (error) {
    console.error("Error fetching payroll periods:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Generate payroll for a specific month/year
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const vendorId = session.user.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: "No vendor assigned" }, { status: 400 });
    }

    const body = await req.json();
    const { month, year } = body;

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid month/year" }, { status: 400 });
    }

    // Check if period already exists
    const existing = await prisma.payrollPeriod.findUnique({
      where: { vendorId_month_year: { vendorId, month, year } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Payroll untuk bulan ${month}/${year} sudah ada` },
        { status: 400 }
      );
    }

    // Get all employees with payroll config
    const employees = await prisma.user.findMany({
      where: {
        vendorId,
        role: { name: { in: ["DRIVER", "STAFF"] } },
        isActive: true,
      },
      include: {
        role: { select: { name: true } },
        payrollConfig: true,
      },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada driver/staff aktif untuk dibuatkan payroll" },
        { status: 400 }
      );
    }

    // Calculate period date range
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Get completed trips for the period (for driver commissions)
    const completedTrips = await prisma.trip.findMany({
      where: {
        vehicle: { vendorId },
        driverId: { not: null },
        status: "COMPLETED",
        departureTime: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        id: true,
        driverId: true,
        origin: true,
        destination: true,
        departureTime: true,
        price: true,
      },
    });

    // Group trips by driver
    const tripsByDriver = new Map<string, typeof completedTrips>();
    for (const trip of completedTrips) {
      if (trip.driverId) {
        const existing = tripsByDriver.get(trip.driverId) || [];
        existing.push(trip);
        tripsByDriver.set(trip.driverId, existing);
      }
    }

    // Create payroll period and all slips in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the period
      const period = await tx.payrollPeriod.create({
        data: {
          vendorId,
          month,
          year,
          status: "DRAFT",
        },
      });

      let totalPayroll = new Decimal(0);

      // Create slips for each employee
      for (const employee of employees) {
        const config = employee.payrollConfig;
        const baseSalary = config ? new Decimal(config.baseSalary) : new Decimal(0);
        let totalCommission = new Decimal(0);
        const slipItems: Array<{
          type: "BASE_SALARY" | "COMMISSION";
          label: string;
          amount: Decimal;
        }> = [];

        // Add base salary item
        if (baseSalary.greaterThan(0)) {
          slipItems.push({
            type: "BASE_SALARY",
            label: "Gaji Pokok",
            amount: baseSalary,
          });
        }

        // Calculate driver commissions
        const driverTrips = tripsByDriver.get(employee.id) || [];
        const commissionRecords: Array<{
          tripId: string;
          tripDate: Date;
          tripRoute: string;
          tripPrice: Decimal;
          commissionType: "FIXED" | "PERCENTAGE";
          commissionValue: Decimal;
          commissionAmount: Decimal;
        }> = [];

        if (
          employee.role.name === "DRIVER" &&
          config?.commissionType &&
          config?.commissionValue
        ) {
          for (const trip of driverTrips) {
            let commissionAmount: Decimal;

            if (config.commissionType === "FIXED") {
              commissionAmount = new Decimal(config.commissionValue);
            } else {
              // PERCENTAGE
              commissionAmount = new Decimal(trip.price)
                .mul(new Decimal(config.commissionValue))
                .div(100);
            }

            totalCommission = totalCommission.add(commissionAmount);

            commissionRecords.push({
              tripId: trip.id,
              tripDate: trip.departureTime,
              tripRoute: `${trip.origin} → ${trip.destination}`,
              tripPrice: new Decimal(trip.price),
              commissionType: config.commissionType as "FIXED" | "PERCENTAGE",
              commissionValue: new Decimal(config.commissionValue),
              commissionAmount,
            });
          }

          if (totalCommission.greaterThan(0)) {
            slipItems.push({
              type: "COMMISSION",
              label: `Komisi ${driverTrips.length} Trip`,
              amount: totalCommission,
            });
          }
        }

        const netAmount = baseSalary.add(totalCommission);
        totalPayroll = totalPayroll.add(netAmount);

        // Create the slip
        const slip = await tx.payrollSlip.create({
          data: {
            periodId: period.id,
            userId: employee.id,
            baseSalary,
            totalCommission,
            totalBonus: 0,
            totalDeduction: 0,
            netAmount,
            status: "PENDING",
          },
        });

        // Create slip items
        if (slipItems.length > 0) {
          await tx.payrollSlipItem.createMany({
            data: slipItems.map((item) => ({
              slipId: slip.id,
              type: item.type,
              label: item.label,
              amount: item.amount,
            })),
          });
        }

        // Create commission records
        if (commissionRecords.length > 0) {
          await tx.payrollTripCommission.createMany({
            data: commissionRecords.map((c) => ({
              slipId: slip.id,
              tripId: c.tripId,
              tripDate: c.tripDate,
              tripRoute: c.tripRoute,
              tripPrice: c.tripPrice,
              commissionType: c.commissionType,
              commissionValue: c.commissionValue,
              commissionAmount: c.commissionAmount,
            })),
          });
        }
      }

      // Update total amount
      const updatedPeriod = await tx.payrollPeriod.update({
        where: { id: period.id },
        data: { totalAmount: totalPayroll },
        include: {
          slips: {
            include: {
              user: {
                select: { id: true, name: true, role: { select: { name: true } } },
              },
            },
          },
          _count: { select: { slips: true } },
        },
      });

      return updatedPeriod;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error generating payroll:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
