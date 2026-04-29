/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admin can view financial reports." },
        { status: 403 }
      );
    }

    // 1. Ambil data wallet semua vendor
    const wallets = await prisma.vendorWallet.findMany({
      include: {
        vendor: {
          select: {
            name: true,
            slug: true,
            isActive: true,
          },
        },
      },
    });

    // 2. Hitung Agregasi Wallet
    const totalVendorBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
    const totalVendorDebt = wallets.reduce((sum, w) => sum + Number(w.debt), 0);
    const totalPendingIn = wallets.reduce((sum, w) => sum + Number(w.pendingIn), 0);

    // 3. Hitung Pendapatan Platform (dari Ledger)
    // Asumsi: PLATFORM_REVENUE bertambah di sisi CREDIT
    const ledgerRevenue = await prisma.ledgerEntry.aggregate({
      where: {
        account: "PLATFORM_REVENUE",
        side: "CREDIT",
      },
      _sum: {
        amount: true,
      },
    });
    
    const platformRevenue = Number(ledgerRevenue._sum.amount || 0);

    // 4. Vendor Summary (Urutkan berdasarkan hutang terbesar)
    const vendorSummary = wallets.map(w => ({
      id: w.vendorId,
      name: w.vendor.name,
      slug: w.vendor.slug,
      isActive: w.vendor.isActive,
      balance: Number(w.balance),
      debt: Number(w.debt),
      pendingIn: Number(w.pendingIn),
      totalEarned: Number(w.totalEarned),
      lastUpdate: w.updatedAt,
    })).sort((a, b) => b.debt - a.debt);

    return NextResponse.json({
      summary: {
        platformRevenue,
        totalVendorBalance,
        totalVendorDebt,
        totalPendingIn,
        vendorCount: wallets.length,
      },
      vendors: vendorSummary,
    });
  } catch (error) {
    console.error("Error fetching financial report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
