import { CalendarCheck, Navigation } from "lucide-react";

export default function StaffDashboardPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Staff Dashboard</h1>
                <p className="scaffold-subtitle">Kelola booking dan perjalanan hari ini.</p>
            </div>
            <div className="scaffold-stats">
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#ede9fe" }}>
                        <CalendarCheck size={20} color="#8b5cf6" />
                    </div>
                    <span className="scaffold-stat-value">12</span>
                    <span className="scaffold-stat-label">Booking Hari Ini</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ 3 pending</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#dbeafe" }}>
                        <Navigation size={20} color="#3b82f6" />
                    </div>
                    <span className="scaffold-stat-value">7</span>
                    <span className="scaffold-stat-label">Trip Aktif</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ On-time</span>
                </div>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon">📋</div>
                <p className="scaffold-placeholder-text">Daftar booking, konfirmasi, dan jadwal trip akan diisi di sini.</p>
            </div>
        </div>
    );
}
