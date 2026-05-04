import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from "bcrypt";

// Helper to authenticate and verify ownership
async function verifyOwnershipAndGetStaff(staffId: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "OWNER") {
    return { error: "Unauthorized. Only Owner can manage staff.", status: 403 };
  }

  const vendorId = session.user.vendorId;
  if (!vendorId) {
    return { error: "Owner has no vendor assigned", status: 400 };
  }

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      vendorId: true,
    },
  });

  if (!staff) {
    return { error: "Staff not found", status: 404 };
  }

  if (staff.vendorId !== vendorId || staff.role.name !== "STAFF") {
    return { error: "Forbidden. You can only manage your own staff.", status: 403 };
  }

  return { staff, vendorId };
}

// PUT: Update staff details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyOwnershipAndGetStaff(id);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
    }

    // Check existing email
    if (email && email !== auth.staff?.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
      }
    }

    // Check existing phone
    if (phone && phone !== auth.staff?.phone) {
      const existingUser = await prisma.user.findUnique({ where: { phone } });
      if (existingUser) {
        return NextResponse.json({ error: "Phone number is already in use" }, { status: 400 });
      }
    }

    const dataToUpdate: Record<string, string | null> = {
      name,
      email: email || null,
      phone: phone || null,
    };

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedStaff = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a staff
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await verifyOwnershipAndGetStaff(id);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
