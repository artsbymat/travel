import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VendorCreatePayload } from "@/types/vendor-api";
import { Prisma } from "@prisma/client";

// GET: List all vendors
export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        city: true,
        _count: {
          select: {
            users: true,
            vehicles: true,
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

// POST: Create a new vendor
export async function POST(req: NextRequest) {
  try {
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
      bankName,
      bankAccountNo,
      bankAccountName,
    } = body;

    // Basic validation
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check if vendor with same slug or email or npwp exists
    const conditions: Prisma.VendorWhereInput[] = [{ slug }];
    if (email) conditions.push({ email });
    if (npwp) conditions.push({ npwp });

    const existingVendor = await prisma.vendor.findFirst({
      where: {
        OR: conditions,
      },
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

    // Check city existence if provided
    if (cityId) {
      const city = await prisma.city.findUnique({ where: { id: cityId } });
      if (!city) {
        return NextResponse.json({ error: "City not found" }, { status: 400 });
      }
    }

    // Create vendor
    const vendor = await prisma.vendor.create({
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
        bankName,
        bankAccountNo,
        bankAccountName,
      },
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
