import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hash } from "bcrypt";
import { DriverCreatePayload } from "@/types/driver-api";

// GET: List all users with role DRIVER
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId");

    const drivers = await prisma.user.findMany({
      where: {
        role: Role.DRIVER,
        ...(vendorId ? { vendorId } : {}),
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            driverTrips: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Create a new user with role DRIVER
export async function POST(req: NextRequest) {
  try {
    const body: DriverCreatePayload = await req.json();
    const { name, email, phone, password, vendorId } = body;

    if (!name || !vendorId) {
      return NextResponse.json(
        { error: "Name and vendorId are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    if (email || phone) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email or phone already exists" },
          { status: 400 }
        );
      }
    }

    // Hash password if provided, else use a default or null
    const hashedPassword = password ? await hash(password, 10) : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: Role.DRIVER,
        vendorId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
