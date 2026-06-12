import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StaffBookingsPageContent from "./StaffBookingsPageContent";

export const dynamic = "force-dynamic";

export default async function StaffBookingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STAFF" || !session.user.vendorId) {
    redirect("/login");
  }

  const vendorId = session.user.vendorId;

  // 1. Fetch vendor wallet for balance check
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

  // 2. Fetch pending CASH bookings
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

  // 3. Fetch pending REFUNDS
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

  // 4. Fetch the last 50 bookings for search & view
  const recentBookings = await prisma.booking.findMany({
    where: {
      trip: {
        vehicle: {
          vendorId
        }
      }
    },
    take: 50,
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
      paymentStatus: true,
      status: true,
      createdAt: true,
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

  const serializedData = {
    wallet: {
      balance: Number(wallet.balance),
      pendingIn: Number(wallet.pendingIn),
      debt: Number(wallet.debt),
      totalEarned: Number(wallet.totalEarned)
    },
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
    })),
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      customerName: b.customerName,
      totalAmount: Number(b.totalAmount),
      vendorAmount: Number(b.vendorAmount ?? b.totalAmount),
      paymentMethod: b.paymentMethod,
      paymentStatus: b.paymentStatus,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
      paidAt: b.paidAt ? b.paidAt.toISOString() : null,
      trip: {
        origin: b.trip.origin,
        destination: b.trip.destination,
        departureTime: b.trip.departureTime.toISOString()
      }
    }))
  };

  return <StaffBookingsPageContent initialData={serializedData} />;
}
