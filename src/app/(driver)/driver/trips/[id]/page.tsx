/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TripOperationsClient from "./TripOperationsClient";

export const dynamic = "force-dynamic";

export default async function DriverTripDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  const resolvedParams = await params;
  const driverId = session.user.id;
  const tripId = resolvedParams.id;

  // 1. Fetch Trip Detail with seats and bookings
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      driverId
    },
    include: {
      vehicle: true,
      seats: {
        include: {
          booking: true
        }
      }
    }
  });

  if (!trip) {
    redirect("/driver");
  }

  // 2. Fetch Boarding Activities to check who has checked in
  const checkedInActivities = await prisma.tripActivity.findMany({
    where: {
      tripId,
      action: "BOARDING_CHECK_IN"
    }
  });

  // Extract checked in seat numbers
  const checkedInSeats = checkedInActivities
    .map((act) => {
      const data = act.newData as any;
      return data?.seatNo;
    })
    .filter(Boolean);

  // 3. Serialize data for Client Component
  const serializedTrip = {
    id: trip.id,
    origin: trip.origin,
    destination: trip.destination,
    originDetail: trip.originDetail,
    destinationDetail: trip.destinationDetail,
    departureTime: trip.departureTime.toISOString(),
    arrivalTime: trip.arrivalTime ? trip.arrivalTime.toISOString() : null,
    price: Number(trip.price),
    status: trip.status,
    notes: trip.notes,
    vehicle: {
      id: trip.vehicle.id,
      licensePlate: trip.vehicle.licensePlate,
      brand: trip.vehicle.brand,
      model: trip.vehicle.model,
      capacity: trip.vehicle.capacity,
      seatLayout: trip.vehicle.seatLayout
    },
    seats: trip.seats.map((s) => ({
      id: s.id,
      seatNo: s.seatNo,
      row: s.row,
      column: s.column,
      status: s.status,
      bookingId: s.bookingId,
      booking: s.booking
        ? {
            id: s.booking.id,
            bookingCode: s.booking.bookingCode,
            customerName: s.booking.customerName,
            customerPhone: s.booking.customerPhone,
            paymentStatus: s.booking.paymentStatus,
            paymentMethod: s.booking.paymentMethod,
            totalAmount: Number(s.booking.totalAmount),
            status: s.booking.status,
            pickupLat: s.booking.pickupLat,
            pickupLng: s.booking.pickupLng,
            pickupAddress: s.booking.pickupAddress,
            notes: s.booking.notes
          }
        : null
    }))
  };

  return <TripOperationsClient trip={serializedTrip} checkedInSeats={checkedInSeats as string[]} />;
}
