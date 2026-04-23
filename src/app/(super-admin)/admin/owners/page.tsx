import { Building2 } from "lucide-react";

export default function AdminOwnersPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Manajemen Owners</h1>
                <p className="scaffold-subtitle">Daftar semua pemilik armada yang terdaftar.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><Building2 size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Tabel owners, status akun, dan detail bisnis akan diisi di sini.</p>
            </div>
        </div>
    );
}
