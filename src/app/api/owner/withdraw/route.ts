import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, isOwnerAuthFailure, ownerAuthErrorResponse } from "@/lib/owner-auth";

export async function POST(req: NextRequest) {
    const auth = await requireOwner();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const body = await req.json();
        const { amount, bankName, bankAccountNo, bankAccountName, notes } = body;

        // 1. Validation
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return NextResponse.json(
                { error: "Jumlah penarikan harus berupa angka positif yang valid." },
                { status: 400 }
            );
        }

        const withdrawAmount = Number(amount);

        if (!bankName || !bankAccountNo || !bankAccountName) {
            return NextResponse.json(
                { error: "Field Bank, Nomor Rekening, dan Nama Pemilik Rekening wajib diisi." },
                { status: 400 }
            );
        }

        // 2. Perform atomic database transaction
        const result = await prisma.$transaction(async (tx) => {
            // Lock and fetch the wallet
            const wallet = await tx.vendorWallet.findUnique({
                where: { vendorId: auth.vendorId }
            });

            if (!wallet) {
                throw new Error("Wallet vendor tidak ditemukan. Silakan hubungi administrator.");
            }

            const currentBalance = Number(wallet.balance);

            if (currentBalance < withdrawAmount) {
                throw new Error("Saldo tidak mencukupi untuk melakukan penarikan.");
            }

            // Deduct from wallet balance
            const updatedWallet = await tx.vendorWallet.update({
                where: { id: wallet.id },
                data: {
                    balance: { decrement: withdrawAmount }
                }
            });

            // Create WithdrawRequest
            const withdraw = await tx.withdrawRequest.create({
                data: {
                    walletId: wallet.id,
                    vendorId: auth.vendorId,
                    amount: withdrawAmount,
                    adminFee: 0,
                    netAmount: withdrawAmount,
                    bankName,
                    bankAccountNo,
                    bankAccountName,
                    status: "PENDING",
                    notes: notes || null
                }
            });

            // Create WalletTransaction audit log
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: "WITHDRAW",
                    amount: withdrawAmount,
                    balanceAfter: updatedWallet.balance,
                    referenceId: withdraw.id,
                    referenceType: "WITHDRAW",
                    description: `Penarikan ke ${bankName} (${bankAccountNo}) a.n ${bankAccountName}`
                }
            });

            return withdraw;
        });

        return NextResponse.json({
            success: true,
            message: "Permintaan penarikan saldo berhasil dikirim.",
            data: result
        }, { status: 201 });

    } catch (error: any) {
        console.error("Withdrawal processing error:", error);
        return NextResponse.json(
            { error: error.message || "Terjadi kesalahan internal saat memproses penarikan." },
            { status: 500 }
        );
    }
}
