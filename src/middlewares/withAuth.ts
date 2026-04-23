import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

type Role = "SUPER_ADMIN" | "OWNER" | "STAFF" | "DRIVER";

interface AuthOptions {
    roles?: Role[];
}

export async function withAuth(
    req: NextRequest,
    options?: AuthOptions
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // ❌ belum login
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // 🔒 role-based check
    if (options?.roles && !options.roles.includes(token.role as Role)) {
        return NextResponse.redirect(new URL("/403", req.url));
    }

    return NextResponse.next();
}