import { NextRequest } from "next/server";
import { withAuth } from "./middlewares/withAuth";

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // SUPER ADMIN only
    if (pathname.startsWith("/admin")) {
        return withAuth(req, { roles: ["SUPER_ADMIN"] });
    }

    // OWNER only
    if (pathname.startsWith("/dashboard")) {
        return withAuth(req, { roles: ["OWNER"] });
    }

    // STAFF only
    if (pathname.startsWith("/staff")) {
        return withAuth(req, { roles: ["STAFF"] });
    }

    // DRIVER only
    if (pathname.startsWith("/driver")) {
        return withAuth(req, { roles: ["DRIVER"] });
    }

    // default: harus login
    return withAuth(req);
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/dashboard/:path*",
        "/staff/:path*",
        "/driver/:path*",
    ],
};
