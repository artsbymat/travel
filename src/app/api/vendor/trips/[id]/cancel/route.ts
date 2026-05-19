/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireVendorAuth,
  isOwnerAuthFailure,
  ownerAuthErrorResponse,
} from "@/lib/owner-auth";

// ─── POST /api/vendor/trips/[id]/cancel ───
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const { id } = await params;
    const body = await req.json();
    const { reason } = body;

    const trip = await prisma.trip.findFirst({
      where: {
        id,
        vehicle: { vendorId: auth.vendorId },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Trip tidak ditemukan." },
        { status: 404 }
      );
    }

    if (trip.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Trip sudah dibatalkan." },
        { status: 400 }
      );
    }

    if (trip.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Trip yang sudah selesai tidak bisa dibatalkan." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: {
          vehicle: true,
          driver: {
            include: {
              profile: { select: { photoUrl: true, simNumber: true } },
            },
          },
          seats: true,
          _count: { select: { bookings: true, seats: true } },
        },
      });

      // Cancel all bookings associated with this trip and mark them as cancelled by vendor
      await tx.booking.updateMany({
        where: { tripId: id },
        data: {
          status: "CANCELLED",
          notes: JSON.stringify({
            cancelledBy: "VENDOR",
            cancelReason: reason || "Perjalanan dibatalkan oleh pihak vendor."
          })
        }
      });

      // Release all reserved seats for bookings of this trip
      await tx.tripSeat.updateMany({
        where: {
          booking: {
            tripId: id
          }
        },
        data: {
          status: "AVAILABLE",
          bookingId: null
        }
      });

      await tx.tripActivity.create({
        data: {
          tripId: id,
          userId: auth.userId,
          action: "CANCEL",
          description: reason
            ? `Trip dibatalkan. Alasan: ${reason}`
            : "Trip dibatalkan",
          oldData: { status: trip.status },
          newData: { status: "CANCELLED", reason },
        },
      });

      return updatedTrip;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Cancel trip error:", error);
    return NextResponse.json(
      { error: "Gagal membatalkan trip." },
      { status: 500 }
    );
  }
}
