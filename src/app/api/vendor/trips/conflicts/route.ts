/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireVendorAuth,
  isOwnerAuthFailure,
  ownerAuthErrorResponse,
} from "@/lib/owner-auth";

// ─── POST /api/vendor/trips/conflicts ───
// Check conflicts before creating/updating a trip
export async function POST(req: NextRequest) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const body = await req.json();
    const { vehicleId, driverId, departureTime, arrivalTime, durationMinutes, excludeTripId } =
      body;

    if (!departureTime || !vehicleId) {
      return NextResponse.json(
        { error: "departureTime dan vehicleId wajib diisi." },
        { status: 400 }
      );
    }

    const depTime = new Date(departureTime);
    const arrTime = arrivalTime
      ? new Date(arrivalTime)
      : new Date(depTime.getTime() + (durationMinutes || 120) * 60000);

    const excludeFilter: any = excludeTripId ? { not: excludeTripId } : undefined;

    // Vehicle conflicts
    const vehicleConflicts = await prisma.trip.findMany({
      where: {
        id: excludeFilter,
        vehicleId,
        status: { notIn: ["CANCELLED", "COMPLETED", "RESCHEDULED"] },
        OR: [
          { departureTime: { lte: arrTime }, arrivalTime: { gte: depTime } },
          { departureTime: { gte: depTime, lte: arrTime } },
        ],
      },
      include: {
        vehicle: { select: { licensePlate: true, name: true } },
        driver: { select: { name: true } },
      },
    });

    // Driver conflicts
    let driverConflicts: any[] = [];
    if (driverId) {
      driverConflicts = await prisma.trip.findMany({
        where: {
          id: excludeFilter,
          driverId,
          status: { notIn: ["CANCELLED", "COMPLETED", "RESCHEDULED"] },
          OR: [
            { departureTime: { lte: arrTime }, arrivalTime: { gte: depTime } },
            { departureTime: { gte: depTime, lte: arrTime } },
          ],
        },
        include: {
          vehicle: { select: { licensePlate: true, name: true } },
          driver: { select: { name: true } },
        },
      });
    }

    return NextResponse.json({
      hasConflict: vehicleConflicts.length > 0 || driverConflicts.length > 0,
      vehicleConflicts,
      driverConflicts,
    });
  } catch (error) {
    console.error("Conflict check error:", error);
    return NextResponse.json(
      { error: "Gagal memeriksa konflik." },
      { status: 500 }
    );
  }
}
