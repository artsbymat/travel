/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VendorUpdatePayload } from "@/types/vendor-api";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Props = {
  params: Promise<{ id: string }>;
};

// GET: Get single vendor details (Super Admin only)
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        city: true,
        wallet: {
          select: {
            id: true,
            balance: true,
            debt: true,
            pendingIn: true,
            totalEarned: true,
            updatedAt: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        ewallets: {
          where: { isActive: true },
        },
        _count: {
          select: {
            users: true,
            vehicles: true,
            billings: true,
            settlements: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor detail:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH: Update vendor (Super Admin only)
export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body: VendorUpdatePayload = await req.json();

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Validasi slug format
    if (body.slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(body.slug)) {
        return NextResponse.json(
          { error: "Slug must be lowercase, alphanumeric, and use hyphens only" },
          { status: 400 }
        );
      }
    }

    // Validasi email format
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
    }

    // Validasi tax rate
    if (body.taxRate !== undefined && body.taxRate !== null) {
      if (body.taxRate < 0 || body.taxRate > 100) {
        return NextResponse.json({ error: "Tax rate must be between 0 and 100" }, { status: 400 });
      }
    }

    // Validasi platform fee rate
    if (body.platformFeeRate !== undefined && body.platformFeeRate !== null) {
      if (body.platformFeeRate < 0 || body.platformFeeRate > 100) {
        return NextResponse.json({ error: "Platform fee rate must be between 0 and 100" }, { status: 400 });
      }
    }

    // Check unique constraints if fields are updated
    const conditions: Prisma.VendorWhereInput[] = [];
    if (body.slug && body.slug !== vendor.slug) conditions.push({ slug: body.slug });
    if (body.email && body.email !== vendor.email) conditions.push({ email: body.email });
    if (body.npwp && body.npwp !== vendor.npwp) conditions.push({ npwp: body.npwp });

    if (conditions.length > 0) {
      const existingVendor = await prisma.vendor.findFirst({
        where: {
          OR: conditions,
          NOT: { id },
        },
      });

      if (existingVendor) {
        if (body.slug && existingVendor.slug === body.slug) {
          return NextResponse.json({ error: "Slug is already in use" }, { status: 400 });
        }
        if (body.email && existingVendor.email === body.email) {
          return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
        }
        if (body.npwp && existingVendor.npwp === body.npwp) {
          return NextResponse.json({ error: "NPWP is already in use" }, { status: 400 });
        }
      }
    }

    // Check city existence if provided
    if (body.cityId && body.cityId !== vendor.cityId) {
      const city = await prisma.city.findUnique({ where: { id: body.cityId } });
      if (!city) {
        return NextResponse.json({ error: "City not found" }, { status: 400 });
      }
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: { ...body },
      include: {
        city: true,
        wallet: {
          select: {
            balance: true,
            debt: true,
            pendingIn: true,
            totalEarned: true,
          },
        },
      },
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete vendor (Super Admin only)
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        wallet: true,
        _count: {
          select: {
            users: true,
            vehicles: true,
            billings: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Cek saldo dan hutang sebelum hapus
    if (vendor.wallet) {
      const balance = Number(vendor.wallet.balance);
      const debt = Number(vendor.wallet.debt);
      const pendingIn = Number(vendor.wallet.pendingIn);

      if (balance > 0) {
        return NextResponse.json(
          { error: `Cannot delete vendor. Vendor still has balance: Rp${balance.toLocaleString("id-ID")}. Please settle first.` },
          { status: 400 }
        );
      }
      if (debt > 0) {
        return NextResponse.json(
          { error: `Cannot delete vendor. Vendor still has debt: Rp${debt.toLocaleString("id-ID")}. Please settle first.` },
          { status: 400 }
        );
      }
      if (pendingIn > 0) {
        return NextResponse.json(
          { error: `Cannot delete vendor. Vendor has pending incoming: Rp${pendingIn.toLocaleString("id-ID")}. Please wait for settlement.` },
          { status: 400 }
        );
      }
    }

    // Cek apakah masih punya relasi aktif
    if (vendor._count.users > 0) {
      return NextResponse.json(
        { error: `Cannot delete vendor. ${vendor._count.users} user(s) are still associated.` },
        { status: 400 }
      );
    }

    // Hapus wallet dulu (karena relasi), lalu vendor
    await prisma.$transaction(async (tx) => {
      if (vendor.wallet) {
        await tx.vendorWallet.delete({ where: { id: vendor.wallet.id } });
      }
      await tx.vendor.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete vendor because it is referenced by other records." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
