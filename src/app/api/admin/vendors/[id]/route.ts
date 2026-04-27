import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VendorUpdatePayload } from "@/types/vendor-api";
import { Prisma } from "@prisma/client";

type Props = {
  params: Promise<{ id: string }>;
};

// GET: Get single vendor details
export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        city: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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

// PATCH: Update vendor
export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body: VendorUpdatePayload = await req.json();

    // Check if vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
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

    // Explicitly remove undefined fields so Prisma ignores them, though Prisma handles it
    const updatedVendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...body,
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

// DELETE: Delete vendor
export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    await prisma.vendor.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    
    // Check for foreign key constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
       return NextResponse.json(
        { error: "Cannot delete vendor because it is referenced by other records (e.g., vehicles, users)." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
