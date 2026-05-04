/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VendorCreatePayload } from "@/types/vendor-api";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET: List all vendors (Super Admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admin can view vendors." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const noOwner = searchParams.get("noOwner") === "true";

    const vendors = await prisma.vendor.findMany({
      where: noOwner
        ? {
          users: {
            none: {
              role: { name: "OWNER" },
            },
          },
        }
        : undefined,
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
        _count: {
          select: {
            users: true,
            vehicles: true,
            billings: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Create a new vendor (Super Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admin can create vendors." },
        { status: 403 }
      );
    }

    const body: VendorCreatePayload = await req.json();
    const {
      name,
      slug,
      description,
      address,
      cityId,
      phone,
      email,
      logo,
      isActive = true,
      isHeld = false,
      legalName,
      npwp,
      siup,
      taxEnabled = false,
      taxRate,
      taxName = "PPN",
      acceptCash = true,
      platformFeeRate,
    } = body;

    // ═══════════════════════════════════════
    // VALIDASI
    // ═══════════════════════════════════════

    // 1. Required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // 2. Slug format validation (URL friendly)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Slug must be lowercase, alphanumeric, and use hyphens only (e.g., 'sinar-jaya')" },
        { status: 400 }
      );
    }

    // 3. Email format validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // 4. Phone format validation
    if (phone) {
      const phoneRegex = /^[0-9+\-\s()]{8,20}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: "Invalid phone number format" },
          { status: 400 }
        );
      }
    }

    // 5. NPWP format validation (15 digits)
    if (npwp) {
      const npwpDigits = npwp.replace(/\D/g, "");
      if (npwpDigits.length !== 15 && npwpDigits.length !== 16) {
        return NextResponse.json(
          { error: "NPWP must be 15 or 16 digits" },
          { status: 400 }
        );
      }
    }

    // 6. Tax rate validation
    if (taxRate !== undefined && taxRate !== null) {
      if (taxRate < 0 || taxRate > 100) {
        return NextResponse.json(
          { error: "Tax rate must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    // 7. Platform fee rate validation
    if (platformFeeRate !== undefined && platformFeeRate !== null) {
      if (platformFeeRate < 0 || platformFeeRate > 100) {
        return NextResponse.json(
          { error: "Platform fee rate must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    // ═══════════════════════════════════════
    // CEK DUPLIKAT
    // ═══════════════════════════════════════

    const conditions: Prisma.VendorWhereInput[] = [{ slug }];
    if (email) conditions.push({ email });
    if (npwp) conditions.push({ npwp });

    const existingVendor = await prisma.vendor.findFirst({
      where: { OR: conditions },
    });

    if (existingVendor) {
      if (existingVendor.slug === slug) {
        return NextResponse.json({ error: "Slug is already in use" }, { status: 400 });
      }
      if (email && existingVendor.email === email) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
      }
      if (npwp && existingVendor.npwp === npwp) {
        return NextResponse.json({ error: "NPWP is already in use" }, { status: 400 });
      }
    }

    // ═══════════════════════════════════════
    // CEK RELASI
    // ═══════════════════════════════════════

    if (cityId) {
      const city = await prisma.city.findUnique({ where: { id: cityId } });
      if (!city) {
        return NextResponse.json({ error: "City not found" }, { status: 400 });
      }
    }

    // ═══════════════════════════════════════
    // CREATE VENDOR + WALLET (dalam 1 transaksi)
    // ═══════════════════════════════════════

    const vendor = await prisma.$transaction(async (tx) => {
      // 1. Buat Vendor
      const newVendor = await tx.vendor.create({
        data: {
          name,
          slug,
          description,
          address,
          cityId,
          phone,
          email,
          logo,
          isActive,
          isHeld,
          legalName,
          npwp,
          siup,
          taxEnabled,
          taxRate,
          taxName,
          acceptCash,
          platformFeeRate,
        },
      });

      // 2. Otomatis buat Wallet untuk vendor baru
      await tx.vendorWallet.create({
        data: {
          vendorId: newVendor.id,
          balance: 0,
          pendingIn: 0,
          debt: 0,
          totalEarned: 0,
        },
      });

      // 3. Return vendor lengkap dengan wallet
      return tx.vendor.findUnique({
        where: { id: newVendor.id },
        include: {
          city: true,
          wallet: {
            select: {
              id: true,
              balance: true,
              debt: true,
              pendingIn: true,
              totalEarned: true,
            },
          },
        },
      });
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
