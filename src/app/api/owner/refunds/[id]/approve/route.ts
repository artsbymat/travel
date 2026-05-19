import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireVendorAuth, isOwnerAuthFailure, ownerAuthErrorResponse } from "@/lib/owner-auth";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireVendorAuth();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    const { id } = await params;

    try {
        // Find the refund request
        const refund = await prisma.refund.findUnique({
            where: { id },
            include: {
                booking: {
                    include: {
                        trip: {
                            include: {
                                vehicle: true
                            }
                        }
                    }
                }
            }
        });

        if (!refund) {
            return NextResponse.json({ error: "Pengajuan refund tidak ditemukan." }, { status: 404 });
        }

        // Verify vendor ownership
        const vendorId = refund.booking.trip.vehicle.vendorId;
        if (vendorId !== auth.vendorId) {
            return NextResponse.json({ error: "Akses ditolak. Refund bukan milik vendor Anda." }, { status: 403 });
        }

        if (refund.status !== "PENDING") {
            return NextResponse.json({ error: "Pengajuan refund ini sudah diproses sebelumnya." }, { status: 400 });
        }

        // Fetch vendor wallet
        let wallet = await prisma.vendorWallet.findUnique({
            where: { vendorId }
        });

        if (!wallet) {
            wallet = await prisma.vendorWallet.create({
                data: {
                    vendorId,
                    balance: 0,
                    pendingIn: 0,
                    debt: 0,
                    totalEarned: 0
                }
            });
        }

        const isCashPickup = refund.refundMethod === "CASH_PICKUP";
        const refundFinalAmount = new Prisma.Decimal(refund.finalAmount);

        // Check if balance is sufficient (only for non-cash methods, e.g. BANK_TRANSFER)
        if (!isCashPickup && wallet.balance.lt(refundFinalAmount)) {
            const formattedBalance = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(wallet.balance));
            const formattedRefund = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(refundFinalAmount));
            return NextResponse.json({
                error: `Saldo wallet vendor Anda (${formattedBalance}) tidak mencukupi untuk melakukan refund sebesar ${formattedRefund}. Harap isi saldo (top-up) atau tunggu transaksi masuk lainnya.`
            }, { status: 400 });
        }

        // Process refund transaction inside database transaction
        const updatedRefund = await prisma.$transaction(async (tx) => {
            const now = new Date();
            const newBalance = isCashPickup ? wallet.balance : wallet.balance.minus(refundFinalAmount);

            if (!isCashPickup) {
                // 1. Update Vendor Wallet balance
                await tx.vendorWallet.update({
                    where: { id: wallet.id },
                    data: {
                        balance: newBalance
                    }
                });

                // 2. Create Wallet Transaction
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        type: "REFUND_DEDUCTION",
                        amount: refundFinalAmount,
                        balanceAfter: newBalance,
                        referenceId: refund.id,
                        referenceType: "Refund",
                        description: `Deduction for approved refund ${refund.refundCode} (${refund.refundMethod}).`
                    }
                });
            }

            // 3. Create Ledger entries
            await tx.ledgerEntry.create({
                data: {
                    transactionId: `TX-REF-${refund.refundCode}`,
                    account: isCashPickup ? "VENDOR_CASH" : "VENDOR_WALLET",
                    side: "DEBIT",
                    amount: refundFinalAmount,
                    vendorId: vendorId,
                    referenceId: refund.id,
                    referenceType: "Refund",
                    description: isCashPickup
                        ? `Debit Kas Fisik Vendor (Cash Drawer): Pengembalian tunai (Cash Pickup) refund ${refund.refundCode}`
                        : `Debit Dompet Vendor: Penarikan saldo refund ${refund.refundCode}`
                }
            });

            await tx.ledgerEntry.create({
                data: {
                    transactionId: `TX-REF-${refund.refundCode}`,
                    account: "CUSTOMER_REFUND",
                    side: "CREDIT",
                    amount: refundFinalAmount,
                    vendorId: vendorId,
                    referenceId: refund.id,
                    referenceType: "Refund",
                    description: `Kredit Utang Refund Customer: Penyelesaian refund ${refund.refundCode}`
                }
            });

            // 4. Update Refund status to COMPLETED
            const completedRefund = await tx.refund.update({
                where: { id },
                data: {
                    status: "COMPLETED",
                    approvedAt: now,
                    processedAt: now,
                    completedAt: now,
                    processedById: auth.userId,
                    notes: refund.notes ? `${refund.notes} | Disetujui oleh Owner/Staff.` : "Disetujui oleh Owner/Staff."
                }
            });

            // 5. Update Booking paymentStatus to REFUNDED
            await tx.booking.update({
                where: { id: refund.bookingId },
                data: {
                    paymentStatus: "REFUNDED"
                }
            });

            // 6. Record TripActivity
            await tx.tripActivity.create({
                data: {
                    tripId: refund.booking.tripId,
                    action: "BOOKING_CANCELLED",
                    description: `Refund Disetujui: Pengajuan refund ${refund.refundCode} sebesar Rp ${Number(refundFinalAmount).toLocaleString("id-ID")} (${refund.refundMethod}) disetujui oleh Owner/Staff.`
                }
            });

            return completedRefund;
        });

        return NextResponse.json({ success: true, refund: updatedRefund });
    } catch (error: any) {
        console.error("Approve refund error:", error);
        return NextResponse.json({ error: error.message || "Gagal menyetujui refund." }, { status: 500 });
    }
}
