import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/login");
    if (session.user.role !== "SUPER_ADMIN") redirect("/login?error=unauthorized");

    return (
        <DashboardShell
            user={{
                name: session.user.name ?? "Admin",
                email: session.user.email ?? "",
                roleLabel: "Super Admin",
                role: "SUPER_ADMIN",
            }}
            accentColor="#f59e0b"
        >
            {children}
        </DashboardShell>
    );
}
