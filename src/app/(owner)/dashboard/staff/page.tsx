import { Users } from "lucide-react";

export default function OwnerStaffPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Kelola Staff</h1>
                <p className="scaffold-subtitle">Daftar staff operasional yang membantu bisnis Anda.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><Users size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Manajemen akun staff, hak akses, dan performa.</p>
            </div>
        </div>
    );
}
