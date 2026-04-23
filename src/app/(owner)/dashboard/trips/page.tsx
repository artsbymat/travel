import { MapPin } from "lucide-react";

export default function OwnerTripsPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Jadwal Perjalanan</h1>
                <p className="scaffold-subtitle">Semua trip yang sedang berjalan dan terjadwal.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><MapPin size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Kalender trip, status perjalanan real-time, dan riwayat.</p>
            </div>
        </div>
    );
}
