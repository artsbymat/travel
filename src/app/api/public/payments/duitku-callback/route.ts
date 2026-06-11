/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { validateDuitkuCallbackSignature } from "@/lib/duitku";
import { sendTicketEmail } from "@/lib/ticket-email";

export async function POST(req: NextRequest) {
    try {
        console.log("[DUITKU CALLBACK] Incoming notification event...");

        // Parse incoming data. Duitku callback is usually application/x-www-form-urlencoded
        let data: any = {};
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            data = await req.json();
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await req.formData();
            data = Object.fromEntries(formData.entries());
        } else {
            // Fallback: parse raw query search params or try text
            const text = await req.text();
            const params = new URLSearchParams(text);
            data = Object.fromEntries(params.entries());
        }

        console.log("[DUITKU CALLBACK] Parsed IPN Data:", JSON.stringify(data, null, 2));

        const {
            merchantCode,
            amount,
            merchantOrderId, // bookingCode in our system
            productDetail,
            additionalParam,
            paymentCode,
            resultCode, // "00" = SUCCESS, "01" = FAILURE / EXPIRED
            merchantUserId,
            reference,
            signature
        } = data;

        if (!merchantOrderId || !signature) {
            console.error("[DUITKU CALLBACK] Missing required parameters.");
            return new NextResponse("Bad Request: Missing parameters", { status: 400 });
        }

        // 1. Verify API Signature for authenticity
        const isValidSignature = validateDuitkuCallbackSignature({
            merchantCode: merchantCode || "",
            amount: amount || "",
            merchantOrderId,
            incomingSignature: signature
        });

        if (!isValidSignature) {
            console.error("[DUITKU CALLBACK] Invalid signature check failed.");
            return new NextResponse("Unauthorized: Invalid Signature", { status: 401 });
        }

        // 2. Fetch the existing Booking using merchantOrderId (our bookingCode)
        const booking = await prisma.booking.findUnique({
            where: { bookingCode: merchantOrderId },
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
            console.error(`[DUITKU CALLBACK] Booking with code ${merchantOrderId} not found.`);
            // Return 200 OK because we don't want Duitku to keep retrying for a non-existent order
            return new NextResponse("Booking not found in database", { status: 200 });
        }

        // If booking is already paid, reply immediately to avoid duplicate processing overhead
        if (booking.paymentStatus === "PAID") {
            console.log(`[DUITKU CALLBACK] Booking ${merchantOrderId} is already paid. Sending immediate ACK.`);
            return new NextResponse("OK", { status: 200 });
        }

        // 3. Process payment success code "00"
        if (resultCode === "00") {
            console.log(`[DUITKU CALLBACK] Processing successful payment for ${merchantOrderId}...`);

            const vendorId = booking.trip.vehicle.vendorId;

            await prisma.$transaction(async (tx) => {
                // A. Update Booking payment status & state
                await tx.booking.update({
                    where: { id: booking.id },
                    data: {
                        paymentStatus: "PAID",
                        status: "CONFIRMED",
                        paidAt: new Date(),
                        pgTransactionId: reference,
                        pgProvider: "duitku"
                    }
                });

                // B. Update general PaymentTransaction records
                const activeTx = booking.paymentTransactions.find(t => t.status === "PENDING" || t.externalId === reference);
                if (activeTx) {
                    await tx.paymentTransaction.update({
                        where: { id: activeTx.id },
                        data: {
                            status: "SUCCESS",
                            transactionId: reference,
                            paymentType: paymentCode || "DUITKU_ONLINE",
                            callbackPayload: data as any,
                            paidAt: new Date()
                        }
                    });
                } else {
                    // If no transaction records found or mismatched, create one to maintain balance logs
                    await tx.paymentTransaction.create({
                        data: {
                            bookingId: booking.id,
                            provider: "duitku",
                            externalId: reference || `TX-${booking.bookingCode}`,
                            transactionId: reference,
                            paymentType: paymentCode || "DUITKU_ONLINE",
                            grossAmount: booking.totalAmount,
                            status: "SUCCESS",
                            callbackPayload: data as any,
                            paidAt: new Date(),
                            expiresAt: booking.expiresAt
                        }
                    });
                }

                // C. Update/Create Vendor Wallet instance
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

                // D. Create Vendor Wallet Mutation Ledger
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        type: "BOOKING_INCOME",
                        amount: creditAmount,
                        balanceAfter: newBalance,
                        referenceId: booking.id,
                        referenceType: "Booking",
                        description: `Pendapatan online terverifikasi Duitku untuk invoice ${booking.bookingCode}.`
                    }
                });

                // E. Record Double-Entry Bookkeeping LedgerEntries
                const totalAmount = new Prisma.Decimal(booking.totalAmount);
                const platformFee = booking.platformFeeAmount || new Prisma.Decimal(0);

                // Debit PLATFORM_CASH (Platform receives whole ticket sales)
                await tx.ledgerEntry.create({
                    data: {
                        transactionId: `TX-DK-${booking.bookingCode}`,
                        account: "PLATFORM_CASH",
                        side: "DEBIT",
                        amount: totalAmount,
                        vendorId,
                        referenceId: booking.id,
                        referenceType: "Booking",
                        description: `Debit Kas Platform: Penerimaan Duitku VA/QRIS ${booking.bookingCode}`
                    }
                });

                // Credit VENDOR_WALLET (Allocated vendor net share)
                await tx.ledgerEntry.create({
                    data: {
                        transactionId: `TX-DK-${booking.bookingCode}`,
                        account: "VENDOR_WALLET",
                        side: "CREDIT",
                        amount: creditAmount,
                        vendorId,
                        referenceId: booking.id,
                        referenceType: "Booking",
                        description: `Kredit Dompet Vendor: Alokasi share vendor untuk ${booking.bookingCode}`
                    }
                });

                // Credit PLATFORM_REVENUE (Allocated platform fee percentage)
                await tx.ledgerEntry.create({
                    data: {
                        transactionId: `TX-DK-${booking.bookingCode}`,
                        account: "PLATFORM_REVENUE",
                        side: "CREDIT",
                        amount: platformFee,
                        vendorId,
                        referenceId: booking.id,
                        referenceType: "Booking",
                        description: `Kredit Pendapatan platform: Jasa fee platform ${booking.bookingCode}`
                    }
                });

                // F. Add Audit log in TripActivity tracker
                await tx.tripActivity.create({
                    data: {
                        tripId: booking.tripId,
                        action: "BOOKING_PAID",
                        description: `Tiket Lunas Terverifikasi: Tiket ${booking.bookingCode} berhasil dilunasi otomatis via Payment Gateway Duitku (${paymentCode || "Online"}).`
                    }
                });
            });

            console.log(`[DUITKU CALLBACK] Verified payment bookkeeping completed for ${merchantOrderId}.`);
            try {
                await sendTicketEmail(booking);
            } catch (mailError) {
                console.error("[DUITKU CALLBACK] Ticket email error:", mailError);
            }
            return new NextResponse("OK", { status: 200 }); // Duitku expects exactly "OK" string response
        } else {
            // 4. Handle expired/failed transaction status (resultCode !== "00")
            console.warn(`[DUITKU CALLBACK] Received negative payment signal for order: ${merchantOrderId}. Code: ${resultCode}. releasing seats...`);

            await prisma.$transaction(async (tx) => {
                // Re-read status to prevent state overrides
                const currentBooking = await tx.booking.findUnique({
                    where: { id: booking.id }
                });

                if (currentBooking && currentBooking.paymentStatus !== "PAID") {
                    // Revert Booking state to EXPIRED
                    await tx.booking.update({
                        where: { id: booking.id },
                        data: {
                            status: "EXPIRED",
                            paymentStatus: "UNPAID"
                        }
                    });

                    // Revert seats back to AVAILABLE so other travelers can book
                    await tx.tripSeat.updateMany({
                        where: { bookingId: booking.id },
                        data: {
                            status: "AVAILABLE",
                            bookingId: null
                        }
                    });

                    // Log transaction failure
                    await tx.paymentTransaction.updateMany({
                        where: { bookingId: booking.id, status: "PENDING" },
                        data: {
                            status: "EXPIRE",
                            callbackPayload: data as any
                        }
                    });

                    await tx.tripActivity.create({
                        data: {
                            tripId: booking.tripId,
                            action: "BOOKING_EXPIRED",
                            description: `Pemesanan ${booking.bookingCode} dibatalkan otomatis karena sinyal transaksi Duitku gagal/habis masa tunggu.`
                        }
                    });
                }
            });

            return new NextResponse("OK", { status: 200 });
        }
    } catch (error: any) {
        console.error("[DUITKU CALLBACK] Execution error:", error);
        return new NextResponse(`Callback processing failed: ${error.message || "Internal Server Error"}`, { status: 500 });
    }
}
