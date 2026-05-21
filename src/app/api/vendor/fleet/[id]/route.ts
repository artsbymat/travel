import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorAuth, isOwnerAuthFailure, ownerAuthErrorResponse } from "@/lib/owner-auth";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireVendorAuth();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    const { id } = await params;

    try {
        const body = await req.json();
        const { licensePlate, name, brand, model, year, capacity, color, status, imageUrl, images, seatLayout } = body;

        // Verify ownership
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
        });

        if (!vehicle || vehicle.vendorId !== auth.vendorId) {
            return NextResponse.json({ error: "Armada tidak ditemukan." }, { status: 404 });
        }

        // Check unique license plate if changed
        if (licensePlate && licensePlate !== vehicle.licensePlate) {
            const existing = await prisma.vehicle.findUnique({ where: { licensePlate } });
            if (existing) {
                return NextResponse.json({ error: "Plat nomor sudah terdaftar." }, { status: 400 });
            }
        }

        // Auto-calculate capacity from seatLayout if provided
        let finalCapacity = capacity ? parseInt(capacity) : undefined;
        if (seatLayout && seatLayout.seats && Array.isArray(seatLayout.seats)) {
            finalCapacity = seatLayout.seats.length;
        }

        const updated = await prisma.vehicle.update({
            where: { id },
            data: {
                licensePlate,
                name,
                brand,
                model,
                year: year ? parseInt(year) : undefined,
                capacity: finalCapacity,
                color,
                status,
                imageUrl,
                seatLayout,
            },
        });

        // ─── AUTO-TRANSFER OR CANCEL LOGIC ───
        // If vehicle becomes INACTIVE or MAINTENANCE, process future trips and their bookings
        let transferredBookingsCount = 0;
        let cancelledBookingsCount = 0;
        let cancelledTripsCount = 0;

        if (status && status !== "ACTIVE") {
            const now = new Date();
            const futureTrips = await prisma.trip.findMany({
                where: {
                    vehicleId: id,
                    departureTime: { gt: now },
                    status: { notIn: ["CANCELLED", "COMPLETED"] }
                },
                include: {
                    bookings: {
                        where: {
                            status: { notIn: ["CANCELLED", "COMPLETED"] }
                        },
                        include: {
                            seats: true
                        }
                    }
                }
            });

            for (const T of futureTrips) {
                cancelledTripsCount++;

                // If this trip has no bookings, we just cancel it simply
                if (T.bookings.length === 0) {
                    await prisma.trip.update({
                        where: { id: T.id },
                        data: {
                            status: "CANCELLED",
                            notes: `Dibatalkan otomatis karena kendaraan masuk status: ${status}`
                        }
                    });
                    continue;
                }

                // Look for alternative active trips on the same day, same route
                const tripDateStart = new Date(T.departureTime);
                tripDateStart.setHours(0, 0, 0, 0);

                const tripDateEnd = new Date(T.departureTime);
                tripDateEnd.setHours(23, 59, 59, 999);

                const alternativeTrips = await prisma.trip.findMany({
                    where: {
                        origin: T.origin,
                        destination: T.destination,
                        departureTime: {
                            gte: tripDateStart,
                            lte: tripDateEnd
                        },
                        status: { notIn: ["CANCELLED", "COMPLETED"] },
                        vehicleId: { not: id },
                        vehicle: {
                            status: "ACTIVE"
                        }
                    },
                    include: {
                        seats: true,
                        vehicle: true
                    }
                });

                // For each booking B on trip T, try to find a suitable alternative trip
                for (const B of T.bookings) {
                    let transferred = false;

                    for (const altTrip of alternativeTrips) {
                        // Calculate available seats on altTrip
                        const bookedSeatsCount = altTrip.seats.filter(s => s.status === "BOOKED").length;
                        const availableSeats = altTrip.vehicle.capacity - bookedSeatsCount;

                        if (availableSeats >= B.seatCount) {
                            // Find B.seatCount available seats in altTrip
                            const freeSeats = altTrip.seats.filter(s => s.status === "AVAILABLE").slice(0, B.seatCount);

                            if (freeSeats.length === B.seatCount) {
                                await prisma.$transaction([
                                    // 1. Update the booking's tripId
                                    prisma.booking.update({
                                        where: { id: B.id },
                                        data: {
                                            tripId: altTrip.id,
                                            status: "CONFIRMED", // Keep active on new trip
                                            notes: JSON.stringify({
                                                originalTripId: T.id,
                                                transferredReason: `Dipindahkan otomatis dari armada ${vehicle?.licensePlate} (${status}) ke armada ${altTrip.vehicle.licensePlate}`,
                                                passengers: B.notes ? (JSON.parse(B.notes).passengers || []) : []
                                            })
                                        }
                                    }),
                                    // 2. Release old seats
                                    prisma.tripSeat.updateMany({
                                        where: { bookingId: B.id },
                                        data: {
                                            status: "AVAILABLE",
                                            bookingId: null
                                        }
                                    }),
                                    // 3. Book new seats in altTrip
                                    ...freeSeats.map(s => prisma.tripSeat.update({
                                        where: { id: s.id },
                                        data: {
                                            status: "BOOKED",
                                            bookingId: B.id
                                        }
                                    })),
                                    // 4. Log activity
                                    prisma.tripActivity.create({
                                        data: {
                                            tripId: altTrip.id,
                                            userId: auth.userId,
                                            action: "RESCHEDULE",
                                            description: `Booking ${B.bookingCode} berhasil dipindahkan dari armada ${vehicle?.licensePlate} ke ${altTrip.vehicle.licensePlate}.`
                                        }
                                    })
                                ]);

                                transferred = true;
                                transferredBookingsCount++;
                                break; // B is successfully transferred!
                            }
                        }
                    }

                    if (!transferred) {
                        // No alternative trip on the same day has enough capacity, cancel & refund
                        await prisma.$transaction([
                            prisma.booking.update({
                                where: { id: B.id },
                                data: {
                                    status: "CANCELLED",
                                    paymentStatus: B.paymentStatus === "PAID" ? "PAID" : "UNPAID",
                                    notes: JSON.stringify({
                                        cancelledBy: "VENDOR",
                                        cancelReason: `Dibatalkan otomatis karena armada masuk status ${status} dan tidak ada jadwal pengganti dengan kapasitas cukup pada hari yang sama.`
                                    })
                                }
                            }),
                            prisma.tripSeat.updateMany({
                                where: { bookingId: B.id },
                                data: {
                                    status: "AVAILABLE",
                                    bookingId: null
                                }
                            })
                        ]);

                        cancelledBookingsCount++;
                    }
                }

                // Finally, set the original trip status to CANCELLED
                await prisma.trip.update({
                    where: { id: T.id },
                    data: {
                        status: "CANCELLED",
                        notes: `Dibatalkan otomatis karena kendaraan masuk status: ${status}`
                    }
                });
            }
        }

        return NextResponse.json({ 
            ...updated, 
            cancelledTripsCount,
            transferredBookingsCount,
            cancelledBookingsCount
        });
    } catch (error) {
        console.error("Update vehicle error:", error);
        return NextResponse.json({ error: "Gagal memperbarui armada." }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireVendorAuth();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    const { id } = await params;

    try {
        // Verify ownership
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
        });

        if (!vehicle || vehicle.vendorId !== auth.vendorId) {
            return NextResponse.json({ error: "Armada tidak ditemukan." }, { status: 404 });
        }

        await prisma.vehicle.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Armada berhasil dihapus." });
    } catch (error) {
        console.error("Delete vehicle error:", error);
        return NextResponse.json({ error: "Gagal menghapus armada." }, { status: 500 });
    }
}
