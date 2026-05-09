import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumb } from "@/components/ui/app-breadcrumb";

const SUPER_ADMIN_BREADCRUMB_LABELS = {
  "/admin": "Super Admin Dashboard",
  "/admin/vendors": "Manajemen Vendor",
  "/admin/owners": "Manajemen Owner",
  "/admin/reports": "Laporan Keuangan",
  "/admin/users": "Manajemen Users"
};

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/login?error=unauthorized");

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <AppBreadcrumb
              rootHref="/admin"
              rootLabel="Super Admin"
              routeLabels={SUPER_ADMIN_BREADCRUMB_LABELS}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
