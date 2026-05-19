/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const bookingId = resolvedParams.id;

  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "OWNER" && session.user.role !== "STAFF")) {
    return NextResponse.json(
      {
        error:
          "Akses ditolak. Hanya Owner dan Staff yang dapat menyetujui pembayaran tunai.",
      },
      { status: 403 }
    );
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan." },
        { status: 404 }
      );
    }

    if (booking.paymentMethod !== "CASH") {
      return NextResponse.json(
        { error: "Booking ini tidak menggunakan metode pembayaran tunai." },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Booking ini sudah lunas." },
        { status: 400 }
      );
    }

    // Process database mutations in a secure transaction block
    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paidAt: new Date(),
        },
      });

      // Log cash approval inside trip activities for audit trailing
      await tx.tripActivity.create({
        data: {
          tripId: booking.tripId,
          userId: session.user.id,
          action: "CASH_PAYMENT_APPROVAL",
          description: `Persetujuan Kas: Pembayaran tunai tiket ${booking.bookingCode
            } sebesar Rp ${Number(booking.totalAmount).toLocaleString(
              "id-ID"
            )} disetujui oleh ${session.user.role} ${session.user.name}.`,
        },
      });

      return updated;
    });

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error("Approve cash payment error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menyetujui pembayaran tunai." },
      { status: 500 }
    );
  }
}
