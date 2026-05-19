import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const originParam = searchParams.get("origin")?.trim();
    const destinationParam = searchParams.get("destination")?.trim();
    const dateStr = searchParams.get("date");
    const passengers = Number(searchParams.get("passengers")) || 1;

    if (!originParam || !destinationParam || !dateStr) {
      return NextResponse.json(
        { error: "Parameter origin, destination, dan date wajib diisi." },
        { status: 400 }
      );
    }

    const date = parseISO(dateStr);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // 1. Resolve origin (code, id, or name) to actual City record
    const originCity = await prisma.city.findFirst({
      where: {
        OR: [
          { code: { equals: originParam, mode: "insensitive" } },
          { id: { equals: originParam } },
          { name: { contains: originParam, mode: "insensitive" } }
        ]
      }
    });
    const originSearchName = originCity ? originCity.name : originParam;

    // 2. Resolve destination (code, id, or name) to actual City record
    const destCity = await prisma.city.findFirst({
      where: {
        OR: [
          { code: { equals: destinationParam, mode: "insensitive" } },
          { id: { equals: destinationParam } },
          { name: { contains: destinationParam, mode: "insensitive" } }
        ]
      }
    });
    const destSearchName = destCity ? destCity.name : destinationParam;

    console.log(`Resolving Search: Origin "${originParam}" -> "${originSearchName}", Destination "${destinationParam}" -> "${destSearchName}"`);

    // 3. Search trips matching resolved names and date
    const trips = await prisma.trip.findMany({
      where: {
        AND: [
          {
            OR: [
              { origin: { equals: originSearchName, mode: "insensitive" } },
              { origin: { contains: originSearchName, mode: "insensitive" } }
            ]
          },
          {
            OR: [
              { destination: { equals: destSearchName, mode: "insensitive" } },
              { destination: { contains: destSearchName, mode: "insensitive" } }
            ]
          }
        ],
        departureTime: {
          gte: dayStart,
          lte: dayEnd
        },
        status: {
          in: ["SCHEDULED", "DELAYED", "WAITING_DRIVER"]
        }
      },
      include: {
        vehicle: true,
        seats: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        departureTime: "asc"
      }
    });

    // Map DB schema to UI structure expected by front-end
    const formattedTrips = trips.map((trip) => {
      const totalSeats = trip.vehicle.capacity;
      const bookedCount = trip.seats.filter((s) => s.status === "BOOKED").length;
      const availableSeats = Math.max(totalSeats - bookedCount, 0);

      return {
        id: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        provider: `${trip.vehicle.brand} ${trip.vehicle.model}`,
        departureTime: trip.departureTime.toISOString(),
        duration: trip.durationMinutes ? `${Math.floor(trip.durationMinutes / 60)}j ${trip.durationMinutes % 60}m` : "3 jam",
        imageUrl: trip.vehicle.imageUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
        features: trip.amenities,
        amenities: trip.amenities,
        pricePerSeat: Number(trip.price),
        availableSeats,
        totalSeats,
        vehicleType: totalSeats <= 6 ? "KELAS BISNIS" : totalSeats <= 12 ? "KELAS PREMIUM" : "KELAS EKONOMI",
        description: trip.notes || `Armada prima dengan kapasitas maksimal ${totalSeats} penumpang.`
      };
    });

    // Filter by passenger capacity availability
    const availableTrips = formattedTrips.filter((t) => t.availableSeats >= passengers);

    return NextResponse.json(availableTrips);
  } catch (error: any) {
    console.error("Error searching public trips:", error);
    return NextResponse.json({ error: error.message || "Gagal mencari perjalanan." }, { status: 500 });
  }
}
