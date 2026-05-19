/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireVendorAuth,
  isOwnerAuthFailure,
  ownerAuthErrorResponse,
} from "@/lib/owner-auth";

// ─── GET /api/vendor/trips ───
// Query params: start, end, status, driverId, vehicleId
export async function GET(req: NextRequest) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const status = searchParams.get("status");
    const driverId = searchParams.get("driverId");
    const vehicleId = searchParams.get("vehicleId");

    const where: any = {
      vehicle: { vendorId: auth.vendorId },
    };

    if (start && end) {
      where.departureTime = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    if (status) {
      where.status = status;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        vehicle: true,
        driver: {
          include: {
            profile: {
              select: {
                photoUrl: true,
                simNumber: true,
              },
            },
          },
        },
        seats: true,
        _count: {
          select: {
            bookings: true,
            seats: true,
          },
        },
      },
      orderBy: { departureTime: "asc" },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("Fetch trips error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data trip." },
      { status: 500 }
    );
  }
}

// ─── POST /api/vendor/trips ───
export async function POST(req: NextRequest) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const body = await req.json();
    const {
      origin,
      destination,
      originDetail,
      destinationDetail,
      departureTime,
      arrivalTime,
      durationMinutes,
      vehicleId,
      driverId,
      price,
      amenities,
      bookingDeadline,
      notes,
    } = body;

    // Validation
    if (!origin || !destination || !departureTime || !vehicleId || !price) {
      return NextResponse.json(
        {
          error:
            "Field wajib: origin, destination, departureTime, vehicleId, price",
        },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to vendor
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, vendorId: auth.vendorId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Kendaraan tidak ditemukan atau bukan milik vendor Anda." },
        { status: 404 }
      );
    }

    // Conflict detection: Vehicle
    const depTime = new Date(departureTime);
    const parsedDuration = durationMinutes ? parseInt(durationMinutes.toString()) : 120;
    const arrTime = arrivalTime
      ? new Date(arrivalTime)
      : new Date(depTime.getTime() + parsedDuration * 60000);

    const vehicleConflicts = await prisma.trip.findMany({
      where: {
        vehicleId,
        status: { notIn: ["CANCELLED", "COMPLETED", "RESCHEDULED"] },
        OR: [
          {
            departureTime: { lte: arrTime },
            arrivalTime: { gte: depTime },
          },
          {
            departureTime: { gte: depTime, lte: arrTime },
          },
        ],
      },
    });

    if (vehicleConflicts.length > 0) {
      return NextResponse.json(
        {
          error: `Kendaraan ${vehicle.licensePlate} sudah memiliki trip pada waktu tersebut.`,
          conflicts: vehicleConflicts,
        },
        { status: 409 }
      );
    }

    // Conflict detection: Driver
    if (driverId) {
      const driverConflicts = await prisma.trip.findMany({
        where: {
          driverId,
          status: { notIn: ["CANCELLED", "COMPLETED", "RESCHEDULED"] },
          OR: [
            {
              departureTime: { lte: arrTime },
              arrivalTime: { gte: depTime },
            },
            {
              departureTime: { gte: depTime, lte: arrTime },
            },
          ],
        },
      });

      if (driverConflicts.length > 0) {
        return NextResponse.json(
          {
            error: "Driver sudah memiliki trip pada waktu tersebut.",
            conflicts: driverConflicts,
          },
          { status: 409 }
        );
      }
    }

    // Create trip with seat generation in transaction
    const trip = await prisma.$transaction(async (tx: any) => {
      const newTrip = await tx.trip.create({
        data: {
          origin,
          destination,
          originDetail: originDetail || null,
          destinationDetail: destinationDetail || null,
          departureTime: depTime,
          arrivalTime: arrTime,
          durationMinutes: parsedDuration,
          price: parseFloat(price),
          amenities: amenities || [],
          bookingDeadline: bookingDeadline ? new Date(bookingDeadline) : null,
          notes: notes || null,
          vehicleId,
          driverId: driverId || null,
          status: "SCHEDULED",
        },
        include: {
          vehicle: true,
          driver: true,
        },
      });

      // Generate seats from vehicle seatLayout
      if (vehicle.seatLayout) {
        const layout = vehicle.seatLayout as any;
        const seats = layout.seats || [];
        if (seats.length > 0) {
          await tx.tripSeat.createMany({
            data: seats.map((seat: any) => ({
              seatNo: seat.label || `${seat.row}-${seat.col}`,
              row: seat.row,
              column: seat.col,
              status: seat.status === "BROKEN" ? "BROKEN" : "AVAILABLE",
              tripId: newTrip.id,
            })),
          });
        }
      }

      // Audit log
      await tx.tripActivity.create({
        data: {
          tripId: newTrip.id,
          userId: auth.userId,
          action: "CREATE",
          description: `Trip ${origin} → ${destination} dibuat`,
          newData: {
            origin,
            destination,
            departureTime: depTime.toISOString(),
            vehicleId,
            driverId,
            price,
          },
        },
      });

      return newTrip;
    });

    const fullTrip = await prisma.trip.findUnique({
      where: { id: trip.id },
      include: {
        vehicle: true,
        driver: {
          include: {
            profile: {
              select: { photoUrl: true, simNumber: true },
            },
          },
        },
        seats: true,
        _count: { select: { bookings: true, seats: true } },
      },
    });

    return NextResponse.json(fullTrip, { status: 201 });
  } catch (error) {
    console.error("Create trip error:", error);
    return NextResponse.json(
      { error: "Gagal membuat trip." },
      { status: 500 }
    );
  }
}
