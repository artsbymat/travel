import { Settings } from "lucide-react";

import { OwnerQueryProvider } from "@/components/owner/owner-query-provider";
import { OwnerPageHeader } from "@/components/owner/owner-page-header";
import { VendorInfoSection } from "@/components/owner/vendor-info-section";
import { PoliciesSection } from "@/components/owner/policies-section";
import { RefundPoliciesSection } from "@/components/owner/refund-policies-section";

export default function OwnerSettingsPage() {
  return (
    <OwnerQueryProvider>
      <div className="scaffold-page space-y-8">
        <OwnerPageHeader
          icon={<Settings />}
          title="Pengaturan Vendor"
          subtitle="Kelola profil bisnis, kebijakan, dan aturan refund vendor kamu."
        />

        <VendorInfoSection />
        <PoliciesSection />
        <RefundPoliciesSection />
      </div>
    </OwnerQueryProvider>
  );
}
