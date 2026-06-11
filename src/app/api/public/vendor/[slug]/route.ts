/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Fetch vendor profile
    const vendor = await prisma.vendor.findUnique({
      where: { slug },
      include: {
        city: {
          include: {
            province: true,
          },
        },
        policies: {
          where: { isActive: true },
          orderBy: { order: "asc" },
        },
        vehicles: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            brand: true,
            model: true,
            capacity: true,
            imageUrl: true,
            licensePlate: true,
            color: true,
          },
        },
      },
    });

    if (!vendor || !vendor.isActive) {
      return NextResponse.json(
        { error: "Vendor tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Today's trips
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const todayTrips = await prisma.trip.findMany({
      where: {
        vehicle: { vendorId: vendor.id },
        departureTime: { gte: todayStart, lte: todayEnd },
        status: { in: ["SCHEDULED", "DELAYED", "WAITING_DRIVER"] },
      },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            capacity: true,
            imageUrl: true,
          },
        },
        seats: {
          select: { status: true },
        },
      },
      orderBy: { departureTime: "asc" },
    });

    // 3. Upcoming trips (next 7 days, excluding today)
    const tomorrowStart = startOfDay(addDays(now, 1));
    const weekEnd = endOfDay(addDays(now, 7));

    const upcomingTrips = await prisma.trip.findMany({
      where: {
        vehicle: { vendorId: vendor.id },
        departureTime: { gte: tomorrowStart, lte: weekEnd },
        status: { in: ["SCHEDULED", "DELAYED", "WAITING_DRIVER"] },
      },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            capacity: true,
          },
        },
        seats: {
          select: { status: true },
        },
      },
      orderBy: { departureTime: "asc" },
      take: 10,
    });

    // 4. Popular routes — aggregate from recent trips
    const recentTrips = await prisma.trip.findMany({
      where: {
        vehicle: { vendorId: vendor.id },
      },
      select: {
        origin: true,
        destination: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const routeMap = new Map<string, number>();
    for (const t of recentTrips) {
      const key = `${t.origin}→${t.destination}`;
      routeMap.set(key, (routeMap.get(key) || 0) + 1);
    }
    const popularRoutes = Array.from(routeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([route, count]) => {
        const [origin, destination] = route.split("→");
        return { origin, destination, count };
      });

    // 5. Stats
    const completedTripsCount = await prisma.trip.count({
      where: {
        vehicle: { vendorId: vendor.id },
        status: "COMPLETED",
      },
    });

    // Format trips for frontend
    const formatTrip = (trip: any) => {
      const totalSeats = trip.vehicle.capacity;
      const bookedCount = trip.seats.filter(
        (s: any) => s.status === "BOOKED"
      ).length;
      const availableSeats = Math.max(totalSeats - bookedCount, 0);

      return {
        id: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        originDetail: trip.originDetail,
        destinationDetail: trip.destinationDetail,
        departureTime: trip.departureTime.toISOString(),
        arrivalTime: trip.arrivalTime?.toISOString() || null,
        durationMinutes: trip.durationMinutes,
        price: Number(trip.price),
        status: trip.status,
        vehicle: trip.vehicle,
        totalSeats,
        availableSeats,
        amenities: trip.amenities || [],
      };
    };

    return NextResponse.json({
      vendor: {
        id: vendor.id,
        name: vendor.name,
        slug: vendor.slug,
        description: vendor.description,
        address: vendor.address,
        phone: vendor.phone,
        email: vendor.email,
        logo: vendor.logo,
        city: vendor.city
          ? {
            name: vendor.city.name,
            province: vendor.city.province?.name || null,
          }
          : null,
      },
      todayTrips: todayTrips.map(formatTrip),
      upcomingTrips: upcomingTrips.map(formatTrip),
      popularRoutes,
      fleet: vendor.vehicles,
      policies: vendor.policies.map((p) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        content: p.content,
      })),
      stats: {
        completedTrips: completedTripsCount,
        activeFleet: vendor.vehicles.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching vendor landing:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memuat data vendor." },
      { status: 500 }
    );
  }
}
