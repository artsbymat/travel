import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sendTicketEmail } from "@/lib/ticket-email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          include: {
            vehicle: true
          }
        },
        seats: true,
        paymentTransactions: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    if (booking.paymentStatus === "PAID") {
      return NextResponse.json({ error: "Booking ini sudah lunas." }, { status: 400 });
    }

    const vendorId = booking.trip.vehicle.vendorId;

    const updatedBooking = await prisma.$transaction(async (tx) => {
      // 1. Update Booking Status
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paidAt: new Date()
        }
      });

      // 2. Update Payment Transaction
      const activeTx = booking.paymentTransactions[0];
      if (activeTx) {
        await tx.paymentTransaction.update({
          where: { id: activeTx.id },
          data: {
            status: "SUCCESS",
            paidAt: new Date()
          }
        });
      }

      // 3. Update Vendor Wallet (Ensure it exists first)
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

      const creditAmount = booking.vendorAmount || new Prisma.Decimal(0);
      const newBalance = wallet.balance.plus(creditAmount);
      const newTotalEarned = wallet.totalEarned.plus(creditAmount);

      await tx.vendorWallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          totalEarned: newTotalEarned
        }
      });

      // 4. Record Wallet Mutation Transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "BOOKING_INCOME",
          amount: creditAmount,
          balanceAfter: newBalance,
          referenceId: booking.id,
          referenceType: "Booking",
          description: `Pendapatan tiket booking ${booking.bookingCode} via online PG.`
        }
      });

      // 5. Double-Entry Ledger Bookkeeping Entries
      const totalAmount = new Prisma.Decimal(booking.totalAmount);
      const platformFee = booking.platformFeeAmount || new Prisma.Decimal(0);

      // Debit PLATFORM_CASH (Platform receives whole amount online)
      await tx.ledgerEntry.create({
        data: {
          transactionId: `TX-PAY-${booking.bookingCode}`,
          account: "PLATFORM_CASH",
          side: "DEBIT",
          amount: totalAmount,
          vendorId: vendorId,
          referenceId: booking.id,
          referenceType: "Booking",
          description: `Debit Kas Platform: Penerimaan booking online ${booking.bookingCode}`
        }
      });

      // Credit VENDOR_WALLET (Platform owes vendor their net share)
      await tx.ledgerEntry.create({
        data: {
          transactionId: `TX-PAY-${booking.bookingCode}`,
          account: "VENDOR_WALLET",
          side: "CREDIT",
          amount: creditAmount,
          vendorId: vendorId,
          referenceId: booking.id,
          referenceType: "Booking",
          description: `Kredit Dompet Vendor: Alokasi pendapatan vendor ${booking.bookingCode}`
        }
      });

      // Credit PLATFORM_REVENUE (Platform earns service fee / percentage share)
      await tx.ledgerEntry.create({
        data: {
          transactionId: `TX-PAY-${booking.bookingCode}`,
          account: "PLATFORM_REVENUE",
          side: "CREDIT",
          amount: platformFee,
          vendorId: vendorId,
          referenceId: booking.id,
          referenceType: "Booking",
          description: `Kredit Pendapatan Platform: Biaya admin/komisi booking ${booking.bookingCode}`
        }
      });

      // 6. Record Trip Activity audit trail
      await tx.tripActivity.create({
        data: {
          tripId: booking.tripId,
          action: "BOOKING_PAID",
          description: `Pembayaran Tiket Lunas: Transaksi ${booking.bookingCode} berhasil disimulasikan Lunas.`
        }
      });

      return updated;
    });

    let ticketEmailSent = false;
    let ticketEmailWarning: string | undefined;

    try {
      const emailResult = await sendTicketEmail(booking);
      ticketEmailSent = emailResult.sent;
      ticketEmailWarning = emailResult.warning;
    } catch (mailError) {
      console.error("[pay-simulate] Ticket email error:", mailError);
      ticketEmailWarning = "Pembayaran berhasil, tetapi email tiket gagal dikirim.";
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      ticketEmailSent,
      warning: ticketEmailWarning
    });
  } catch (error: unknown) {
    console.error("Payment simulation transaction error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal melakukan simulasi pembayaran."
      },
      { status: 500 }
    );
  }
}
