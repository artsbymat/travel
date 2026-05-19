import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, MapPin, Clock, ArrowRight, 
  Navigation, Car, Users 
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DriverSchedulePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  const driverId = session.user.id;

  // Fetch all active/upcoming trips (not Completed or Cancelled)
  const schedules = await prisma.trip.findMany({
    where: {
      driverId,
      status: {
        in: ["SCHEDULED", "ONGOING", "DELAYED", "WAITING_DRIVER"],
      },
    },
    orderBy: {
      departureTime: "asc",
    },
    include: {
      vehicle: true,
      seats: {
        include: {
          booking: true,
        },
      },
    },
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTripStatusText = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "Sedang Jalan";
      case "DELAYED":
        return "Terlambat";
      case "SCHEDULED":
        return "Terjadwal";
      case "WAITING_DRIVER":
        return "Menunggu Konfirmasi";
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
      
      {/* Header */}
      <div className="scaffold-header mb-8">
        <h1 className="scaffold-title text-3xl font-black">Jadwal Kerja</h1>
        <p className="scaffold-subtitle text-slate-500">
          Daftar seluruh tugas penugasan mengemudi Anda yang akan datang dan sedang berjalan.
        </p>
      </div>

      {/* Schedule list */}
      {schedules.length === 0 ? (
        <div className="bg-white border rounded-2xl p-16 text-center text-slate-500 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Calendar size={28} />
          </div>
          <h4 className="font-bold text-slate-700">Jadwal Anda Kosong</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Tidak ada tugas mengemudi terjadwal yang tercatat untuk akun Anda saat ini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {schedules.map((trip) => {
            const bookedCount = trip.seats.filter((s) => s.booking !== null).length;
            
            return (
              <div 
                key={trip.id}
                className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                {/* Header row */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className={`inline-flex px-2.5 py-0.5 text-[9px] font-bold uppercase rounded border ${getTripStatusBadgeClass(trip.status)}`}>
                      {getTripStatusText(trip.status)}
                    </span>
                    <span className="text-xs font-bold text-slate-400 ml-2">{formatDate(trip.departureTime)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-800">{formatTime(trip.departureTime)}</span>
                  </div>
                </div>

                {/* Route detail */}
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                  {trip.origin} 
                  <ArrowRight className="w-4 h-4 text-slate-400" /> 
                  {trip.destination}
                </h3>

                {/* Sub info */}
                <div className="grid grid-cols-2 gap-4 border-t pt-4 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Car size={15} className="text-slate-400" />
                    <div>
                      <span className="text-slate-800 font-bold block">{trip.vehicle.brand} {trip.vehicle.model}</span>
                      <span className="font-mono text-[10px] text-slate-400">{trip.vehicle.licensePlate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-slate-400" />
                    <div>
                      <span className="text-slate-800 font-bold block">{bookedCount} Penumpang</span>
                      <span className="text-[10px] text-slate-400">Terisi dari {trip.vehicle.capacity} kursi</span>
                    </div>
                  </div>
                </div>

                {/* CTA Action */}
                <div className="pt-2">
                  <Link
                    href={`/driver/trips/${trip.id}`}
                    className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 active:scale-[0.99] transition-all text-xs shadow"
                  >
                    <Navigation size={13} />
                    Buka Kontrol Operasional & Manifes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
