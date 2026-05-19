import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorAuth, isOwnerAuthFailure, ownerAuthErrorResponse } from "@/lib/owner-auth";

export async function GET(req: NextRequest) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const templates = await prisma.tripTemplate.findMany({
      where: { vendorId: auth.vendorId },
      include: {
        schedules: {
          include: {
            vehicle: true,
            driver: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("GET /api/vendor/trip-templates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const body = await req.json();
    const {
      name, origin, destination, originDetail, destinationDetail,
      price, amenities, minBooking, bookingDeadlineHours, notes,
      schedules // Array of TripTemplateSchedule objects
    } = body;

    const template = await prisma.tripTemplate.create({
      data: {
        vendorId: auth.vendorId,
        name,
        origin,
        destination,
        originDetail,
        destinationDetail,
        price,
        amenities: amenities || [],
        minBooking: minBooking || 1,
        bookingDeadlineHours,
        notes,
        schedules: {
          create: schedules.map((s: any) => ({
            vehicleId: s.vehicleId,
            driverId: s.driverId || null,
            dayOfWeek: s.dayOfWeek,
            departureTime: s.departureTime,
            priceOverride: s.priceOverride && s.priceOverride !== "" ? parseFloat(s.priceOverride) : null,
          }))
        }
      },
      include: {
        schedules: {
          include: {
            vehicle: true,
            driver: true,
          }
        }
      }
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("POST /api/vendor/trip-templates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
