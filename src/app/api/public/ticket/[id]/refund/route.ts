/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    const body = await req.json();
    const { refundMethod, bankName, bankAccountNo, bankAccountName, reason, customerPhone } = body;

    if (!customerPhone) {
      return NextResponse.json(
        { error: "Nomor HP pemesan wajib diisi untuk verifikasi keamanan." },
        { status: 400 }
      );
    }

    const chosenMethod = refundMethod === "CASH_PICKUP" ? "CASH_PICKUP" : "BANK_TRANSFER";

    if (chosenMethod === "BANK_TRANSFER" && (!bankName || !bankAccountNo || !bankAccountName)) {
      return NextResponse.json(
        { error: "Detail bank (Nama bank, nomor rekening, atas nama) wajib diisi untuk pengembalian dana transfer." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          include: {
            vehicle: {
              include: {
                vendor: {
                  include: {
                    refundPolicies: {
                      where: { isActive: true }
                    }
                  }
                }
              }
            }
          }
        },
        seats: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    const cleanDbPhone = booking.customerPhone.replace(/[\s\-\+]/g, "");
    const cleanInputPhone = customerPhone.replace(/[\s\-\+]/g, "");
    if (!cleanDbPhone.includes(cleanInputPhone) && !cleanInputPhone.includes(cleanDbPhone)) {
      return NextResponse.json(
        { error: "Verifikasi gagal. Nomor HP tidak cocok dengan data booking." },
        { status: 403 }
      );
    }

    // 1. Check if there is already a Refund record
    const existingRefund = await prisma.refund.findFirst({
      where: { bookingId }
    });

    if (existingRefund) {
      return NextResponse.json(
        { error: "Permintaan pengembalian dana (refund) untuk booking ini sudah diajukan sebelumnya." },
        { status: 400 }
      );
    }

    // 2. Validate current booking status for refund submission
    if (booking.status === "REFUNDED") {
      return NextResponse.json({ error: "Transaksi ini sudah selesai direfund sebelumnya." }, { status: 400 });
    }

    // Parse notes to check for vendor cancellation
    let isVendorCancelledByNotes = false;
    if (booking.notes) {
      try {
        const parsed = JSON.parse(booking.notes);
        if (parsed.cancelledBy === "VENDOR" || parsed.cancelReason?.toLowerCase().includes("armada") || parsed.cancelReason?.toLowerCase().includes("dibatalkan otomatis")) {
          isVendorCancelledByNotes = true;
        }
      } catch (e) {
        if (booking.notes.includes("Armada") || booking.notes.includes("dibatalkan otomatis") || booking.notes.includes("VENDOR")) {
          isVendorCancelledByNotes = true;
        }
      }
    }

    const isVendorCancelled = (booking.trip.status === "CANCELLED" || isVendorCancelledByNotes) && booking.paymentStatus === "PAID";

    if ((booking.status === "CANCELLED" || booking.trip.status === "CANCELLED") && !isVendorCancelled) {
      return NextResponse.json(
        { error: "Booking ini sudah dibatalkan dan pengembalian dana sedang diproses/selesai." },
        { status: 400 }
      );
    }

    if (booking.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Hanya booking yang berstatus Lunas yang dapat diajukan pengembalian dana." },
        { status: 400 }
      );
    }

    // 3. Calculate Refund Parameters
    const now = new Date();
    const departure = booking.trip.departureTime;
    const diffMs = departure.getTime() - now.getTime();
    const hoursBeforeDeparture = Math.floor(diffMs / (1000 * 60 * 60));

    let activeRefundPercentage = 0;

    if (isVendorCancelled) {
      // 100% refund since it was cancelled by the vendor
      activeRefundPercentage = 100;
    } else {
      // Normal self-cancellation by customer: check time limit
      if (hoursBeforeDeparture <= 0) {
        return NextResponse.json(
          { error: "Pembatalan gagal. Kendaraan sudah berangkat atau waktu keberangkatan telah berlalu." },
          { status: 400 }
        );
      }

      const policies = booking.trip.vehicle.vendor.refundPolicies;
      // Find matching policy: greatest hoursBeforeDeparture that is <= current hoursBeforeDeparture
      const matchingPolicy = policies
        .filter((p) => hoursBeforeDeparture >= p.hoursBeforeDeparture)
        .sort((a, b) => b.hoursBeforeDeparture - a.hoursBeforeDeparture)[0];

      if (matchingPolicy) {
        activeRefundPercentage = Number(matchingPolicy.refundPercentage);
      }
    }
    const originalAmount = new Prisma.Decimal(booking.totalAmount);
    const refundAmount = originalAmount.times(new Prisma.Decimal(activeRefundPercentage).div(100));
    const adminFee = new Prisma.Decimal(0); // flat admin fee set to 0 (gratis)

    // Safety check using Decimal comparison operators (.gt = greater than)
    const netAmount = refundAmount.minus(adminFee);
    const finalAmount = netAmount.gt(0) ? netAmount : new Prisma.Decimal(0);

    // 2. Perform cancellations and create pending refund request
    let parsedNotes: any = {};
    if (booking.notes) {
      try {
        parsedNotes = JSON.parse(booking.notes);
      } catch (e) {
        parsedNotes = { rawNotes: booking.notes };
      }
    }

    const refundRecord = await prisma.$transaction(async (tx) => {
      // A. Update Booking Status (Pending payout approval)
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          paymentStatus: "PENDING", // PENDING approval for refund pay-out
          notes: JSON.stringify({
            ...parsedNotes,
            cancellation: {
              cancelledAt: now.toISOString(),
              reason: reason || (isVendorCancelled ? "Dibatalkan oleh Vendor" : "Batal oleh customer"),
              refundPercentage: activeRefundPercentage,
              finalAmount: Number(finalAmount),
              refundMethod: chosenMethod
            }
          })
        }
      });

      // B. Revert reserved TripSeat statuses back to AVAILABLE
      await tx.tripSeat.updateMany({
        where: {
          bookingId: bookingId
        },
        data: {
          status: "AVAILABLE",
          bookingId: null
        }
      });

      // C. Generate short unique Refund Code
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      const refundCode = `REF-${String(now.getFullYear()).substring(2)}${String(now.getMonth() + 1).padStart(2, "0")}-${rand}`;

      // D. Create Refund Request PENDING record
      const refund = await tx.refund.create({
        data: {
          refundCode,
          bookingId,
          originalAmount,
          refundPercentage: new Prisma.Decimal(activeRefundPercentage),
          refundAmount,
          adminFee,
          finalAmount,
          hoursBeforeDeparture,
          departureTime: departure,
          refundMethod: chosenMethod,
          customerBankName: chosenMethod === "BANK_TRANSFER" ? bankName : "CASH",
          customerBankAccount: chosenMethod === "BANK_TRANSFER" ? bankAccountNo : "CASH",
          customerBankAccountName: chosenMethod === "BANK_TRANSFER" ? bankAccountName : booking.customerName,
          status: "PENDING",
          reason: reason || (isVendorCancelled ? "Perjalanan dibatalkan oleh pihak vendor." : "Pengajuan batal mandiri oleh customer.")
        }
      });

      // E. Record TripActivity Audit Trail
      await tx.tripActivity.create({
        data: {
          tripId: booking.tripId,
          action: "BOOKING_CANCELLED",
          description: isVendorCancelled
            ? `Pengajuan Refund (${chosenMethod}): Booking ${booking.bookingCode} telah dibatalkan oleh vendor. Kustomer melengkapi data refund Rp ${Number(finalAmount).toLocaleString("id-ID")} menunggu transfer persetujuan Owner/Staff.`
            : `Pengajuan Refund (${chosenMethod}): Booking ${booking.bookingCode} dibatalkan oleh customer. Pengajuan refund Rp ${Number(finalAmount).toLocaleString("id-ID")} menunggu persetujuan Owner/Staff.`
        }
      });

      return refund;
    });

    return NextResponse.json({ success: true, refund: refundRecord });
  } catch (error: any) {
    console.error("Cancellation and refund processing error:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses pembatalan tiket." }, { status: 500 });
  }
}
