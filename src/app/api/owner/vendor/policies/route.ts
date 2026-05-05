import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { PolicyType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
    isOwnerAuthFailure,
    ownerAuthErrorResponse,
    requireOwner,
} from "@/lib/owner-auth";
import type { VendorPolicyCreatePayload } from "@/types/owner-vendor-api";

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

// GET: List all policies for the owner's vendor
export async function GET() {
    const auth = await requireOwner();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const policies = await prisma.vendorPolicy.findMany({
            where: { vendorId: auth.vendorId },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        });
        return NextResponse.json(policies);
    } catch (error) {
        console.error("[owner/vendor/policies][GET]", error);
        return NextResponse.json(
            { error: "Gagal memuat kebijakan vendor." },
            { status: 500 },
        );
    }
}

// POST: Create a new policy
export async function POST(req: NextRequest) {
    const auth = await requireOwner();
    if (isOwnerAuthFailure(auth)) return ownerAuthErrorResponse(auth);

    try {
        const body = (await req.json()) as VendorPolicyCreatePayload;

        if (!isValidPolicyType(body.type)) {
            return NextResponse.json(
                { error: "Tipe kebijakan tidak valid." },
                { status: 400 },
            );
        }

        const title = body.title?.trim();
        const content = body.content?.trim();

        if (!title || title.length < 3) {
            return NextResponse.json(
                { error: "Judul kebijakan minimal 3 karakter." },
                { status: 400 },
            );
        }

        if (!content || content.length < 10) {
            return NextResponse.json(
                { error: "Isi kebijakan minimal 10 karakter." },
                { status: 400 },
            );
        }

        const policy = await prisma.vendorPolicy.create({
            data: {
                vendorId: auth.vendorId,
                type: body.type,
                title,
                content,
                order: typeof body.order === "number" ? body.order : 0,
                isActive: body.isActive ?? true,
            },
        });

        return NextResponse.json(policy, { status: 201 });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                return NextResponse.json(
                    { error: "Kebijakan dengan tipe ini sudah ada. Gunakan tipe lain atau ubah yang sudah ada." },
                    { status: 400 },
                );
            }
        }
        console.error("[owner/vendor/policies][POST]", error);
        return NextResponse.json(
            { error: "Gagal membuat kebijakan." },
            { status: 500 },
        );
    }
}
