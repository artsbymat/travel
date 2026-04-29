"use client";

import { PageHeader } from "@/components/admin/page-header";
import { Users, UserPlus } from "lucide-react";

export default function AdminUsersPage() {
    return (
        <div className="scaffold-page">
            <PageHeader 
                title="Manajemen Users" 
                subtitle="Kelola semua pengguna sistem — Owner, Staff, dan Driver secara terpusat."
                icon={Users}
            />
            
            <div className="scaffold-content">
                <div className="scaffold-placeholder">
                    <div className="scaffold-placeholder-icon"><UserPlus size={40} color="#94a3b8" /></div>
                    <p className="scaffold-placeholder-text">Tabel users, filter by role, tambah & edit user akan diisi di sini.</p>
                </div>
            </div>
        </div>
    );
}
