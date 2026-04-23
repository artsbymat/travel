import { Car, UserCog, MapPin, Users } from "lucide-react";

export default function OwnerDashboardPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Owner Dashboard</h1>
                <p className="scaffold-subtitle">Pantau armada dan operasional bisnis Anda.</p>
            </div>
            <div className="scaffold-stats">
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#ccfbf1" }}>
                        <Car size={20} color="#0d9488" />
                    </div>
                    <span className="scaffold-stat-value">24</span>
                    <span className="scaffold-stat-label">Total Armada</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ 2 unit baru</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#dbeafe" }}>
                        <UserCog size={20} color="#3b82f6" />
                    </div>
                    <span className="scaffold-stat-value">18</span>
                    <span className="scaffold-stat-label">Driver Aktif</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ Online sekarang</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#fef3c7" }}>
                        <MapPin size={20} color="#f59e0b" />
                    </div>
                    <span className="scaffold-stat-value">143</span>
                    <span className="scaffold-stat-label">Trip Bulan Ini</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ 18%</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#fce7f3" }}>
                        <Users size={20} color="#ec4899" />
                    </div>
                    <span className="scaffold-stat-value">5</span>
                    <span className="scaffold-stat-label">Staff</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ Semua aktif</span>
                </div>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon">🚗</div>
                <p className="scaffold-placeholder-text">Grafik pendapatan, jadwal driver, dan aktivitas armada akan diisi di sini.</p>
            </div>
        </div>
    );
}
