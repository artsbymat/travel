/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireVendorAuth,
  isOwnerAuthFailure,
  ownerAuthErrorResponse,
} from "@/lib/owner-auth";

// ─── POST /api/vendor/trips/[id]/reschedule ───
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const { id } = await params;
    const body = await req.json();
    const { newDepartureTime, newArrivalTime, reason, newVehicleId, newDriverId } = body;

    if (!newDepartureTime || !reason) {
      return NextResponse.json(
        { error: "newDepartureTime dan reason wajib diisi." },
        { status: 400 }
      );
    }

    // Fetch original trip
    const oldTrip = await prisma.trip.findFirst({
      where: {
        id,
        vehicle: { vendorId: auth.vendorId },
      },
      include: {
        vehicle: true,
        bookings: true,
        seats: true,
      },
    });

    if (!oldTrip) {
      return NextResponse.json(
        { error: "Trip tidak ditemukan." },
        { status: 404 }
      );
    }

    if (oldTrip.status === "CANCELLED" || oldTrip.status === "RESCHEDULED") {
      return NextResponse.json(
        { error: "Trip yang sudah dibatalkan atau dijadwal ulang tidak bisa direschedule." },
        { status: 400 }
      );
    }

    const depTime = new Date(newDepartureTime);
    const arrTime = newArrivalTime
      ? new Date(newArrivalTime)
      : new Date(depTime.getTime() + (oldTrip.durationMinutes || 120) * 60000);
    const vId = newVehicleId || oldTrip.vehicleId;
    const dId = newDriverId || oldTrip.driverId;

    // Conflict checks
    const vehicleConflicts = await prisma.trip.findMany({
      where: {
        id: { not: id },
        vehicleId: vId,
        status: { notIn: ["CANCELLED", "COMPLETED", "RESCHEDULED"] },
        OR: [
          { departureTime: { lte: arrTime }, arrivalTime: { gte: depTime } },
          { departureTime: { gte: depTime, lte: arrTime } },
        ],
      },
    });

    if (vehicleConflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Kendaraan memiliki jadwal bentrok pada waktu baru.",
          conflicts: vehicleConflicts,
        },
        { status: 409 }
      );
    }

    if (dId) {
      const driverConflicts = await prisma.trip.findMany({
        where: {
          id: { not: id },
          driverId: dId,
          status: { notIn: ["CANCELLED", "COMPLETED", "RESCHEDULED"] },
          OR: [
            { departureTime: { lte: arrTime }, arrivalTime: { gte: depTime } },
            { departureTime: { gte: depTime, lte: arrTime } },
          ],
        },
      });

      if (driverConflicts.length > 0) {
        return NextResponse.json(
          {
            error: "Driver memiliki jadwal bentrok pada waktu baru.",
            conflicts: driverConflicts,
          },
          { status: 409 }
        );
      }
    }

    // Execute reschedule in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Mark old trip as RESCHEDULED
      await tx.trip.update({
        where: { id },
        data: { status: "RESCHEDULED" },
      });

      // 2. Create new trip
      const newTrip = await tx.trip.create({
        data: {
          origin: oldTrip.origin,
          destination: oldTrip.destination,
          originDetail: oldTrip.originDetail,
          destinationDetail: oldTrip.destinationDetail,
          departureTime: depTime,
          arrivalTime: arrTime,
          durationMinutes: oldTrip.durationMinutes,
          price: oldTrip.price,
          amenities: oldTrip.amenities,
          bookingDeadline: oldTrip.bookingDeadline
            ? new Date(
                depTime.getTime() -
                  (oldTrip.departureTime.getTime() -
                    oldTrip.bookingDeadline.getTime())
              )
            : null,
          notes: oldTrip.notes,
          vehicleId: vId,
          driverId: dId,
          templateId: oldTrip.templateId,
          rescheduledFromId: id,
          rescheduledReason: reason,
          status: "SCHEDULED",
        },
      });

      // 3. Generate new seats
      const vehicle = await tx.vehicle.findUnique({ where: { id: vId } });
      if (vehicle?.seatLayout) {
        const layout = vehicle.seatLayout as any;
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

      // 4. Transfer bookings: create new bookings for new trip
      for (const booking of oldTrip.bookings) {
        if (booking.status === "CONFIRMED" || booking.status === "PENDING") {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: "TRANSFERRED",
              tripId: newTrip.id,
            },
          });
        }
      }

      // 5. Audit log for old trip
      await tx.tripActivity.create({
        data: {
          tripId: id,
          userId: auth.userId,
          action: "RESCHEDULE",
          description: `Trip dijadwal ulang ke ${depTime.toISOString()}. Alasan: ${reason}`,
          oldData: {
            departureTime: oldTrip.departureTime.toISOString(),
            vehicleId: oldTrip.vehicleId,
            driverId: oldTrip.driverId,
          },
          newData: {
            newTripId: newTrip.id,
            departureTime: depTime.toISOString(),
            vehicleId: vId,
            driverId: dId,
            reason,
          },
        },
      });

      // 6. Audit log for new trip
      await tx.tripActivity.create({
        data: {
          tripId: newTrip.id,
          userId: auth.userId,
          action: "CREATE_FROM_RESCHEDULE",
          description: `Trip dibuat dari reschedule trip ${id}`,
          newData: {
            rescheduledFromId: id,
            reason,
          },
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
    console.error("Reschedule trip error:", error);
    return NextResponse.json(
      { error: "Gagal melakukan reschedule." },
      { status: 500 }
    );
  }
}
