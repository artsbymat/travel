import { Car, UserCog, MapPin, Users } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { redirect } from "next/navigation";

export default async function OwnerDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER" || !session.user.vendorId) {
        redirect("/login");
    }

    const vendorId = session.user.vendorId;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Fetch stats in parallel
    const [vehicleCount, driverCount, staffCount, monthlyTripCount] = await Promise.all([
        prisma.vehicle.count({
            where: { vendorId }
        }),
        prisma.user.count({
            where: {
                vendorId,
                role: { name: "DRIVER" }
            }
        }),
        prisma.user.count({
            where: {
                vendorId,
                role: { name: "STAFF" }
            }
        }),
        prisma.trip.count({
            where: {
                vehicle: { vendorId },
                departureTime: {
                    gte: monthStart,
                    lte: monthEnd
                }
            }
        })
    ]);

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
                    <span className="scaffold-stat-value">{vehicleCount}</span>
                    <span className="scaffold-stat-label">Total Armada</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">Unit terdaftar</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#dbeafe" }}>
                        <UserCog size={20} color="#3b82f6" />
                    </div>
                    <span className="scaffold-stat-value">{driverCount}</span>
                    <span className="scaffold-stat-label">Driver Aktif</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">Siap bertugas</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#fef3c7" }}>
                        <MapPin size={20} color="#f59e0b" />
                    </div>
                    <span className="scaffold-stat-value">{monthlyTripCount}</span>
                    <span className="scaffold-stat-label">Trip Bulan Ini</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">Bulan {now.toLocaleString('id-ID', { month: 'long' })}</span>
                </div>
                <div className="scaffold-stat-card">
                    <div className="scaffold-stat-icon" style={{ background: "#fce7f3" }}>
                        <Users size={20} color="#ec4899" />
                    </div>
                    <span className="scaffold-stat-value">{staffCount}</span>
                    <span className="scaffold-stat-label">Staff</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up">Tim operasional</span>
                </div>
            </div>
            <div className="scaffold-placeholder">
                <div className="scaffold-placeholder-icon">🚗</div>
                <p className="scaffold-placeholder-text">Grafik pendapatan, jadwal driver, dan aktivitas armada akan diisi di sini.</p>
            </div>
        </div>
    );
}
