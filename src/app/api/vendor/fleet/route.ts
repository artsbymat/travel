import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorAuth, isOwnerAuthFailure, ownerAuthErrorResponse } from "@/lib/owner-auth";

export async function GET() {
    const auth = await requireVendorAuth();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const vehicles = await prisma.vehicle.findMany({
            where: { vendorId: auth.vendorId },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(vehicles);
    } catch (error) {
        console.error("Fetch vehicles error:", error);
        return NextResponse.json({ error: "Gagal mengambil data armada." }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireVendorAuth();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const body = await req.json();
        const { licensePlate, name, brand, model, year, capacity, color, status, imageUrl, images, seatLayout } = body;

        if (!licensePlate || !brand || !model) {
            return NextResponse.json({ error: "Kolom wajib diisi: Plat Nomor, Brand, Model." }, { status: 400 });
        }

        // Check unique license plate
        const existing = await prisma.vehicle.findUnique({ where: { licensePlate } });
        if (existing) {
            return NextResponse.json({ error: "Plat nomor sudah terdaftar." }, { status: 400 });
        }

        // Auto-calculate capacity from seatLayout if available
        let finalCapacity = capacity ? parseInt(capacity) : 0;
        const hasDriverSeat = seatLayout?.driverSeat != null;
        if (seatLayout && seatLayout.seats && Array.isArray(seatLayout.seats)) {
            finalCapacity = seatLayout.seats.length;
        }

        if (finalCapacity <= 0 && !hasDriverSeat) {
            return NextResponse.json({ error: "Silakan atur tata letak kursi minimal 1 kursi atau tandai kursi supir." }, { status: 400 });
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                licensePlate,
                name,
                brand,
                model,
                year: year ? parseInt(year) : null,
                capacity: finalCapacity,
                color,
                status: status || "ACTIVE",
                imageUrl: imageUrl || null,
                images: images || null,
                seatLayout: seatLayout || null,
                vendorId: auth.vendorId,
            },
        });

        return NextResponse.json(vehicle, { status: 201 });
    } catch (error) {
        console.error("Create vehicle error:", error);
        return NextResponse.json({ error: "Gagal menambahkan armada." }, { status: 500 });
    }
}
