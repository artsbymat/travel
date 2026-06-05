import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";

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
      include: { trip: { include: { vehicle: true } } },
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

      const vendorId = booking.trip.vehicle.vendorId;
      if (vendorId) {
        let wallet = await tx.vendorWallet.findUnique({
          where: { vendorId }
        });

        if (!wallet) {
          wallet = await tx.vendorWallet.create({
            data: {
              vendorId,
              balance: new Prisma.Decimal(0),
              pendingIn: new Prisma.Decimal(0),
              debt: new Prisma.Decimal(0),
              totalEarned: new Prisma.Decimal(0)
            }
          });
        }

        const platformFee = booking.platformFeeAmount || new Prisma.Decimal(0);
        const vendorShare = booking.vendorAmount || new Prisma.Decimal(0);

        // Update wallet debt & totalEarned
        await tx.vendorWallet.update({
          where: { id: wallet.id },
          data: {
            debt: wallet.debt.plus(platformFee),
            totalEarned: wallet.totalEarned.plus(vendorShare)
          }
        });

        // Create Wallet Transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "CASH_INCOME",
            amount: platformFee,
            balanceAfter: wallet.balance,
            referenceId: booking.id,
            referenceType: "Booking",
            description: `Komisi platform untuk booking tunai ${booking.bookingCode} disetujui oleh Owner/Staff, dicatat sebagai hutang vendor.`
          }
        });

        // Double-Entry Ledger Bookkeeping Entries
        // 1. Debit VENDOR_CASH
        await tx.ledgerEntry.create({
          data: {
            transactionId: `TX-PAY-${booking.bookingCode}`,
            account: "VENDOR_CASH",
            side: "DEBIT",
            amount: new Prisma.Decimal(booking.totalAmount),
            vendorId: vendorId,
            referenceId: booking.id,
            referenceType: "Booking",
            description: `Debit Kas Vendor: Penerimaan pembayaran tunai ${booking.bookingCode} disetujui oleh Owner/Staff.`
          }
        });

        // 2. Credit VENDOR_DEBT
        await tx.ledgerEntry.create({
          data: {
            transactionId: `TX-PAY-${booking.bookingCode}`,
            account: "VENDOR_DEBT",
            side: "CREDIT",
            amount: platformFee,
            vendorId: vendorId,
            referenceId: booking.id,
            referenceType: "Booking",
            description: `Kredit Hutang Vendor: Komisi platform atas booking tunai ${booking.bookingCode}`
          }
        });

        // 3. Credit PLATFORM_REVENUE
        await tx.ledgerEntry.create({
          data: {
            transactionId: `TX-PAY-${booking.bookingCode}`,
            account: "PLATFORM_REVENUE",
            side: "CREDIT",
            amount: platformFee,
            vendorId: vendorId,
            referenceId: booking.id,
            referenceType: "Booking",
            description: `Kredit Pendapatan Platform: Komisi platform atas booking tunai ${booking.bookingCode}`
          }
        });
      }

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
