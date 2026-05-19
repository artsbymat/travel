import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorAuth, isOwnerAuthFailure, ownerAuthErrorResponse } from "@/lib/owner-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const { id: templateId } = await params;
    const body = await req.json();
    const { schedules, ...updateData } = body;

    // Verify ownership
    const existing = await prisma.tripTemplate.findUnique({
      where: { id: templateId }
    });

    if (!existing || existing.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    const updatedTemplate = await prisma.tripTemplate.update({
      where: { id: templateId },
      data: {
        ...updateData,
        ...(schedules && {
          schedules: {
            deleteMany: {}, // Delete old schedules
            create: schedules.map((s: any) => ({ // Re-create new ones
              vehicleId: s.vehicleId,
              driverId: s.driverId || null,
              dayOfWeek: s.dayOfWeek,
              departureTime: s.departureTime,
              priceOverride: s.priceOverride && s.priceOverride !== "" ? parseFloat(s.priceOverride) : null,
            }))
          }
        })
      },
      include: {
        schedules: {
          include: {
            vehicle: true,
            driver: true,
          }
        }
      }
    });

    return NextResponse.json(updatedTemplate);
  } catch (error: any) {
    console.error("PATCH /api/vendor/trip-templates/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const { id: templateId } = await params;

    // Verify ownership
    const existing = await prisma.tripTemplate.findUnique({
      where: { id: templateId }
    });

    if (!existing || existing.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    await prisma.tripTemplate.delete({
      where: { id: templateId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/vendor/trip-templates/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
