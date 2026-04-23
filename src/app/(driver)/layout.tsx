import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DriverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/login");
    if (session.user.role !== "DRIVER") redirect("/login?error=unauthorized");

    return (
        <DashboardShell
            user={{
                name: session.user.name ?? "Driver",
                email: session.user.email ?? "",
                roleLabel: "Driver",
                role: "DRIVER",
            }}
            accentColor="#22c55e"
        >
            {children}
        </DashboardShell>
    );
}
