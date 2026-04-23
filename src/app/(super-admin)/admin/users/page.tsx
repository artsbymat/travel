import { Users } from "lucide-react";

export default function AdminUsersPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Manajemen Users</h1>
                <p className="scaffold-subtitle">Kelola semua pengguna sistem — Owner, Staff, dan Driver.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><Users size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Tabel users, filter by role, tambah & edit user akan diisi di sini.</p>
            </div>
        </div>
    );
}
