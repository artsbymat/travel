import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const tripId = resolvedParams.id;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        vehicle: true,
        seats: true,
        bookings: true
      }
    });

    if (!trip) {
      return NextResponse.json({ error: "Perjalanan tidak ditemukan." }, { status: 404 });
    }

    // Self-healing: if no TripSeats exist in the database for this trip, initialize them from vehicle's seatLayout JSON!
    let dbSeats = trip.seats;
    if (dbSeats.length === 0 && trip.vehicle.seatLayout) {
      try {
        const layoutObj = trip.vehicle.seatLayout as any;
        const seatsToCreate = layoutObj.seats || [];

        await prisma.tripSeat.createMany({
          data: seatsToCreate.map((s: any) => ({
            tripId: trip.id,
            seatNo: s.id || `${s.row}-${s.column}`,
            row: Number(s.row),
            column: Number(s.column),
            status: "AVAILABLE"
          }))
        });

        // Refetch seats
        dbSeats = await prisma.tripSeat.findMany({
          where: { tripId: trip.id }
        });
      } catch (err) {
        console.error("Failed to dynamically auto-initialize TripSeats:", err);
      }
    }

    // Format seats status into available/booked/locked
    const formattedSeats = dbSeats.map((seat) => {
      let uiStatus: "available" | "booked" | "locked" = "available";
      if (seat.status === "BOOKED") {
        uiStatus = "booked";
      } else if (seat.status === "BLOCKED" || seat.status === "BROKEN") {
        uiStatus = "locked";
      }
      return {
        id: seat.seatNo,
        row: seat.row,
        column: seat.column,
        status: uiStatus
      };
    });

    // Formulate a clean layout format
    let finalLayout = {
      rows: 5,
      columns: 3,
      driverPosition: { row: 1, column: 3 },
      seats: formattedSeats
    };

    if (trip.vehicle.seatLayout) {
      const vLayout = trip.vehicle.seatLayout as any;
      finalLayout = {
        rows: Number(vLayout.rows) || 5,
        columns: Number(vLayout.columns) || 3,
        driverPosition: vLayout.driverPosition || { row: 1, column: 3 },
        seats: formattedSeats
      };
    }

    // Load active vendor details
    const vendor = await prisma.vendor.findUnique({
      where: { id: trip.vehicle.vendorId },
      include: {
        refundPolicies: {
          where: { isActive: true },
          orderBy: { hoursBeforeDeparture: "desc" }
        }
      }
    });

    const responseData = {
      trip: {
        id: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        departureDate: trip.departureTime.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        departureTime: trip.departureTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit"
        }) + " WIB",
        arrivalTime: trip.arrivalTime ? trip.arrivalTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit"
        }) + " WIB" : undefined,
        duration: trip.durationMinutes ? `${Math.floor(trip.durationMinutes / 60)} jam` : "3 jam",
        provider: `${trip.vehicle.brand} ${trip.vehicle.model}`,
        vehicleType: trip.vehicle.capacity <= 6 ? "KELAS BISNIS" : trip.vehicle.capacity <= 12 ? "KELAS PREMIUM" : "KELAS EKONOMI",
        imageUrl: trip.vehicle.imageUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
        amenities: trip.amenities,
        pickupPoint: trip.originDetail || `Pool ${trip.origin}`,
        dropoffPoint: trip.destinationDetail || `Pool ${trip.destination}`,
        pricePerSeat: Number(trip.price),
        platformFeeRate: vendor?.platformFeeRate ? Number(vendor.platformFeeRate) : 2.0, // Dynamic percentage rate
        minPassengers: trip.minBooking || 1,
        bookedPassengers: trip.bookings.filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED").reduce((sum, b) => sum + b.seatCount, 0),
        vendor: {
          id: vendor?.id,
          name: vendor?.name,
          acceptCash: vendor?.acceptCash ?? true,
          refundPolicies: vendor?.refundPolicies.map(p => ({
            hours: p.hoursBeforeDeparture,
            percentage: Number(p.refundPercentage),
            description: p.description
          })) || []
        }
      },
      seatLayout: finalLayout
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching dynamic trip detail:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat detail perjalanan." }, { status: 500 });
  }
}
