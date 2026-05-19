import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    const body = await req.json();
    const { rating, comment } = body;

    const stars = Number(rating);
    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "Rating bintang tidak valid. Wajib bernilai antara 1 dan 5." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    // Verify trip completion to restrict reviews to completed passengers
    const isCompleted = booking.status === "COMPLETED" || booking.trip.status === "COMPLETED";
    if (!isCompleted) {
      return NextResponse.json(
        { error: "Ulasan hanya dapat dikirim setelah perjalanan Anda selesai." },
        { status: 400 }
      );
    }

    // Check for duplicate reviews
    const existingReview = await prisma.tripActivity.findFirst({
      where: {
        tripId: booking.tripId,
        action: "CUSTOMER_REVIEW",
        newData: {
          path: ["bookingId"],
          equals: booking.id
        }
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Anda sudah mengirimkan ulasan untuk tiket ini sebelumnya." },
        { status: 400 }
      );
    }

    // Save the review details inside the audit log TripActivity as JSON
    const reviewData = {
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      rating: stars,
      comment: comment || "",
      createdAt: new Date().toISOString()
    };

    const reviewActivity = await prisma.tripActivity.create({
      data: {
        tripId: booking.tripId,
        action: "CUSTOMER_REVIEW",
        description: `Ulasan Bintang ${stars} dari Customer ${booking.customerName} pada booking ${booking.bookingCode}.`,
        newData: reviewData
      }
    });

    return NextResponse.json({ success: true, review: reviewActivity });
  } catch (error: any) {
    console.error("Error submitting rating review:", error);
    return NextResponse.json({ error: error.message || "Gagal mengirimkan ulasan." }, { status: 500 });
  }
}
