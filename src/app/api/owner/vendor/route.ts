/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    isOwnerAuthFailure,
    ownerAuthErrorResponse,
    requireOwner,
} from "@/lib/owner-auth";
import type { OwnerVendorUpdatePayload } from "@/types/owner-vendor-api";
import { Prisma } from "@/generated/prisma/client";

const VENDOR_SELECT = {
    id: true,
    name: true,
    slug: true,
    description: true,
    address: true,
    cityId: true,
    phone: true,
    email: true,
    logo: true,
    isActive: true,
    isHeld: true,
    legalName: true,
    npwp: true,
    siup: true,
    taxEnabled: true,
    taxRate: true,
    taxName: true,
    acceptCash: true,
    platformFeeRate: true,
    createdAt: true,
    updatedAt: true,
    city: {
        select: {
            id: true,
            name: true,
            province: { select: { id: true, name: true } },
        },
    },
} satisfies Prisma.VendorSelect;

// GET: Owner — fetch their own vendor profile
export async function GET() {
    const auth = await requireOwner();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const vendor = await prisma.vendor.findUnique({
            where: { id: auth.vendorId },
            select: VENDOR_SELECT,
        });

        if (!vendor) {
            return NextResponse.json({ error: "Vendor tidak ditemukan." }, { status: 404 });
        }

        return NextResponse.json(vendor);
    } catch (error) {
        console.error("[owner/vendor][GET]", error);
        return NextResponse.json({ error: "Gagal memuat data vendor." }, { status: 500 });
    }
}

// PATCH: Owner — update editable fields of their own vendor
export async function PATCH(req: NextRequest) {
    const auth = await requireOwner();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const body = (await req.json()) as OwnerVendorUpdatePayload;

        // Whitelist of fields owner is allowed to update
        const data: any = {};

        if (body.name !== undefined) {
            const name = body.name?.trim();
            if (!name || name.length < 3) {
                return NextResponse.json(
                    { error: "Nama vendor minimal 3 karakter." },
                    { status: 400 },
                );
            }
            data.name = name;
        }

        if (body.description !== undefined) data.description = body.description?.trim() || null;
        if (body.address !== undefined) data.address = body.address?.trim() || null;
        if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
        if (body.email !== undefined) {
            const email = body.email?.trim() || null;
            if (email && !/^\S+@\S+\.\S+$/.test(email)) {
                return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
            }
            data.email = email;
        }
        if (body.logo !== undefined) data.logo = body.logo?.trim() || null;
        if (body.legalName !== undefined) data.legalName = body.legalName?.trim() || null;
        if (body.npwp !== undefined) data.npwp = body.npwp?.trim() || null;
        if (body.siup !== undefined) data.siup = body.siup?.trim() || null;
        if (body.taxName !== undefined) data.taxName = body.taxName?.trim() || null;

        if (body.taxEnabled !== undefined) data.taxEnabled = body.taxEnabled;
        if (body.acceptCash !== undefined) data.acceptCash = body.acceptCash;

        if (body.taxRate !== undefined) {
            if (body.taxRate === null) {
                data.taxRate = null;
            } else if (
                typeof body.taxRate !== "number" ||
                body.taxRate < 0 ||
                body.taxRate > 100
            ) {
                return NextResponse.json(
                    { error: "Tarif pajak harus berupa angka antara 0 dan 100." },
                    { status: 400 },
                );
            } else {
                data.taxRate = new Prisma.Decimal(body.taxRate);
            }
        }

        if (body.cityId !== undefined) {
            if (body.cityId === null || body.cityId === "") {
                data.city = { disconnect: true };
            } else {
                const city = await prisma.city.findUnique({ where: { id: body.cityId } });
                if (!city) {
                    return NextResponse.json({ error: "Kota tidak ditemukan." }, { status: 400 });
                }
                data.city = { connect: { id: body.cityId } };
            }
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { error: "Tidak ada perubahan yang dikirim." },
                { status: 400 },
            );
        }

        const updated = await prisma.vendor.update({
            where: { id: auth.vendorId },
            data,
            select: VENDOR_SELECT,
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                const fields = (error.meta?.target as string[] | undefined)?.join(", ") ?? "field";
                return NextResponse.json(
                    { error: `Nilai ${fields} sudah dipakai vendor lain.` },
                    { status: 400 },
                );
            }
        }
        console.error("[owner/vendor][PATCH]", error);
        return NextResponse.json({ error: "Gagal memperbarui data vendor." }, { status: 500 });
    }
}
