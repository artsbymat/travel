/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireVendorAuth,
  isOwnerAuthFailure,
  ownerAuthErrorResponse,
} from "@/lib/owner-auth";

// ─── GET /api/vendor/trips/[id] ───
export async function GET(
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
        driver: {
          include: {
            profile: {
              select: {
                photoUrl: true,
                simNumber: true,
              },
            },
          },
        },
        seats: {
          orderBy: [{ row: "asc" }, { column: "asc" }],
        },
        bookings: {
          include: {
            seats: {
              select: { seatNo: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        rescheduledFrom: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            status: true,
          },
        },
        rescheduledTo: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureTime: true,
            status: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            seats: true,
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Trip tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Get trip error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data trip." },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/vendor/trips/[id] ───
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const { id } = await params;
    const body = await req.json();

    const trip = await prisma.trip.findFirst({
      where: {
        id,
        vehicle: { vendorId: auth.vendorId },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Trip tidak ditemukan." },
        { status: 404 }
      );
    }

    const allowedFields = [
      "departureTime",
      "arrivalTime",
      "durationMinutes",
      "vehicleId",
      "driverId",
      "price",
      "notes",
      "status",
      "bookingDeadline",
      "origin",
      "destination",
      "originDetail",
      "destinationDetail",
      "minBooking",
    ];

    const updateData: any = {};
    const oldData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        oldData[field] = (trip as any)[field];
        if (field === "departureTime" || field === "arrivalTime" || field === "bookingDeadline") {
          updateData[field] = new Date(body[field]);
        } else if (field === "price") {
          updateData[field] = parseFloat(body[field]);
        } else if (field === "durationMinutes" || field === "minBooking") {
          updateData[field] = parseInt(body[field].toString());
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Conflict checks if time or vehicle/driver changed
    if (updateData.vehicleId || updateData.departureTime || updateData.arrivalTime) {
      const depTime = updateData.departureTime || trip.departureTime;
      const arrTime =
        updateData.arrivalTime ||
        trip.arrivalTime ||
        new Date(new Date(depTime).getTime() + (trip.durationMinutes || 120) * 60000);

      const vId = updateData.vehicleId || trip.vehicleId;

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
            error: "Kendaraan memiliki jadwal bentrok.",
            conflicts: vehicleConflicts,
          },
          { status: 409 }
        );
      }
    }

    if (updateData.driverId || updateData.departureTime || updateData.arrivalTime) {
      const dId = updateData.driverId || trip.driverId;
      if (dId) {
        const depTime = updateData.departureTime || trip.departureTime;
        const arrTime =
          updateData.arrivalTime ||
          trip.arrivalTime ||
          new Date(new Date(depTime).getTime() + (trip.durationMinutes || 120) * 60000);

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
              error: "Driver memiliki jadwal bentrok.",
              conflicts: driverConflicts,
            },
            { status: 409 }
          );
        }
      }
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: updateData,
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

      // Determine action for audit log
      let action = "UPDATE";
      let description = "Trip diupdate";

      if (updateData.status) {
        action = `STATUS_${updateData.status}`;
        description = `Status diubah menjadi ${updateData.status}`;
      }
      if (updateData.vehicleId) {
        action = "CHANGE_VEHICLE";
        description = "Kendaraan diubah";
      }
      if (updateData.driverId) {
        action = "CHANGE_DRIVER";
        description = "Driver diubah";
      }

      await tx.tripActivity.create({
        data: {
          tripId: id,
          userId: auth.userId,
          action,
          description,
          oldData,
          newData: updateData,
        },
      });

      return updatedTrip;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update trip error:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate trip." },
      { status: 500 }
    );
  }
}
