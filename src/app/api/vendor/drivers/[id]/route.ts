import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";

// Helper to authenticate and verify ownership
async function verifyOwnershipAndGetDriver(driverId: string) {
  const session = await getServerSession(authOptions);

  const role = session?.user?.role;
  if (!session || (role !== "OWNER" && role !== "STAFF")) {
    return { error: "Unauthorized. Only Owner or Staff can manage drivers.", status: 403 };
  }

  const vendorId = session.user.vendorId;
  if (!vendorId) {
    return { error: "User has no vendor assigned", status: 400 };
  }

  const driver = await prisma.user.findUnique({
    where: { id: driverId },
    include: { profile: true, role: true },
  });

  if (!driver) {
    return { error: "Driver not found", status: 404 };
  }

  if (driver.vendorId !== vendorId || driver.role.name !== "DRIVER") {
    return { error: "Forbidden. You can only manage your own drivers.", status: 403 };
  }

  return { driver, vendorId };
}

// PUT: Update driver details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyOwnershipAndGetDriver(id);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { name, email, phone, password, simNumber, ktpNumber, address, photoUrl, ktpImage, simImage } = body;

    // Check unique email and phone if they are changing
    if (email && email !== auth.driver?.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email }
      });
      if (existingUser) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
      }
    }

    if (phone && phone !== auth.driver?.phone) {
      const existingUser = await prisma.user.findFirst({
        where: { phone }
      });
      if (existingUser) {
        return NextResponse.json({ error: "Nomor telepon sudah terdaftar" }, { status: 400 });
      }
    }

    // Check unique simNumber and ktpNumber if they are changing
    const currentProfile = auth.driver?.profile;
    if (simNumber && simNumber !== currentProfile?.simNumber) {
      const existingProfile = await prisma.userProfile.findFirst({
        where: { simNumber }
      });
      if (existingProfile) {
        return NextResponse.json({ error: "Nomor SIM sudah terdaftar" }, { status: 400 });
      }
    }

    if (ktpNumber && ktpNumber !== currentProfile?.ktpNumber) {
      const existingProfile = await prisma.userProfile.findFirst({
        where: { ktpNumber }
      });
      if (existingProfile) {
        return NextResponse.json({ error: "Nomor KTP sudah terdaftar" }, { status: 400 });
      }
    }

    const dataToUpdate: Record<string, string | null> = {
      name,
      email: email || null,
      phone: phone || null,
    };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedDriver = await prisma.user.update({
      where: { id },
      data: {
        ...dataToUpdate,
        profile: {
          update: {
            simNumber: simNumber || currentProfile?.simNumber,
            ktpNumber: ktpNumber || currentProfile?.ktpNumber,
            address: address || currentProfile?.address,
            photoUrl: photoUrl !== undefined ? photoUrl : currentProfile?.photoUrl,
            ktpImage: ktpImage !== undefined ? ktpImage : currentProfile?.ktpImage,
            simImage: simImage !== undefined ? simImage : currentProfile?.simImage,
          }
        }
      },
      include: {
        profile: true,
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...driverWithoutPassword } = updatedDriver;
    return NextResponse.json(driverWithoutPassword);
  } catch (error) {
    console.error("Update driver error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove driver
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyOwnershipAndGetDriver(id);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.error("Delete driver error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
