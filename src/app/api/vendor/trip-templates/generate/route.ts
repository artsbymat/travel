import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorAuth, isOwnerAuthFailure, ownerAuthErrorResponse } from "@/lib/owner-auth";
import dayjs from "dayjs";

const DAYS_MAP: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

export async function POST(req: NextRequest) {
  const auth = await requireVendorAuth();
  if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

  try {
    const { startDate, endDate, templateIds } = await req.json();

    const start = dayjs(startDate).startOf("day");
    const end = dayjs(endDate).endOf("day");

    if (!start.isValid() || !end.isValid() || end.isBefore(start)) {
      return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
    }

    // Fetch active templates and schedules
    const templates = await prisma.tripTemplate.findMany({
      where: {
        vendorId: auth.vendorId,
        isActive: true,
        ...(templateIds && templateIds.length > 0 ? { id: { in: templateIds } } : {})
      },
      include: {
        schedules: {
          where: { 
            isActive: true,
            vehicle: { status: "ACTIVE" } // Only generate for ACTIVE vehicles
          },
          include: { vehicle: true }
        }
      }
    });

    let generatedCount = 0;
    const errors: string[] = [];

    // Process inside a single transaction or loop? Loop is safer for conflicts.
    let currentDate = start.clone();
    
    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      const dayOfWeekStr = DAYS_MAP[currentDate.day()];

      for (const template of templates) {
        const matchingSchedules = template.schedules.filter(s => s.dayOfWeek === dayOfWeekStr);

        for (const schedule of matchingSchedules) {
          const [hours, minutes] = schedule.departureTime.split(":").map(Number);
          const depTime = currentDate.clone().hour(hours).minute(minutes).second(0).millisecond(0).toDate();

          // Standard 2 hours duration if not set
          const arrTime = dayjs(depTime).add(120, 'minute').toDate();

          // Check for exact duplicate trip created from template
          const duplicate = await prisma.trip.findFirst({
            where: {
              templateId: template.id,
              departureTime: depTime,
              status: { notIn: ["CANCELLED"] }
            }
          });

          if (duplicate) continue;

          // Check for vehicle conflict
          const vehicleConflict = await prisma.trip.findFirst({
            where: {
              vehicleId: schedule.vehicleId,
              status: { notIn: ["CANCELLED", "COMPLETED", "RESCHEDULED"] },
              OR: [
                { departureTime: { lte: arrTime }, arrivalTime: { gte: depTime } },
                { departureTime: { gte: depTime, lte: arrTime } },
              ],
            }
          });

          if (vehicleConflict) {
            errors.push(`Kendaraan ${schedule.vehicle.licensePlate} sibuk pada ${dayjs(depTime).format('DD MMM YYYY HH:mm')}`);
            continue;
          }

          // Generate seats
          const layout = schedule.vehicle.seatLayout as any;
          const seats = layout?.seats || [];
          const seatsData = seats.map((seat: any) => ({
            seatNo: seat.label || `${seat.row}-${seat.col}`,
            row: seat.row,
            column: seat.col,
            status: seat.status === "BROKEN" ? "BROKEN" : "AVAILABLE",
          }));

          // Create trip
          await prisma.trip.create({
            data: {
              origin: template.origin,
              destination: template.destination,
              originDetail: template.originDetail,
              destinationDetail: template.destinationDetail,
              departureTime: depTime,
              arrivalTime: arrTime,
              durationMinutes: 120, // Default for now
              price: schedule.priceOverride ?? template.price,
              amenities: template.amenities,
              minBooking: template.minBooking,
              bookingDeadline: template.bookingDeadlineHours 
                ? dayjs(depTime).subtract(template.bookingDeadlineHours, 'hour').toDate()
                : null,
              notes: template.notes,
              vehicleId: schedule.vehicleId,
              driverId: schedule.driverId,
              templateId: template.id,
              scheduleId: schedule.id,
              status: "SCHEDULED",
              seats: {
                create: seatsData
              },
              activities: {
                create: {
                  userId: auth.userId,
                  action: "CREATE",
                  description: `Trip otomatis digenerate dari Template: ${template.name}`,
                  newData: {
                    generatedAt: new Date().toISOString()
                  }
                }
              }
            }
          });

          generatedCount++;
        }
      }
      currentDate = currentDate.add(1, "day");
    }

    return NextResponse.json({ success: true, generatedCount, errors });
  } catch (error: any) {
    console.error("POST /api/vendor/trip-templates/generate error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
