"use client";

import { AdminQueryProvider } from "@/components/admin/admin-query-provider";
import { OwnersManager } from "@/components/admin/owners-manager";
import { PageHeader } from "@/components/admin/page-header";
import { Users } from "lucide-react";

export default function AdminOwnersPage() {
  return (
    <div className="scaffold-page">
      <PageHeader 
        title="Manajemen Owner"
        subtitle="Manajemen akses eksekutif. Atur wewenang owner vendor dan pantau aktivitas akun secara menyeluruh."
        icon={Users}
      />

      <AdminQueryProvider>
        <OwnersManager />
      </AdminQueryProvider>
    </div>
  );
}
