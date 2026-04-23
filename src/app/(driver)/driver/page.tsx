import { Calendar, History } from "lucide-react";

export default function DriverDashboardPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Driver Dashboard</h1>
                <p className="scaffold-subtitle">Jadwal dan tugas berkendara Anda hari ini.</p>
            </div>
            <div className="scaffold-stats">
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#dcfce7" }}>
                        <Calendar size={20} color="#16a34a" />
                    </div>
                    <span className="scaffold-stat-value">3</span>
                    <span className="scaffold-stat-label">Trip Hari Ini</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ 1 segera</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#fef3c7" }}>
                        <History size={20} color="#f59e0b" />
                    </div>
                    <span className="scaffold-stat-value">89</span>
                    <span className="scaffold-stat-label">Total Trip Selesai</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ Bulan ini</span>
                </div>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon">🚘</div>
                <p className="scaffold-placeholder-text">Jadwal pick-up, navigasi rute, dan status perjalanan akan diisi di sini.</p>
            </div>
        </div>
    );
}
