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
        { error: "Unauthorized. Only Super Admin can access dashboard statistics." },
        { status: 403 }
      );
    }

    // 1. Get counts
    const [userCount, vendorCount, vehicleCount, tripCount, bookingCount] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.vehicle.count(),
      prisma.trip.count(),
      prisma.booking.count(),
    ]);

    // 2. Financial aggregated statistics
    const wallets = await prisma.vendorWallet.findMany();
    const totalVendorBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
    const totalVendorDebt = wallets.reduce((sum, w) => sum + Number(w.debt), 0);
    const totalPendingIn = wallets.reduce((sum, w) => sum + Number(w.pendingIn), 0);

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

    // 3. Recent Bookings (limit 5)
    const recentBookings = await prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        bookingCode: true,
        customerName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        trip: {
          select: {
            origin: true,
            destination: true,
            departureTime: true,
            vehicle: {
              select: {
                vendor: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    // 4. Recent Trip Activities (limit 5)
    const recentTripActivities = await prisma.tripActivity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        trip: {
          select: {
            origin: true,
            destination: true,
            departureTime: true,
            vehicle: {
              select: {
                vendor: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    // 5. Pending Withdraw Requests (limit 5)
    const pendingWithdrawals = await prisma.withdrawRequest.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { requestedAt: "desc" },
      include: {
        wallet: {
          include: {
            vendor: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        users: userCount,
        vendors: vendorCount,
        vehicles: vehicleCount,
        trips: tripCount,
        bookings: bookingCount,
      },
      finance: {
        platformRevenue,
        totalVendorDebt,
        totalVendorBalance,
        totalPendingIn,
      },
      recentBookings,
      recentTripActivities,
      pendingWithdrawals,
    });
  } catch (error: any) {
    console.error("Error fetching admin dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
