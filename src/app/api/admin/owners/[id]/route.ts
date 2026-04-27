import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hash } from "bcrypt";
import { OwnerUpdatePayload } from "@/types/owner-api";

type Props = {
  params: Promise<{ id: string }>;
};

// GET: Get single owner details
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const owner = await prisma.user.findFirst({
      where: {
        id,
        role: Role.OWNER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        vendorId: true,
        createdAt: true,
        updatedAt: true,
        vendor: true,
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    return NextResponse.json(owner);
  } catch (error) {
    console.error("Error fetching owner detail:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH: Update owner
export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, phone, password, vendorId } = body;

    // Check if owner exists
    const owner = await prisma.user.findFirst({
      where: {
        id,
        role: Role.OWNER,
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: OwnerUpdatePayload = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (vendorId) {
      // Verify vendor exists
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
      });
      if (!vendor) {
        return NextResponse.json({ error: "Vendor not found" }, { status: 400 });
      }
      updateData.vendorId = vendorId;
    }
    if (password) {
      updateData.password = await hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating owner:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete owner
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    // Check if owner exists
    const owner = await prisma.user.findFirst({
      where: {
        id,
        role: Role.OWNER,
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Owner deleted successfully" });
  } catch (error) {
    console.error("Error deleting owner:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
