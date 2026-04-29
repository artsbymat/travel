"use client";

import { AdminQueryProvider } from "@/components/admin/admin-query-provider";
import { FinancialReport } from "@/components/admin/financial-report";
import { PageHeader } from "@/components/admin/page-header";
import { BarChart3 } from "lucide-react";

export default function AdminReportsPage() {
    return (
        <div className="scaffold-page">
            <PageHeader 
                title="Laporan Keuangan" 
                subtitle="Panel kendali keuangan terpadu untuk memantau arus kas, pendapatan platform, dan manajemen piutang vendor secara akurat."
                icon={BarChart3}
            />
            
            <div className="scaffold-content">
                <AdminQueryProvider>
                    <FinancialReport />
                </AdminQueryProvider>
            </div>
        </div>
    );
}
