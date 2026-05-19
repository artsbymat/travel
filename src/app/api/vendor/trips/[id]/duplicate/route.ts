/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireVendorAuth,
  isOwnerAuthFailure,
  ownerAuthErrorResponse,
} from "@/lib/owner-auth";

// ─── POST /api/vendor/trips/[id]/duplicate ───
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const { id } = await params;

    const trip = await prisma.trip.findFirst({
      where: {
        id,
        vehicle: { vendorId: auth.vendorId },
      },
      include: {
        vehicle: true,
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Trip tidak ditemukan." },
        { status: 404 }
      );
    }

    if (trip.vehicle.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Kendaraan sedang dalam status ${trip.vehicle.status === "MAINTENANCE" ? "Service/Maintenance" : "Tidak Aktif"}. Tidak dapat membuat jadwal perjalanan baru.` },
        { status: 400 }
      );
    }

    // Create duplicate with next day departure
    const newDepartureTime = new Date(trip.departureTime);
    newDepartureTime.setDate(newDepartureTime.getDate() + 1);

    const newArrivalTime = trip.arrivalTime
      ? new Date(
          newDepartureTime.getTime() +
            (trip.arrivalTime.getTime() - trip.departureTime.getTime())
        )
      : null;

    const newBookingDeadline = trip.bookingDeadline
      ? new Date(
          newDepartureTime.getTime() -
            (trip.departureTime.getTime() - trip.bookingDeadline.getTime())
        )
      : null;

    // Conflict detection: Vehicle
    const vehicleConflicts = await prisma.trip.findMany({
      where: {
        vehicleId: trip.vehicleId,
        status: { notIn: ["CANCELLED", "COMPLETED", "RESCHEDULED"] },
        OR: [
          {
            departureTime: { lte: newArrivalTime || newDepartureTime },
            arrivalTime: { gte: newDepartureTime },
          },
          {
            departureTime: { gte: newDepartureTime, lte: newArrivalTime || newDepartureTime },
          },
        ],
      },
    });

    if (vehicleConflicts.length > 0) {
      return NextResponse.json(
        {
          error: `Kendaraan ${trip.vehicle.licensePlate} sudah memiliki trip pada waktu tersebut.`,
          conflicts: vehicleConflicts,
        },
        { status: 409 }
      );
    }

    // Conflict detection: Driver
    if (trip.driverId) {
      const driverConflicts = await prisma.trip.findMany({
        where: {
          driverId: trip.driverId,
          status: { notIn: ["CANCELLED", "COMPLETED", "RESCHEDULED"] },
          OR: [
            {
              departureTime: { lte: newArrivalTime || newDepartureTime },
              arrivalTime: { gte: newDepartureTime },
            },
            {
              departureTime: { gte: newDepartureTime, lte: newArrivalTime || newDepartureTime },
            },
          ],
        },
      });

      if (driverConflicts.length > 0) {
        return NextResponse.json(
          {
            error: "Driver sudah memiliki trip pada waktu tersebut.",
            conflicts: driverConflicts,
          },
          { status: 409 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const newTrip = await tx.trip.create({
        data: {
          origin: trip.origin,
          destination: trip.destination,
          originDetail: trip.originDetail,
          destinationDetail: trip.destinationDetail,
          departureTime: newDepartureTime,
          arrivalTime: newArrivalTime,
          durationMinutes: trip.durationMinutes,
          price: trip.price,
          amenities: trip.amenities,
          bookingDeadline: newBookingDeadline,
          notes: trip.notes,
          vehicleId: trip.vehicleId,
          driverId: trip.driverId,
          status: "SCHEDULED",
        },
      });

      // Generate seats
      if (trip.vehicle.seatLayout) {
        const layout = trip.vehicle.seatLayout as any;
        const seats = layout.seats || [];
        if (seats.length > 0) {
          await tx.tripSeat.createMany({
            data: seats.map((seat: any) => ({
              seatNo: seat.label || `${seat.row}-${seat.col}`,
              row: seat.row,
              column: seat.col,
              status: seat.status === "BROKEN" ? "BROKEN" : "AVAILABLE",
              tripId: newTrip.id,
            })),
          });
        }
      }

      await tx.tripActivity.create({
        data: {
          tripId: newTrip.id,
          userId: auth.userId,
          action: "DUPLICATE",
          description: `Trip diduplikasi dari trip ${id}`,
          newData: { duplicatedFromId: id },
        },
      });

      return newTrip;
    });

    const fullTrip = await prisma.trip.findUnique({
      where: { id: result.id },
      include: {
        vehicle: true,
        driver: {
          include: {
            profile: { select: { photoUrl: true, simNumber: true } },
          },
        },
        seats: true,
        _count: { select: { bookings: true, seats: true } },
      },
    });

    return NextResponse.json(fullTrip, { status: 201 });
  } catch (error) {
    console.error("Duplicate trip error:", error);
    return NextResponse.json(
      { error: "Gagal menduplikasi trip." },
      { status: 500 }
    );
  }
}
