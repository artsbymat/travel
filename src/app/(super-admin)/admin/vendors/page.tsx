"use client";

import { AdminQueryProvider } from "@/components/admin/admin-query-provider";
import { VendorsManager } from "@/components/admin/vendors-manager";
import { PageHeader } from "@/components/admin/page-header";
import { Building2 } from "lucide-react";

export default function AdminVendors() {
  return (
    <div className="scaffold-page">
      <PageHeader 
        title="Manajemen Vendor"
        subtitle="Direktori mitra travel resmi. Kelola profil bisnis, parameter komisi, dan status operasional dalam satu platform terintegrasi."
        icon={Building2}
      />

      <AdminQueryProvider>
        <VendorsManager />
      </AdminQueryProvider>
    </div>
  );
}
