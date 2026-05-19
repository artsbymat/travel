import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import {
  requireVendorAuth,
  isOwnerAuthFailure,
  ownerAuthErrorResponse,
} from "@/lib/owner-auth";

// ─── GET /api/vendor/drivers ───
export async function GET() {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const drivers = await prisma.user.findMany({
      where: {
        vendorId: auth.vendorId,
        role: { name: "DRIVER" },
      },
      include: {
        profile: true,
      },
      orderBy: { name: "asc" },
    });

    // Map to match the expected Driver type in frontend if necessary, 
    // but looking at DriverManager.tsx, it expects driverProfile
    const formattedDrivers = drivers.map(d => ({
      ...d,
      driverProfile: d.profile
    }));

    return NextResponse.json(formattedDrivers);
  } catch (error) {
    console.error("Fetch vendor drivers error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data driver." },
      { status: 500 }
    );
  }
}

// ─── POST /api/vendor/drivers ───
export async function POST(req: NextRequest) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const body = await req.json();
    const { 
      name, email, phone, password, 
      simNumber, ktpNumber, address, 
      photoUrl, ktpImage, simImage 
    } = body;

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Nama, email, telepon, dan password wajib diisi." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "Nomor telepon sudah terdaftar." },
        { status: 400 }
      );
    }

    // Check if SIM number already exists
    if (simNumber) {
      const existingSim = await prisma.userProfile.findUnique({
        where: { simNumber },
      });
      if (existingSim) {
        return NextResponse.json(
          { error: "Nomor SIM sudah terdaftar." },
          { status: 400 }
        );
      }
    }

    // Check if KTP number already exists
    if (ktpNumber) {
      const existingKtp = await prisma.userProfile.findUnique({
        where: { ktpNumber },
      });
      if (existingKtp) {
        return NextResponse.json(
          { error: "Nomor KTP sudah terdaftar." },
          { status: 400 }
        );
      }
    }

    // Find DRIVER role
    const driverRole = await prisma.role.findUnique({
      where: { name: "DRIVER" },
    });

    if (!driverRole) {
      return NextResponse.json(
        { error: "Role DRIVER tidak ditemukan di sistem." },
        { status: 500 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDriver = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        isActive: true, // Auto active for drivers added by vendor
        vendorId: auth.vendorId,
        roleId: driverRole.id,
        profile: {
          create: {
            fullName: name,
            address,
            simNumber,
            ktpNumber,
            photoUrl,
            ktpImage,
            simImage,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...driverWithoutPassword } = newDriver;
    return NextResponse.json({
      ...driverWithoutPassword,
      driverProfile: driverWithoutPassword.profile
    });
  } catch (error) {
    console.error("Create driver error:", error);
    return NextResponse.json(
      { error: "Gagal membuat data driver." },
      { status: 500 }
    );
  }
}
