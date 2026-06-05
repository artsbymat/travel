/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admin can process withdrawals." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, rejectedReason } = body;

    if (status !== "COMPLETED" && status !== "REJECTED") {
      return NextResponse.json(
        { error: "Status harus COMPLETED atau REJECTED." },
        { status: 400 }
      );
    }

    if (status === "REJECTED" && !rejectedReason?.trim()) {
      return NextResponse.json(
        { error: "Alasan penolakan wajib diisi bila status REJECTED." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const withdraw = await tx.withdrawRequest.findUnique({
        where: { id },
        include: { wallet: true }
      });

      if (!withdraw) {
        throw new Error("Permintaan penarikan tidak ditemukan.");
      }

      if (withdraw.status !== "PENDING" && withdraw.status !== "PROCESSING") {
        throw new Error(`Permintaan penarikan ini sudah berstatus ${withdraw.status}.`);
      }

      if (status === "COMPLETED") {
        const updated = await tx.withdrawRequest.update({
          where: { id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            processedAt: new Date()
          }
        });
        return updated;
      } else {
        // REJECTED - Refund the amount to vendor wallet balance
        const refundAmount = Number(withdraw.amount);

        const updatedWallet = await tx.vendorWallet.update({
          where: { id: withdraw.walletId },
          data: {
            balance: { increment: refundAmount }
          }
        });

        // Log WITHDRAW_REVERSAL transaction
        await tx.walletTransaction.create({
          data: {
            walletId: withdraw.walletId,
            type: "WITHDRAW_REVERSAL",
            amount: refundAmount,
            balanceAfter: updatedWallet.balance,
            referenceId: withdraw.id,
            referenceType: "WITHDRAW",
            description: `Penarikan ditolak: ${rejectedReason}`
          }
        });

        const updated = await tx.withdrawRequest.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectedReason,
            processedAt: new Date()
          }
        });

        return updated;
      }
    });

    return NextResponse.json({
      success: true,
      message: `Penarikan berhasil di-${status === "COMPLETED" ? "setujui" : "tolak"}.`,
      data: result
    });

  } catch (error: any) {
    console.error("Error processing withdrawal request:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
