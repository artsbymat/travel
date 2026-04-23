import { Truck } from "lucide-react";

export default function AdminFleetsPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Semua Armada</h1>
                <p className="scaffold-subtitle">Monitoring seluruh armada kendaraan di sistem.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><Truck size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Daftar armada, status kendaraan, dan tracking akan diisi di sini.</p>
            </div>
        </div>
    );
}
