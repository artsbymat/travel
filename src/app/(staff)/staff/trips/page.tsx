import { Navigation } from "lucide-react";

export default function StaffTripsPage() {
    return (
        <div className="scaffold-page">
            <div className="scaffold-header">
                <h1 className="scaffold-title">Trips</h1>
                <p className="scaffold-subtitle">Monitoring perjalanan yang sedang berlangsung.</p>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon"><Navigation size={40} color="#94a3b8" /></div>
                <p className="scaffold-placeholder-text">Status trip real-time, penugasan driver, dan tracking.</p>
            </div>
        </div>
    );
}
