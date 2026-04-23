import { Users, Truck, Building2, BarChart3 } from "lucide-react";

export default function AdminDashboardPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Super Admin Dashboard</h1>
                <p className="scaffold-subtitle">Selamat datang kembali. Berikut ringkasan sistem FluxFleet.</p>
            </div>

            <div className="scaffold-stats">
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#fef3c7" }}>
                        <Users size={20} color="#f59e0b" />
                    </div>
                    <span className="scaffold-stat-value">1,284</span>
                    <span className="scaffold-stat-label">Total Users</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ 12% bulan ini</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#d1fae5" }}>
                        <Building2 size={20} color="#059669" />
                    </div>
                    <span className="scaffold-stat-value">48</span>
                    <span className="scaffold-stat-label">Active Owners</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ 3 baru</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#dbeafe" }}>
                        <Truck size={20} color="#3b82f6" />
                    </div>
                    <span className="scaffold-stat-value">312</span>
                    <span className="scaffold-stat-label">Armada Terdaftar</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ 8 unit</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#ede9fe" }}>
                        <BarChart3 size={20} color="#8b5cf6" />
                    </div>
                    <span className="scaffold-stat-value">9,741</span>
                    <span className="scaffold-stat-label">Total Trips</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">↑ 5.2%</span>
                </div>
            </div>

            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon">📊</div>
                <p className="scaffold-placeholder-text">Konten dashboard — charts, tabel aktivitas, dll akan diisi di sini.</p>
            </div>
        </div>
    );
}
