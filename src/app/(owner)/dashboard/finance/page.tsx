import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { redirect } from "next/navigation";
import FinancePageContent from "./FinancePageContent";

export const dynamic = "force-dynamic";

export default async function OwnerFinancePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "OWNER" || !session.user.vendorId) {
    redirect("/login");
  }

  const vendorId = session.user.vendorId;
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // 1. Get or initialize Vendor Wallet
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

  // 2. Fetch all paid bookings within the current month in parallel
  const monthlyBookings = await prisma.booking.findMany({
    where: {
      trip: {
        vehicle: {
          vendorId
        }
      },
      paymentStatus: "PAID",
      paidAt: {
        gte: monthStart,
        lte: monthEnd
      }
    },
    select: {
      id: true,
      bookingCode: true,
      totalAmount: true,
      vendorAmount: true,
      paidAt: true,
      paymentMethod: true,
      customerName: true
    }
  });

  // 3. Calculate revenues
  let todayRevenue = 0;
  let todayBookingCount = 0;
  let monthRevenue = 0;
  const monthBookingCount = monthlyBookings.length;

  for (const b of monthlyBookings) {
    const amt = Number(b.vendorAmount ?? b.totalAmount ?? 0);
    monthRevenue += amt;

    if (b.paidAt && b.paidAt >= startOfToday) {
      todayRevenue += amt;
      todayBookingCount++;
    }
  }

  // 4. Fetch the last 15 paid bookings for the list
  const recentBookings = await prisma.booking.findMany({
    where: {
      trip: {
        vehicle: {
          vendorId
        }
      },
      paymentStatus: "PAID"
    },
    take: 15,
    orderBy: {
      paidAt: "desc"
    },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      totalAmount: true,
      vendorAmount: true,
      paymentMethod: true,
      paidAt: true,
      trip: {
        select: {
          origin: true,
          destination: true,
          departureTime: true
        }
      }
    }
  });

  // 5. Fetch all withdrawal requests
  const withdrawals = await prisma.withdrawRequest.findMany({
    where: {
      vendorId
    },
    orderBy: {
      requestedAt: "desc"
    }
  });

  // 6. Fetch pending CASH bookings for Owner/Staff approvals
  const pendingCashBookings = await prisma.booking.findMany({
    where: {
      trip: {
        vehicle: {
          vendorId
        }
      },
      paymentMethod: "CASH",
      paymentStatus: {
        in: ["UNPAID", "PENDING"]
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      bookingCode: true,
      customerName: true,
      totalAmount: true,
      vendorAmount: true,
      paymentMethod: true,
      createdAt: true,
      trip: {
        select: {
          origin: true,
          destination: true,
          departureTime: true
        }
      }
    }
  });

  // 7. Fetch pending REFUNDS for Owner/Staff approvals
  const pendingRefunds = await prisma.refund.findMany({
    where: {
      booking: {
        trip: {
          vehicle: {
            vendorId
          }
        }
      },
      status: "PENDING"
    },
    include: {
      booking: {
        select: {
          bookingCode: true,
          customerName: true
        }
      }
    },
    orderBy: {
      requestedAt: "desc"
    }
  });

  // Serialize all data to be plain JSON object (convert Date to ISOString, Decimal to number)
  const serializedData = {
    wallet: {
      balance: Number(wallet.balance),
      pendingIn: Number(wallet.pendingIn),
      debt: Number(wallet.debt),
      totalEarned: Number(wallet.totalEarned)
    },
    todayRevenue,
    todayBookingCount,
    monthRevenue,
    monthBookingCount,
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      customerName: b.customerName,
      totalAmount: Number(b.totalAmount),
      vendorAmount: Number(b.vendorAmount ?? b.totalAmount),
      paymentMethod: b.paymentMethod,
      paidAt: b.paidAt ? b.paidAt.toISOString() : "",
      trip: {
        origin: b.trip.origin,
        destination: b.trip.destination,
        departureTime: b.trip.departureTime.toISOString()
      }
    })),
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      adminFee: Number(w.adminFee),
      netAmount: Number(w.netAmount),
      bankName: w.bankName,
      bankAccountNo: w.bankAccountNo,
      bankAccountName: w.bankAccountName,
      status: w.status,
      requestedAt: w.requestedAt.toISOString(),
      processedAt: w.processedAt ? w.processedAt.toISOString() : null,
      completedAt: w.completedAt ? w.completedAt.toISOString() : null,
      rejectedReason: w.rejectedReason,
      reference: w.reference,
      notes: w.notes
    })),
    pendingCashBookings: pendingCashBookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      customerName: b.customerName,
      totalAmount: Number(b.totalAmount),
      vendorAmount: Number(b.vendorAmount ?? b.totalAmount),
      paymentMethod: b.paymentMethod,
      createdAt: b.createdAt.toISOString(),
      trip: {
        origin: b.trip.origin,
        destination: b.trip.destination,
        departureTime: b.trip.departureTime.toISOString()
      }
    })),
    pendingRefunds: pendingRefunds.map((r) => ({
      id: r.id,
      refundCode: r.refundCode,
      bookingId: r.bookingId,
      bookingCode: r.booking.bookingCode,
      customerName: r.booking.customerName,
      refundAmount: Number(r.refundAmount),
      adminFee: Number(r.adminFee ?? 0),
      finalAmount: Number(r.finalAmount),
      refundMethod: r.refundMethod,
      customerBankName: r.customerBankName,
      customerBankAccount: r.customerBankAccount,
      customerBankAccountName: r.customerBankAccountName,
      status: r.status,
      reason: r.reason,
      requestedAt: r.requestedAt.toISOString()
    }))
  };

  return <FinancePageContent initialData={serializedData} />;
}
