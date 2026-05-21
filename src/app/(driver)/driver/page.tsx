import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, History, Shield, Navigation, ArrowRight, Play } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DriverDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  const driverId = session.user.id;

  // 1. Fetch next upcoming or currently active trip for this driver
  const activeTrip = await prisma.trip.findFirst({
    where: {
      driverId,
      status: { in: ["SCHEDULED", "ONGOING", "DELAYED", "WAITING_DRIVER"] }
    },
    orderBy: { departureTime: "asc" },
    include: {
      vehicle: true,
      seats: {
        include: {
          booking: true
        }
      }
    }
  });

  // 2. Fetch stats
  const totalCompletedTrips = await prisma.trip.count({
    where: {
      driverId,
      status: "COMPLETED"
    }
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const todayTripsCount = await prisma.trip.count({
    where: {
      driverId,
      departureTime: {
        gte: startOfToday,
        lte: endOfToday
      }
    }
  });

  const bookedSeatsCount = activeTrip
    ? activeTrip.seats.filter((s) => s.booking !== null).length
    : 0;

  const formatTime = (timeStr: Date) => {
    return timeStr.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTripStatusText = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "Sedang Jalan";
      case "DELAYED":
        return "Ada Hambatan";
      case "SCHEDULED":
        return "Siap Berangkat";
      case "WAITING_DRIVER":
        return "Menunggu Driver";
      default:
        return status;
    }
  };

  const getTripStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DELAYED":
        return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      case "SCHEDULED":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "WAITING_DRIVER":
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="scaffold-page animate-in fade-in mx-auto max-w-3xl p-1 duration-300 sm:p-4">
      {/* Header with Welcome message */}
      <div className="scaffold-header mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="scaffold-title text-3xl font-black">
            Halo, {session.user.name || "Driver"}!
          </h1>
          <p className="scaffold-subtitle text-slate-500">
            Jadwal mengemudi dan kontrol operasional perjalanan Anda hari ini.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Today's Schedules */}
        <div className="flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-teal-600">
            <Calendar size={22} />
          </div>
          <div>
            <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
              Trip Hari Ini
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{todayTripsCount}</span>
              <span className="text-xs font-medium text-slate-500">Jadwal Tugas</span>
            </div>
          </div>
        </div>

        {/* Lifetime Completed Trips */}
        <div className="flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600">
            <History size={22} />
          </div>
          <div>
            <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase">
              Total Trip Selesai
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-800">{totalCompletedTrips}</span>
              <span className="text-xs font-medium text-slate-500">Trip Sukses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trip Operations Call To Action */}
      <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
        <Navigation size={16} className="text-teal-600" />
        Tugas Mengemudi Terdekat
      </h3>

      {activeTrip ? (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-xl">
          <div className="pointer-events-none absolute top-0 right-0 p-6 opacity-5 transition-transform duration-300 group-hover:scale-110">
            <Navigation size={120} />
          </div>

          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <span
                className={`inline-flex rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${getTripStatusBadgeClass(activeTrip.status)}`}
              >
                {getTripStatusText(activeTrip.status)}
              </span>
              <span className="ml-2 text-xs font-bold text-slate-400">
                {activeTrip.departureTime.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Jam Keluar
              </span>
              <span className="text-lg font-black text-teal-400">
                {formatTime(activeTrip.departureTime)}
              </span>
            </div>
          </div>

          <h4 className="mb-4 text-2xl font-black tracking-tight text-white">
            {activeTrip.origin} <ArrowRight className="mx-1 inline-block h-5 w-5 text-teal-400" />{" "}
            {activeTrip.destination}
          </h4>

          <div className="mb-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-xs text-slate-400">
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">
                Armada Kendaraan
              </span>
              <span className="mt-0.5 block font-bold text-white">
                {activeTrip.vehicle.brand} {activeTrip.vehicle.model}
              </span>
              <span className="mt-0.5 block font-mono text-slate-500">
                {activeTrip.vehicle.licensePlate}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase">
                Penumpang Terisi
              </span>
              <span className="mt-0.5 block font-bold text-white">
                {bookedSeatsCount} Penumpang Terdaftar
              </span>
            </div>
          </div>

          <Link
            href={`/driver/trips/${activeTrip.id}`}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-500 font-bold text-slate-900 shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-400 active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" />
            Buka Navigasi & Manifes Penumpang
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border bg-white p-12 text-center text-slate-500 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border bg-slate-50 text-slate-400">
            🚘
          </div>
          <h4 className="font-bold text-slate-700">Tidak Ada Jadwal Mengemudi</h4>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            Anda belum ditugaskan untuk perjalanan aktif terdekat. Hubungi pihak Owner atau admin
            vendor jika terdapat kesalahan penugasan armada.
          </p>
        </div>
      )}

      {/* Useful tips block */}
      <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
        <div>
          <h5 className="font-bold text-slate-700">Tips Keselamatan Mengemudi</h5>
          <p className="mt-1 leading-relaxed">
            Selalu periksa kelayakan kendaraan (bensin, ban, AC) sebelum memulai perjalanan.
            Pastikan seluruh penumpang check-in dengan benar untuk keperluan asuransi dan manifes
            pelacakan FluxFleet. Utamakan keselamatan di atas kecepatan!
          </p>
        </div>
      </div>
    </div>
  );
}
