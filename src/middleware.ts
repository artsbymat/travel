import { NextRequest } from "next/server";
import { withAuth } from "./middlewares/withAuth";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // SUPER ADMIN only
    if (pathname.startsWith("/admin")) {
        return withAuth(req, { roles: ["SUPER_ADMIN"] });
    }

    // OWNER & STAFF
    if (pathname.startsWith("/dashboard")) {
        return withAuth(req, { roles: ["OWNER", "STAFF"] });
    }

    // default: harus login aja
    return withAuth(req);
}

export const config = {
    matcher: ["/admin/:path*", "/dashboard/:path*"],
};