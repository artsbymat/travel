import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: Fetch payroll config for all drivers & staff of the vendor
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

    // Get all drivers and staff for this vendor with their payroll config
    const employees = await prisma.user.findMany({
      where: {
        vendorId,
        role: { name: { in: ["DRIVER", "STAFF"] } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: { select: { name: true } },
        isActive: true,
        createdAt: true,
        payrollConfig: {
          select: {
            id: true,
            baseSalary: true,
            commissionType: true,
            commissionValue: true,
            effectiveFrom: true,
            notes: true,
          },
        },
      },
      orderBy: [
        { role: { name: "asc" } },
        { name: "asc" },
      ],
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching payroll configs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Create or update payroll config for a specific user
export async function PUT(req: NextRequest) {
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
    const { userId, baseSalary, commissionType, commissionValue, notes } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Verify user belongs to this vendor
    const user = await prisma.user.findFirst({
      where: { id: userId, vendorId },
      include: { role: { select: { name: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in your vendor" }, { status: 404 });
    }

    // Validate commission fields for drivers
    if (user.role.name === "DRIVER" && commissionType) {
      if (!["FIXED", "PERCENTAGE"].includes(commissionType)) {
        return NextResponse.json({ error: "Invalid commission type" }, { status: 400 });
      }
      if (commissionValue === undefined || commissionValue === null || Number(commissionValue) < 0) {
        return NextResponse.json({ error: "Commission value is required for commission type" }, { status: 400 });
      }
      if (commissionType === "PERCENTAGE" && Number(commissionValue) > 100) {
        return NextResponse.json({ error: "Percentage cannot exceed 100%" }, { status: 400 });
      }
    }

    const config = await prisma.payrollConfig.upsert({
      where: { userId },
      create: {
        userId,
        baseSalary: Number(baseSalary) || 0,
        commissionType: user.role.name === "DRIVER" ? commissionType || null : null,
        commissionValue: user.role.name === "DRIVER" && commissionType ? Number(commissionValue) : null,
        notes: notes || null,
      },
      update: {
        baseSalary: Number(baseSalary) || 0,
        commissionType: user.role.name === "DRIVER" ? commissionType || null : null,
        commissionValue: user.role.name === "DRIVER" && commissionType ? Number(commissionValue) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error updating payroll config:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
