import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";

// GET: Fetch all staff for the logged-in owner's vendor
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Unauthorized. Only Owner can view staff." },
        { status: 403 }
      );
    }

    const vendorId = session.user.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: "Owner has no vendor assigned" }, { status: 400 });
    }

    const staffList = await prisma.user.findMany({
      where: {
        vendorId,
        role: { name: "STAFF" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(staffList);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Create a new staff for the logged-in owner's vendor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json(
        { error: "Unauthorized. Only Owner can create staff." },
        { status: 403 }
      );
    }

    const vendorId = session.user.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: "Owner has no vendor assigned" }, { status: 400 });
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }

    // Check existing email
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
      }
    }

    // Check existing phone
    if (phone) {
      const existingUser = await prisma.user.findUnique({ where: { phone } });
      if (existingUser) {
        return NextResponse.json({ error: "Phone number is already in use" }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        role: { connect: { name: "STAFF" } },
        vendorId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
