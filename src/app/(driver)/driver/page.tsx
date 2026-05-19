import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, History, Shield, Navigation, 
  MapPin, Clock, ArrowRight, Play, CheckCircle2 
} from "lucide-react";

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
      status: { in: ["SCHEDULED", "ONGOING", "DELAYED", "WAITING_DRIVER"] },
    },
    orderBy: { departureTime: "asc" },
    include: {
      vehicle: true,
      seats: {
        include: {
          booking: true,
        },
      },
    },
  });

  // 2. Fetch stats
  const totalCompletedTrips = await prisma.trip.count({
    where: {
      driverId,
      status: "COMPLETED",
    },
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
        lte: endOfToday,
      },
    },
  });

  const bookedSeatsCount = activeTrip
    ? activeTrip.seats.filter((s) => s.booking !== null).length
    : 0;

  const formatTime = (timeStr: Date) => {
    return timeStr.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
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
    <div className="scaffold-page p-1 sm:p-4 max-w-3xl mx-auto animate-in fade-in duration-300">
      
      {/* Header with Welcome message */}
      <div className="scaffold-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="scaffold-title text-3xl font-black">Halo, {session.user.name || "Driver"}!</h1>
          <p className="scaffold-subtitle text-slate-500">
            Jadwal mengemudi dan kontrol operasional perjalanan Anda hari ini.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Today's Schedules */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Trip Hari Ini</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-800">{todayTripsCount}</span>
              <span className="text-xs text-slate-500 font-medium">Jadwal Tugas</span>
            </div>
          </div>
        </div>

        {/* Lifetime Completed Trips */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <History size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Total Trip Selesai</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-800">{totalCompletedTrips}</span>
              <span className="text-xs text-slate-500 font-medium">Trip Sukses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trip Operations Call To Action */}
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Navigation size={16} className="text-teal-600" />
        Tugas Mengemudi Terdekat
      </h3>

      {activeTrip ? (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-300 pointer-events-none">
            <Navigation size={120} />
          </div>

          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${getTripStatusBadgeClass(activeTrip.status)}`}>
                {getTripStatusText(activeTrip.status)}
              </span>
              <span className="text-slate-400 text-xs font-bold ml-2">
                {activeTrip.departureTime.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Jam Keluar</span>
              <span className="text-lg font-black text-teal-400">{formatTime(activeTrip.departureTime)}</span>
            </div>
          </div>

          <h4 className="text-2xl font-black tracking-tight text-white mb-4">
            {activeTrip.origin} <ArrowRight className="inline-block mx-1 w-5 h-5 text-teal-400" /> {activeTrip.destination}
          </h4>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 mb-6 text-xs text-slate-400">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Armada Kendaraan</span>
              <span className="text-white font-bold mt-0.5 block">{activeTrip.vehicle.brand} {activeTrip.vehicle.model}</span>
              <span className="font-mono text-slate-500 mt-0.5 block">{activeTrip.vehicle.licensePlate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Penumpang Terisi</span>
              <span className="text-white font-bold mt-0.5 block">{bookedSeatsCount} Penumpang Terdaftar</span>
            </div>
          </div>

          <Link
            href={`/driver/trips/${activeTrip.id}`}
            className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-500 text-slate-900 font-bold hover:bg-teal-400 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            Buka Navigasi & Manifes Penumpang
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border flex items-center justify-center mx-auto mb-4 text-slate-400">
            🚘
          </div>
          <h4 className="font-bold text-slate-700">Tidak Ada Jadwal Mengemudi</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Anda belum ditugaskan untuk perjalanan aktif terdekat. Hubungi pihak Owner atau admin vendor jika terdapat kesalahan penugasan armada.
          </p>
        </div>
      )}

      {/* Useful tips block */}
      <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-3">
        <Shield className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <h5 className="font-bold text-slate-700">Tips Keselamatan Mengemudi</h5>
          <p className="mt-1 leading-relaxed">
            Selalu periksa kelayakan kendaraan (bensin, ban, AC) sebelum memulai perjalanan. Pastikan seluruh penumpang check-in dengan benar untuk keperluan asuransi dan manifes pelacakan FluxFleet. Utamakan keselamatan di atas kecepatan!
          </p>
        </div>
      </div>

    </div>
  );
}
