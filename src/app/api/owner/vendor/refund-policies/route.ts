import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    isOwnerAuthFailure,
    ownerAuthErrorResponse,
    requireOwner,
} from "@/lib/owner-auth";
import type { VendorRefundPolicyCreatePayload } from "@/types/owner-vendor-api";

function validatePayload(payload: VendorRefundPolicyCreatePayload) {
    if (
        typeof payload.hoursBeforeDeparture !== "number" ||
        !Number.isInteger(payload.hoursBeforeDeparture) ||
        payload.hoursBeforeDeparture < 0
    ) {
        return "Jam sebelum keberangkatan harus berupa bilangan bulat ≥ 0.";
    }
    if (
        typeof payload.refundPercentage !== "number" ||
        payload.refundPercentage < 0 ||
        payload.refundPercentage > 100
    ) {
        return "Persentase refund harus antara 0 dan 100.";
    }
    return null;
}

// GET: List refund policies for the owner's vendor
export async function GET() {
    const auth = await requireOwner();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const policies = await prisma.vendorRefundPolicy.findMany({
            where: { vendorId: auth.vendorId },
            orderBy: { hoursBeforeDeparture: "desc" },
        });
        return NextResponse.json(policies);
    } catch (error) {
        console.error("[owner/vendor/refund-policies][GET]", error);
        return NextResponse.json(
            { error: "Gagal memuat kebijakan refund." },
            { status: 500 },
        );
    }
}

// POST: Create a new refund policy tier
export async function POST(req: NextRequest) {
    const auth = await requireOwner();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const body = (await req.json()) as VendorRefundPolicyCreatePayload;
        const validationError = validatePayload(body);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        const policy = await prisma.vendorRefundPolicy.create({
            data: {
                vendorId: auth.vendorId,
                hoursBeforeDeparture: body.hoursBeforeDeparture,
                refundPercentage: new Prisma.Decimal(body.refundPercentage),
                description: body.description?.trim() || null,
                isActive: body.isActive ?? true,
            },
        });

        return NextResponse.json(policy, { status: 201 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "Tier dengan jam yang sama sudah ada." },
                { status: 400 },
            );
        }
        console.error("[owner/vendor/refund-policies][POST]", error);
        return NextResponse.json(
            { error: "Gagal membuat kebijakan refund." },
            { status: 500 },
        );
    }
}
