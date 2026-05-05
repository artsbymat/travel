/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
    isOwnerAuthFailure,
    ownerAuthErrorResponse,
    requireOwner,
} from "@/lib/owner-auth";
import type { VendorRefundPolicyUpdatePayload } from "@/types/owner-vendor-api";

async function ensureOwnedPolicy(policyId: string, vendorId: string) {
    const policy = await prisma.vendorRefundPolicy.findUnique({ where: { id: policyId } });
    if (!policy) return { error: "Kebijakan refund tidak ditemukan.", status: 404 as const };
    if (policy.vendorId !== vendorId)
        return { error: "Kebijakan ini bukan milik vendor kamu.", status: 403 as const };
    return { policy };
}

// PATCH: Update a refund policy tier
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireOwner();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const { id } = await params;
        const guard = await ensureOwnedPolicy(id, auth.vendorId);
        if ("error" in guard) {
            return NextResponse.json({ error: guard.error }, { status: guard.status });
        }

        const body = (await req.json()) as VendorRefundPolicyUpdatePayload;
        const data: any = {};

        if (body.hoursBeforeDeparture !== undefined) {
            if (
                !Number.isInteger(body.hoursBeforeDeparture) ||
                body.hoursBeforeDeparture < 0
            ) {
                return NextResponse.json(
                    { error: "Jam sebelum keberangkatan harus berupa bilangan bulat ≥ 0." },
                    { status: 400 },
                );
            }
            data.hoursBeforeDeparture = body.hoursBeforeDeparture;
        }

        if (body.refundPercentage !== undefined) {
            if (
                typeof body.refundPercentage !== "number" ||
                body.refundPercentage < 0 ||
                body.refundPercentage > 100
            ) {
                return NextResponse.json(
                    { error: "Persentase refund harus antara 0 dan 100." },
                    { status: 400 },
                );
            }
            data.refundPercentage = new Prisma.Decimal(body.refundPercentage);
        }

        if (body.description !== undefined) {
            data.description = body.description?.trim() || null;
        }

        if (body.isActive !== undefined) data.isActive = body.isActive;

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { error: "Tidak ada perubahan yang dikirim." },
                { status: 400 },
            );
        }

        const updated = await prisma.vendorRefundPolicy.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "Sudah ada tier dengan jam yang sama." },
                { status: 400 },
            );
        }
        console.error("[owner/vendor/refund-policies/:id][PATCH]", error);
        return NextResponse.json(
            { error: "Gagal memperbarui kebijakan refund." },
            { status: 500 },
        );
    }
}

// DELETE: Remove a refund policy tier
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const auth = await requireOwner();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const { id } = await params;
        const guard = await ensureOwnedPolicy(id, auth.vendorId);
        if ("error" in guard) {
            return NextResponse.json({ error: guard.error }, { status: guard.status });
        }

        await prisma.vendorRefundPolicy.delete({ where: { id } });
        return NextResponse.json({ message: "Kebijakan refund berhasil dihapus." });
    } catch (error) {
        console.error("[owner/vendor/refund-policies/:id][DELETE]", error);
        return NextResponse.json(
            { error: "Gagal menghapus kebijakan refund." },
            { status: 500 },
        );
    }
}
