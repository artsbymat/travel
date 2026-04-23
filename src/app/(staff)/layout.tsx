import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/login");
    if (session.user.role !== "STAFF") redirect("/login?error=unauthorized");

    return (
        <DashboardShell
            user={{
                name: session.user.name ?? "Staff",
                email: session.user.email ?? "",
                roleLabel: "Staff",
                role: "STAFF",
            }}
            accentColor="#6366f1"
        >
            {children}
        </DashboardShell>
    );
}
