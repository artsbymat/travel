/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { PolicyType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
    isOwnerAuthFailure,
    ownerAuthErrorResponse,
    requireOwner,
} from "@/lib/owner-auth";
import type { VendorPolicyUpdatePayload } from "@/types/owner-vendor-api";

const POLICY_TYPES: PolicyType[] = [
    "RESCHEDULE",
    "CANCELLATION",
    "REFUND",
    "LUGGAGE",
    "DEPARTURE",
    "DISCLAIMER",
    "OTHER",
];

function isValidPolicyType(value: unknown): value is PolicyType {
    return typeof value === "string" && POLICY_TYPES.includes(value as PolicyType);
}

async function ensureOwnedPolicy(policyId: string, vendorId: string) {
    const policy = await prisma.vendorPolicy.findUnique({ where: { id: policyId } });
    if (!policy) return { error: "Kebijakan tidak ditemukan.", status: 404 as const };
    if (policy.vendorId !== vendorId)
        return { error: "Kebijakan ini bukan milik vendor kamu.", status: 403 as const };
    return { policy };
}

// PATCH: Update an existing policy
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

        const body = (await req.json()) as VendorPolicyUpdatePayload;
        const data: any = {};

        if (body.type !== undefined) {
            if (!isValidPolicyType(body.type)) {
                return NextResponse.json(
                    { error: "Tipe kebijakan tidak valid." },
                    { status: 400 },
                );
            }
            data.type = body.type;
        }

        if (body.title !== undefined) {
            const title = body.title.trim();
            if (title.length < 3) {
                return NextResponse.json(
                    { error: "Judul kebijakan minimal 3 karakter." },
                    { status: 400 },
                );
            }
            data.title = title;
        }

        if (body.content !== undefined) {
            const content = body.content.trim();
            if (content.length < 10) {
                return NextResponse.json(
                    { error: "Isi kebijakan minimal 10 karakter." },
                    { status: 400 },
                );
            }
            data.content = content;
        }

        if (body.order !== undefined) data.order = body.order;
        if (body.isActive !== undefined) data.isActive = body.isActive;

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { error: "Tidak ada perubahan yang dikirim." },
                { status: 400 },
            );
        }

        const updated = await prisma.vendorPolicy.update({ where: { id }, data });
        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "Tipe kebijakan ini sudah dipakai pada kebijakan lain." },
                { status: 400 },
            );
        }
        console.error("[owner/vendor/policies/:id][PATCH]", error);
        return NextResponse.json(
            { error: "Gagal memperbarui kebijakan." },
            { status: 500 },
        );
    }
}

// DELETE: Remove a policy
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

        await prisma.vendorPolicy.delete({ where: { id } });
        return NextResponse.json({ message: "Kebijakan berhasil dihapus." });
    } catch (error) {
        console.error("[owner/vendor/policies/:id][DELETE]", error);
        return NextResponse.json(
            { error: "Gagal menghapus kebijakan." },
            { status: 500 },
        );
    }
}
