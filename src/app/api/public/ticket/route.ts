import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type TicketPassenger = {
  fullName: string;
  phone: string;
  identityNumber?: string;
  seatNo?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json({ error: "Kode booking wajib diisi." }, { status: 400 });
    }

    // Lookup booking by unique bookingCode.
    const booking = await prisma.booking.findUnique({
      where: { bookingCode: code },
      include: {
        trip: {
          include: {
            vehicle: {
              include: {
                vendor: {
                  include: {
                    refundPolicies: {
                      where: { isActive: true },
                      orderBy: { hoursBeforeDeparture: "desc" }
                    }
                  }
                }
              }
            },
            driver: {
              include: {
                profile: true
              }
            }
          }
        },
        seats: true,
        refunds: {
          orderBy: { requestedAt: "desc" },
          take: 1
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    // 1. Parse JSON notes
    let pickup = booking.trip.originDetail || `Pool ${booking.trip.origin}`;
    let dropoff = booking.trip.destinationDetail || `Pool ${booking.trip.destination}`;
    let customerNotes = "";
    let passengers: TicketPassenger[] = [];

    if (booking.notes) {
      try {
        const parsed = JSON.parse(booking.notes);
        pickup = parsed.pickupAddress || pickup;
        dropoff = parsed.dropoffAddress || dropoff;
        customerNotes = parsed.customerNotes || "";
        passengers = parsed.passengers || [];
      } catch {
        // Fallback if notes is plain text
        customerNotes = booking.notes;
      }
    }

    if (passengers.length === 0) {
      passengers = [
        {
          fullName: booking.customerName,
          phone: booking.customerPhone,
          identityNumber: "",
          seatNo: booking.seats.map((s) => s.seatNo).join(", ")
        }
      ];
    }

    // 2. Compute dynamic milestone timeline
    let isVendorCancelledByNotes = false;
    if (booking.notes) {
      try {
        const parsed = JSON.parse(booking.notes);
        if (parsed.cancelledBy === "VENDOR" || parsed.cancelReason?.toLowerCase().includes("armada") || parsed.cancelReason?.toLowerCase().includes("dibatalkan otomatis")) {
          isVendorCancelledByNotes = true;
        }
      } catch {
        if (booking.notes.includes("Armada") || booking.notes.includes("dibatalkan otomatis") || booking.notes.includes("VENDOR")) {
          isVendorCancelledByNotes = true;
        }
      }
    }

    const isVendorCancelled = booking.trip.status === "CANCELLED" || isVendorCancelledByNotes;
    const isCancelled = booking.status === "CANCELLED" || booking.status === "REFUNDED" || isVendorCancelled;

    const isPaid = booking.paymentStatus === "PAID" || isCancelled;
    const isConfirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED";
    const isOngoing = booking.status === "COMPLETED" || booking.trip.status === "ONGOING";
    const isCompleted = booking.status === "COMPLETED" || booking.trip.status === "COMPLETED";

    const timeline = [
      { label: "Booking dibuat", description: "Kode booking berhasil diterbitkan", done: true },
      { label: "Pembayaran diterima", description: isPaid ? "Transaksi sudah terverifikasi" : "Menunggu transfer", done: isPaid },
      { label: "Tiket dikonfirmasi", description: isConfirmed ? "Kursi dan jadwal sudah diamankan" : "Menunggu konfirmasi pembayaran", done: isConfirmed },
      { label: "Dalam perjalanan", description: isOngoing ? "Status aktif saat kendaraan berangkat" : "Belum berangkat", done: isOngoing },
      { label: "Perjalanan selesai", description: isCompleted ? "Trip selesai setelah tiba di tujuan" : "Belum tiba", done: isCompleted }
    ];

    // If cancelled, inject cancelled timeline step
    if (isCancelled) {
      timeline.splice(2, 3, {
        label: "Tiket dibatalkan",
        description: isVendorCancelled ? "Dibatalkan oleh pihak vendor" : `Dibatalkan & diajukan refund (${booking.status})`,
        done: true
      });
    }

    // 3. Compute eligible refund rate based on time before departure
    const now = new Date();
    const departure = booking.trip.departureTime;
    const diffMs = departure.getTime() - now.getTime();
    const hoursBeforeDeparture = Math.floor(diffMs / (1000 * 60 * 60));

    const isVendorCancelledAwaitingRefund = isVendorCancelled && booking.paymentStatus === "PAID" && booking.refunds.length === 0;

    const policies = booking.trip.vehicle.vendor.refundPolicies;
    let activeRefundPercentage = 0;

    if (isVendorCancelledAwaitingRefund) {
      activeRefundPercentage = 100;
    } else if (hoursBeforeDeparture > 0 && !isCancelled) {
      // Find matching policy: greatest hoursBeforeDeparture that is <= current hoursBeforeDeparture
      const matchingPolicy = policies
        .filter((p) => hoursBeforeDeparture >= p.hoursBeforeDeparture)
        .sort((a, b) => b.hoursBeforeDeparture - a.hoursBeforeDeparture)[0];

      if (matchingPolicy) {
        activeRefundPercentage = Number(matchingPolicy.refundPercentage);
      }
    }
    const originalAmount = Number(booking.totalAmount);
    const refundAmount = (originalAmount * activeRefundPercentage) / 100;
    const adminFee = 0; // Flat admin handling fee set to 0 (gratis)
    const finalAmount = Math.max(refundAmount - adminFee, 0);
    // 4. Check if rating is already left in TripActivity
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

    const responseData = {
      booking: {
        id: booking.id,
        code: booking.bookingCode,
        phone: booking.customerPhone,
        email: booking.customerEmail || "",
        customerName: booking.customerName,
        status: booking.status.toLowerCase(),
        statusLabel:
          booking.status === "PENDING"
            ? "Menunggu Pembayaran"
            : booking.status === "CONFIRMED"
            ? "Terkonfirmasi"
            : booking.status === "COMPLETED"
            ? "Selesai"
            : booking.status === "CANCELLED"
            ? "Dibatalkan"
            : booking.status === "REFUNDED"
            ? "Refund Selesai"
            : booking.status,
        route: `${booking.trip.origin} ke ${booking.trip.destination}`,
        totalPassenger: `${booking.seatCount} penumpang`,
        seat: booking.seats.map((s) => s.seatNo).join(", "),
        pickup,
        dropoff,
        vehicle: `${booking.trip.vehicle.brand} ${booking.trip.vehicle.model}`,
        licensePlate: booking.trip.vehicle.licensePlate,
        departureDate: booking.trip.departureTime.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        departureTime: booking.trip.departureTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit"
        }) + " WIB",
        arrivalTime: booking.trip.arrivalTime
          ? booking.trip.arrivalTime.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit"
            }) + " WIB"
          : undefined,
        ticketNumber: `TKT-${booking.bookingCode.split("-")[2] || "CODE"}`,
        passengers,
        subtotal: Number(booking.subtotal),
        taxAmount: Number(booking.taxAmount || 0),
        totalAmount: Number(booking.totalAmount),
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        customerNotes,
        driverName: booking.trip.driver?.profile?.fullName || booking.trip.driver?.name || "Belum ditugaskan",
        driverPhone: booking.trip.driver?.phone || "-",
        refunds: booking.refunds.map(r => ({
          id: r.id,
          refundCode: r.refundCode,
          refundAmount: Number(r.refundAmount),
          adminFee: Number(r.adminFee ?? 0),
          finalAmount: Number(r.finalAmount),
          refundMethod: r.refundMethod,
          customerBankName: r.customerBankName,
          customerBankAccount: r.customerBankAccount,
          customerBankAccountName: r.customerBankAccountName,
          status: r.status,
          reason: r.reason,
          requestedAt: r.requestedAt.toISOString(),
          approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
        }))
      },
      timeline,
      refundCalculation: {
        hoursBeforeDeparture,
        eligible: isVendorCancelledAwaitingRefund || (hoursBeforeDeparture > 0 && !isCancelled && booking.paymentStatus === "PAID"),
        refundPercentage: activeRefundPercentage,
        refundAmount,
        adminFee,
        finalAmount,
        policies: policies.map((p) => ({
          hours: p.hoursBeforeDeparture,
          percentage: Number(p.refundPercentage),
          description: p.description
        }))
      },
      review: existingReview
        ? (existingReview.newData as Prisma.JsonValue)
        : null
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("Error looking up ticket:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gagal melacak tiket." },
      { status: 500 }
    );
  }
}
