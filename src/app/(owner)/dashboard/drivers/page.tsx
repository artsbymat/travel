import { UserCog } from "lucide-react";

export default function OwnerDriversPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Kelola Driver</h1>
                <p className="scaffold-subtitle">Daftar driver yang tergabung dalam armada Anda.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><UserCog size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Profil driver, status ketersediaan, dan riwayat trip.</p>
            </div>
        </div>
    );
}
