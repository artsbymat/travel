import { Calendar } from "lucide-react";

export default function DriverSchedulePage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Jadwal Saya</h1>
                <p className="scaffold-subtitle">Semua trip yang ditugaskan untuk Anda.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><Calendar size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Kalender jadwal, detail penumpang, dan lokasi pick-up.</p>
            </div>
        </div>
    );
}
