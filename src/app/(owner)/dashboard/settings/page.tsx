import { Settings } from "lucide-react";

export default function OwnerSettingsPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Pengaturan</h1>
                <p className="scaffold-subtitle">Konfigurasi profil bisnis dan preferensi akun.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><Settings size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Profil bisnis, notifikasi, dan pengaturan akun.</p>
            </div>
        </div>
    );
}
