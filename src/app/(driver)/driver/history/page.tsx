import { History } from "lucide-react";

export default function DriverHistoryPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Riwayat Perjalanan</h1>
                <p className="scaffold-subtitle">Semua trip yang telah Anda selesaikan.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><History size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Riwayat trip, rating penumpang, dan total jarak tempuh.</p>
            </div>
        </div>
    );
}
