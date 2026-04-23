import { BarChart3 } from "lucide-react";

export default function AdminReportsPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Laporan & Statistik</h1>
                <p className="scaffold-subtitle">Analitik performa platform secara keseluruhan.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><BarChart3 size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Charts pendapatan, grafik trip, dan export laporan akan diisi di sini.</p>
            </div>
        </div>
    );
}
