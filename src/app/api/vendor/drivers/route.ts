/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";

// Helper to authenticate and return vendorId
async function authenticateVendorScope() {
  const session = await getServerSession(authOptions);

  const role = session?.user?.role;
  if (!session || (role !== "OWNER" && role !== "STAFF")) {
    return { error: "Unauthorized", status: 403 };
  }

  const vendorId = session.user.vendorId;
  if (!vendorId) {
    return { error: "User has no vendor assigned", status: 400 };
  }

  return { vendorId, session };
}

export async function GET() {
  try {
    const auth = await authenticateVendorScope();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const drivers = await prisma.user.findMany({
      where: {
        role: { name: "DRIVER" },
        vendorId: auth.vendorId,
      },
      include: {
        profile: true,
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(drivers);
  } catch (error: any) {
    console.error("Fetch drivers error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateVendorScope();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { name, email, phone, password, simNumber, ktpNumber, address, photoUrl, ktpImage, simImage } = body;

    // Required fields validation
    if (!name || !email || !password || !phone || !simNumber || !ktpNumber || !address) {
      return NextResponse.json({ error: "Semua kolom wajib diisi kecuali lampiran foto." }, { status: 400 });
    }

    // Check unique constraints: email, phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email atau Nomor Telepon sudah terdaftar." }, { status: 400 });
    }

    // Check unique constraints for DriverProfile: simNumber, ktpNumber
    const existingDriverProfile = await prisma.userProfile.findFirst({
      where: {
        OR: [
          { simNumber },
          { ktpNumber }
        ]
      }
    });

    if (existingDriverProfile) {
      return NextResponse.json({ error: "Nomor SIM atau Nomor KTP sudah terdaftar." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDriver = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: { connect: { name: "DRIVER" } },
        vendorId: auth.vendorId,
        profile: {
          create: {
            simNumber,
            ktpNumber,
            address,
            photoUrl: photoUrl || null,
            ktpImage: ktpImage || null,
            simImage: simImage || null,
          }
        }
      },
      include: {
        profile: true,
        role: true,
      }
    });

    // Exclude password from response
    const { password: _, ...driverWithoutPassword } = newDriver;
    return NextResponse.json(driverWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error("Create driver error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
