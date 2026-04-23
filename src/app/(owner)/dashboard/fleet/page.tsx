import { Car } from "lucide-react";

export default function OwnerFleetPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Kelola Armada</h1>
                <p className="scaffold-subtitle">Daftar dan status semua kendaraan milik Anda.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><Car size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Tabel armada, status operasional, dan tambah kendaraan baru.</p>
            </div>
        </div>
    );
}
