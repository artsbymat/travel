import { AdminQueryProvider } from "@/components/admin/admin-query-provider";
import { VendorsManager } from "@/components/admin/vendors-manager";

export default function AdminVendors() {
  return (
    <div className="scaffold-page">
      <div className="scaffold-header">
        <h1 className="scaffold-title">Manajemen Vendor</h1>
        <p className="scaffold-subtitle">
          Kelola data travel, status operasional, biaya platform, dan informasi
          pencairan vendor.
        </p>
      </div>

      <AdminQueryProvider>
        <VendorsManager />
      </AdminQueryProvider>
    </div>
  );
}
