import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/login");
    if (session.user.role !== "OWNER") redirect("/login?error=unauthorized");

    return (
        <DashboardShell
            user={{
                name: session.user.name ?? "Owner",
                email: session.user.email ?? "",
                roleLabel: "Owner",
                role: "OWNER",
            }}
            accentColor="#14b8a6"
        >
            {children}
        </DashboardShell>
    );
}
