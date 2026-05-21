import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { History, Clock, ArrowRight, Car, Users, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DriverHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "DRIVER") {
    redirect("/login");
  }

  const driverId = session.user.id;

  // Fetch all completed trips for this driver
  const histories = await prisma.trip.findMany({
    where: {
      driverId,
      status: "COMPLETED"
    },
    orderBy: {
      departureTime: "desc"
    },
    include: {
      vehicle: true,
      seats: {
        include: {
          booking: true
        }
      }
    }
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="scaffold-page animate-in fade-in mx-auto max-w-3xl p-1 duration-300 sm:p-4">
      {/* Header */}
      <div className="scaffold-header mb-8">
        <h1 className="scaffold-title text-3xl font-black">Riwayat Tugas</h1>
        <p className="scaffold-subtitle text-slate-500">
          Daftar seluruh perjalanan mengemudi Anda yang telah selesai dengan sukses.
        </p>
      </div>

      {/* History list */}
      {histories.length === 0 ? (
        <div className="rounded-2xl border bg-white p-16 text-center text-slate-500 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border bg-slate-50 text-slate-400">
            <History size={28} />
          </div>
          <h4 className="font-bold text-slate-700">Riwayat Anda Kosong</h4>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400">
            Anda belum memiliki riwayat perjalanan mengemudi yang berstatus selesai.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {histories.map((trip) => {
            const bookedCount = trip.seats.filter((s) => s.booking !== null).length;

            return (
              <div
                key={trip.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/5 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[9px] font-bold text-emerald-800 uppercase">
                      <CheckCircle2 size={10} className="text-emerald-700" />
                      Selesai
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {formatDate(trip.departureTime)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-semibold text-slate-400">Waktu Mulai</span>
                    <span className="text-sm font-bold text-slate-700">
                      {formatTime(trip.departureTime)}
                    </span>
                  </div>
                </div>

                {/* Route detail */}
                <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
                  {trip.origin}
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                  {trip.destination}
                </h3>

                {/* Timestamps breakdown */}
                {trip.arrivalTime && (
                  <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-3 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock size={13} /> Durasi Perjalanan
                    </span>
                    <span className="font-bold text-slate-800">
                      Selesai Pada: {formatTime(trip.arrivalTime)} WIB
                    </span>
                  </div>
                )}

                {/* Sub info */}
                <div className="grid grid-cols-2 gap-4 border-t pt-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <Car size={15} className="text-slate-400" />
                    <div>
                      <span className="block font-bold text-slate-800">
                        {trip.vehicle.brand} {trip.vehicle.model}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {trip.vehicle.licensePlate}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={15} className="text-slate-400" />
                    <div>
                      <span className="block font-bold text-slate-800">
                        {bookedCount} Penumpang
                      </span>
                      <span className="text-[10px] text-slate-400">Telah Diantar</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
