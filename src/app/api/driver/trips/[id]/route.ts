import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Prisma } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const tripId = resolvedParams.id;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "DRIVER") {
    return NextResponse.json(
      { error: "Tidak terautentikasi atau bukan Driver." },
      { status: 401 }
    );
  }

  const driverId = session.user.id;

  // Verify trip belongs to this driver
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, driverId },
  });

  if (!trip) {
    return NextResponse.json(
      { error: "Trip tidak ditemukan atau Anda tidak ditugaskan untuk trip ini." },
      { status: 404 }
    );
  }

  try {
    const body = await req.json();
    const { action, reason, bookingId, seatNo, customerName } = body;

    // 1. START TRIP
    if (action === "START") {
      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.trip.update({
          where: { id: tripId },
          data: { status: "ONGOING" },
        });
        await tx.tripActivity.create({
          data: {
            tripId,
            userId: driverId,
            action: "START_TRIP",
            description: "Driver memulai perjalanan.",
          },
        });
        return t;
      });
      return NextResponse.json(updated);
    }

    // 2. COMPLETE TRIP
    if (action === "COMPLETE") {
      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.trip.update({
          where: { id: tripId },
          data: { status: "COMPLETED", arrivalTime: new Date() },
        });
        await tx.tripActivity.create({
          data: {
            tripId,
            userId: driverId,
            action: "COMPLETE_TRIP",
            description: "Driver menyelesaikan perjalanan.",
          },
        });
        return t;
      });
      return NextResponse.json(updated);
    }

    // 3. DELAY TRIP / SOS
    if (action === "DELAY") {
      if (!reason) {
        return NextResponse.json(
          { error: "Alasan keterlambatan wajib diisi." },
          { status: 400 }
        );
      }
      const updated = await prisma.$transaction(async (tx) => {
        const t = await tx.trip.update({
          where: { id: tripId },
          data: { status: "DELAYED", notes: reason },
        });
        await tx.tripActivity.create({
          data: {
            tripId,
            userId: driverId,
            action: "DELAY_TRIP",
            description: `Perjalanan tertunda: ${reason}`,
          },
        });
        return t;
      });
      return NextResponse.json(updated);
    }

    // 4. PASSENGER CHECK IN
    if (action === "CHECK_IN") {
      if (!bookingId || !seatNo || !customerName) {
        return NextResponse.json(
          { error: "Data check-in tidak lengkap." },
          { status: 400 }
        );
      }
      
      // Check if already checked in
      const existingActivity = await prisma.tripActivity.findFirst({
        where: {
          tripId,
          action: "BOARDING_CHECK_IN",
          description: {
            contains: `Kursi ${seatNo}`,
          },
        },
      });

      if (existingActivity) {
        return NextResponse.json(
          { error: "Penumpang di kursi ini sudah melakukan check-in." },
          { status: 400 }
        );
      }

      const activity = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
          where: { id: bookingId }
        });

        if (booking && booking.paymentMethod === "CASH" && booking.paymentStatus !== "PAID") {
          await tx.booking.update({
            where: { id: bookingId },
            data: {
              paymentStatus: "PAID",
              paidAt: new Date(),
              status: "CONFIRMED"
            }
          });

          // Update Vendor Wallet and Ledger for Cash payment
          const tripWithVehicle = await tx.trip.findUnique({
            where: { id: tripId },
            include: { vehicle: true }
          });
          const vendorId = tripWithVehicle?.vehicle.vendorId;

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
                description: `Komisi platform untuk booking tunai ${booking.bookingCode} dicatat sebagai hutang vendor.`
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
                description: `Debit Kas Vendor: Penerimaan pembayaran tunai ${booking.bookingCode}`
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
        }

        return await tx.tripActivity.create({
          data: {
            tripId,
            userId: driverId,
            action: "BOARDING_CHECK_IN",
            description: `Check-in: Penumpang ${customerName} (Kursi ${seatNo}) boarding.${booking && booking.paymentMethod === "CASH" ? " Pembayaran tunai diterima oleh driver." : ""}`,
            newData: { bookingId, seatNo, customerName },
          },
        });
      });
      return NextResponse.json(activity);
    }

    return NextResponse.json(
      { error: "Aksi tidak didukung." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Driver trip update error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses perubahan." },
      { status: 500 }
    );
  }
}
