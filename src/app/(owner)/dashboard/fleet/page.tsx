import { AdminQueryProvider } from "@/components/admin/admin-query-provider";
import { FleetManager } from "@/components/vendor/fleet-manager";

export default function OwnerFleetPage() {
  return (
    <AdminQueryProvider>
      <FleetManager />
    </AdminQueryProvider>
  );
}
