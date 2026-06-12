import { CalendarCheck, Navigation, AlertCircle, Clock, UserCheck, ShieldAlert } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STAFF" || !session.user.vendorId) {
        redirect("/login");
    }

    const vendorId = session.user.vendorId;
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Fetch live operational stats in parallel
    const [todayBookingCount, activeTripCount, pendingCashCount, pendingRefundCount] = await Promise.all([
        // Bookings made today
        prisma.booking.count({
            where: {
                trip: { vehicle: { vendorId } },
                createdAt: {
                    gte: startOfToday,
                    lte: endOfToday
                }
            }
        }),
        // Trips departureTime is today
        prisma.trip.count({
            where: {
                vehicle: { vendorId },
                departureTime: {
                    gte: startOfToday,
                    lte: endOfToday
                },
                status: {
                    in: ["SCHEDULED", "ONGOING", "DELAYED", "WAITING_DRIVER"]
                }
            }
        }),
        // Pending cash payments
        prisma.booking.count({
            where: {
                trip: { vehicle: { vendorId } },
                paymentMethod: "CASH",
                paymentStatus: { in: ["UNPAID", "PENDING"] }
            }
        }),
        // Pending refunds
        prisma.refund.count({
            where: {
                booking: { trip: { vehicle: { vendorId } } },
                status: "PENDING"
            }
        })
    ]);

    return (
        <div className="scaffold-page animate-in fade-in duration-300">
            <div className="scaffold-header mb-8">
                <h1 className="scaffold-title text-3xl font-black">Staff Dashboard</h1>
                <p className="scaffold-subtitle text-slate-500">
                    Sistem Operasional FluxFleet. Selamat bekerja, {session.user.name}.
                </p>
            </div>

            {/* Quick Action Alerts */}
            {(pendingCashCount > 0 || pendingRefundCount > 0) && (
                <div className="mb-8 flex flex-col gap-4">
                    {pendingCashCount > 0 && (
                        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-amber-800">Menunggu Persetujuan Kas</h4>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        Terdapat <strong>{pendingCashCount}</strong> pembayaran tunai (CASH) tiket yang memerlukan konfirmasi Anda.
                                    </p>
                                </div>
                            </div>
                            <Link href="/staff/bookings" className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 active:scale-95 transition-all">
                                Tinjau
                            </Link>
                        </div>
                    )}

                    {pendingRefundCount > 0 && (
                        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-sm">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                                <div>
                                    <h4 className="text-sm font-bold text-rose-800">Antrean Pengajuan Refund</h4>
                                    <p className="text-xs text-rose-700 mt-0.5">
                                        Ada <strong>{pendingRefundCount}</strong> permintaan pengembalian dana tiket dari customer menunggu persetujuan.
                                    </p>
                                </div>
                            </div>
                            <Link href="/staff/bookings" className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition-all">
                                Proses
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* Statistics Section */}
            <div className="scaffold-stats grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="scaffold-stat-card border rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="scaffold-stat-icon mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                        <CalendarCheck size={20} color="#8b5cf6" />
                    </div>
                    <span className="scaffold-stat-value text-2xl font-bold text-slate-800">{todayBookingCount}</span>
                    <span className="scaffold-stat-label text-xs text-slate-500 block mt-1">Booking Hari Ini</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up text-[10px] font-semibold text-emerald-600 mt-2 block">
                        Tiket terpesan hari ini
                    </span>
                </div>

                <div className="scaffold-stat-card border rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="scaffold-stat-icon mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                        <Navigation size={20} color="#3b82f6" />
                    </div>
                    <span className="scaffold-stat-value text-2xl font-bold text-slate-800">{activeTripCount}</span>
                    <span className="scaffold-stat-label text-xs text-slate-500 block mt-1">Trip Aktif Hari Ini</span>
                    <span className="scaffold-stat-trend scaffold-stat-trend--up text-[10px] font-semibold text-blue-600 mt-2 block">
                        Menuju ke keberangkatan
                    </span>
                </div>

                <div className="scaffold-stat-card border rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="scaffold-stat-icon mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                        <Clock size={20} color="#d97706" />
                    </div>
                    <span className="scaffold-stat-value text-2xl font-bold text-slate-800">{pendingCashCount}</span>
                    <span className="scaffold-stat-label text-xs text-slate-500 block mt-1">Persetujuan Tunai</span>
                    <span className="scaffold-stat-trend text-[10px] font-semibold text-amber-600 mt-2 block">
                        Menunggu kasir/petugas
                    </span>
                </div>

                <div className="scaffold-stat-card border rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="scaffold-stat-icon mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                        <UserCheck size={20} color="#e11d48" />
                    </div>
                    <span className="scaffold-stat-value text-2xl font-bold text-slate-800">{pendingRefundCount}</span>
                    <span className="scaffold-stat-label text-xs text-slate-500 block mt-1">Persetujuan Refund</span>
                    <span className="scaffold-stat-trend text-[10px] font-semibold text-rose-600 mt-2 block">
                        Perlu otorisasi segera
                    </span>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="font-bold text-slate-800 text-lg mb-4">Akses Cepat Operasional</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Link href="/staff/trips" className="flex flex-col gap-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <span className="font-semibold text-sm text-slate-900">Jadwalkan Perjalanan (Trip)</span>
                        <span className="text-xs text-slate-500">Kelola dan jadwalkan perjalanan bus baru hari ini.</span>
                    </Link>
                    <Link href="/staff/drivers" className="flex flex-col gap-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <span className="font-semibold text-sm text-slate-900">Pendaftaran Driver Baru</span>
                        <span className="text-xs text-slate-500">Daftarkan akun driver dan masukkan berkas SIM/KTP.</span>
                    </Link>
                    <Link href="/staff/bookings" className="flex flex-col gap-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <span className="font-semibold text-sm text-slate-900">Validasi & Refund Tiket</span>
                        <span className="text-xs text-slate-500">Proses persetujuan pembayaran kasir dan refund dana.</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
