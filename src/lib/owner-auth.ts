import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export type OwnerAuthSuccess = { vendorId: string; userId: string };
export type OwnerAuthFailure = { error: string; status: number };

/**
 * Verifies that the request is made by an authenticated OWNER who has a vendor.
 * Returns either the vendorId/userId or an error response payload.
 */
export async function requireOwner(): Promise<OwnerAuthSuccess | OwnerAuthFailure> {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return { error: "Tidak terautentikasi.", status: 401 };
    }

    if (session.user.role !== "OWNER") {
        return { error: "Hanya owner yang dapat mengakses resource ini.", status: 403 };
    }

    const vendorId = session.user.vendorId;
    if (!vendorId) {
        return { error: "Owner belum terhubung ke vendor manapun.", status: 400 };
    }

    return { vendorId, userId: session.user.id };
}

export function ownerAuthErrorResponse(failure: OwnerAuthFailure) {
    return NextResponse.json({ error: failure.error }, { status: failure.status });
}

export function isOwnerAuthFailure(
    result: OwnerAuthSuccess | OwnerAuthFailure,
): result is OwnerAuthFailure {
    return "error" in result;
}
