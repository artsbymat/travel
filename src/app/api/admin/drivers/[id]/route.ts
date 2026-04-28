/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hash } from "bcrypt";
import { DriverUpdatePayload } from "@/types/driver-api";

// GET: Fetch a single driver (User with role DRIVER)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const driver = await prisma.user.findFirst({
      where: { id, role: Role.DRIVER },
      include: {
        vendor: true,
        _count: {
          select: { driverTrips: true },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = driver;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH: Update driver details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: DriverUpdatePayload = await req.json();
    const { password, ...updateData } = body;

    const data: any = { ...updateData };
    if (password) {
      data.password = await hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete driver (User) with trip check
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user is a driver and has trips
    const driverWithTrips = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { driverTrips: true },
        },
      },
    });

    if (!driverWithTrips) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (driverWithTrips._count.driverTrips > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete driver because they are assigned to existing trips.",
          tripCount: driverWithTrips._count.driverTrips
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
