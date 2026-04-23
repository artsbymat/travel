import { CalendarCheck } from "lucide-react";

export default function StaffBookingsPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Booking</h1>
                <p className="scaffold-subtitle">Daftar semua pemesanan yang perlu dikonfirmasi.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><CalendarCheck size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Tabel booking, filter status, dan konfirmasi pesanan.</p>
            </div>
        </div>
    );
}
