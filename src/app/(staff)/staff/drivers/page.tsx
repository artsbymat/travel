import { AdminQueryProvider } from "@/components/admin/admin-query-provider";
import { DriverManager } from "@/components/vendor/driver-manager";

export default function StaffDriversPage() {
  return (
    <AdminQueryProvider>
      <DriverManager />
    </AdminQueryProvider>
  );
}
