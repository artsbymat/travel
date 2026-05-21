/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Phone,
  CheckCircle2,
  Clock,
  Play,
  Check,
  AlertTriangle,
  Loader2,
  Landmark,
  MessageSquare,
  ShieldAlert,
  Map
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/ui/feedback-modal";

const LeafletPickupMap = dynamic(() => import("@/components/map/LeafletPickupMap"), { ssr: false });

interface BookingInfo {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  pickupAddress?: string | null;
  notes?: string | null;
}

interface SeatInfo {
  id: string;
  seatNo: string;
  row: number;
  column: number;
  status: string;
  bookingId: string | null;
  booking: BookingInfo | null;
}

interface TripInfo {
  id: string;
  origin: string;
  destination: string;
  originDetail: string | null;
  destinationDetail: string | null;
  departureTime: string;
  arrivalTime: string | null;
  price: number;
  status: string;
  notes: string | null;
  vehicle: {
    id: string;
    licensePlate: string;
    brand: string;
    model: string;
    capacity: number;
    seatLayout: any;
  };
  seats: SeatInfo[];
}

interface TripOperationsClientProps {
  trip: TripInfo;
  checkedInSeats: string[];
}

export default function TripOperationsClient({
  trip,
  checkedInSeats: initialCheckedIn
}: TripOperationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Boarding & check-in state
  const [checkedInSeats, setCheckedInSeats] = useState<string[]>(initialCheckedIn);

  // Delay/SOS reporting dialog state
  const [isDelayDialogOpen, setIsDelayDialogOpen] = useState(false);
  const [delayReason, setDelayReason] = useState("");

  // Submission & Loader states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    message: ""
  });

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Filter only seats that are booked
  const bookedSeats = trip.seats
    .filter((s) => s.booking !== null)
    .sort((a, b) => a.seatNo.localeCompare(b.seatNo, undefined, { numeric: true }));

  const checkedInCount = bookedSeats.filter((s) => checkedInSeats.includes(s.seatNo)).length;
  const totalBooked = bookedSeats.length;

  const handleWhatsApp = (phone: string, name: string) => {
    // Cleanse phone number (replace leading 0 with 62)
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.substring(1);
    }
    const message = encodeURIComponent(
      `Halo Kak ${name}, saya driver FluxFleet untuk perjalanan Anda dari ${trip.origin} ke ${trip.destination} hari ini. Armada kami dengan nomor plat ${trip.vehicle.licensePlate} akan segera bersiap. Apakah Kakak sudah berada di titik penjemputan?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  const handleTripAction = async (action: "START" | "COMPLETE" | "DELAY") => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/driver/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: action === "DELAY" ? delayReason : undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui status perjalanan.");
      }

      setFeedback({
        isOpen: true,
        type: "success",
        title: "Perubahan Disimpan",
        message:
          action === "START"
            ? "Perjalanan resmi dimulai! Hati-hati di jalan dan utamakan keselamatan."
            : action === "COMPLETE"
              ? "Perjalanan telah berhasil diselesaikan! Terima kasih atas dedikasi Anda."
              : "Hambatan berhasil dilaporkan ke sistem utama."
      });

      if (action === "DELAY") {
        setIsDelayDialogOpen(false);
        setDelayReason("");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal Memproses",
        message: err.message || "Terjadi kesalahan koneksi."
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckIn = async (seatNo: string, bookingId: string, customerName: string) => {
    setActionLoading(`check-in-${seatNo}`);
    try {
      const res = await fetch(`/api/driver/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_IN",
          bookingId,
          seatNo,
          customerName
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan check-in.");
      }

      setCheckedInSeats((prev) => [...prev, seatNo]);
      setFeedback({
        isOpen: true,
        type: "success",
        title: "Check-in Berhasil",
        message: `Penumpang ${customerName} (Kursi ${seatNo}) telah naik ke kabin.`
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal Check-in",
        message: err.message || "Terjadi kesalahan koneksi."
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openGoogleMaps = () => {
    const originUrl = encodeURIComponent(trip.originDetail || trip.origin);
    const destUrl = encodeURIComponent(trip.destinationDetail || trip.destination);
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${originUrl}&destination=${destUrl}`,
      "_blank"
    );
  };

  const getTripStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Selesai";
      case "ONGOING":
        return "Sedang Jalan";
      case "DELAYED":
        return "Ada Hambatan";
      case "SCHEDULED":
        return "Terjadwal";
      case "WAITING_DRIVER":
        return "Menunggu Driver";
      default:
        return status;
    }
  };

  const getTripStatusBadgeColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "ONGOING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELAYED":
        return "bg-amber-100 text-amber-800 border-amber-200 animate-pulse";
      case "SCHEDULED":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const renderBookingNotes = (notesStr?: string | null) => {
    if (!notesStr) return null;
    try {
      const parsed = JSON.parse(notesStr);
      const { pickupAddress, dropoffAddress, customerNotes } = parsed;
      if (!pickupAddress && !dropoffAddress && !customerNotes) return null;
      return (
        <div className="mt-1.5 max-w-xs space-y-0.5 rounded-lg border bg-slate-50 p-2 text-[10px] leading-normal font-medium text-slate-500">
          {pickupAddress && (
            <div>
              <strong className="text-slate-700">Jemput:</strong> {pickupAddress}
            </div>
          )}
          {dropoffAddress && (
            <div>
              <strong className="text-slate-700">Antar:</strong> {dropoffAddress}
            </div>
          )}
          {customerNotes && (
            <div>
              <strong className="text-slate-700">Catatan:</strong> {customerNotes}
            </div>
          )}
        </div>
      );
    } catch (e) {
      return (
        <div className="mt-1.5 max-w-xs rounded-lg border bg-slate-50 p-2 text-[10px] leading-normal font-medium text-slate-500">
          <strong>Catatan Jemputan:</strong> {notesStr}
        </div>
      );
    }
  };

  return (
    <div className="scaffold-page animate-in fade-in mx-auto max-w-3xl p-1 duration-300 sm:p-4">
      {/* Navigation Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/driver/schedule"
          className="rounded-xl border bg-white p-2 text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Detail Tugas Aktif
          </span>
          <h2 className="text-xl font-black tracking-tight text-slate-800">
            Operasional Perjalanan
          </h2>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="mb-6 rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${getTripStatusBadgeColor(trip.status)}`}
              >
                {getTripStatusText(trip.status)}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {formatDate(trip.departureTime)}
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              {trip.origin} → {trip.destination}
            </h3>
          </div>
          <div className="text-right">
            <span className="block text-xs font-semibold text-slate-400">Jam Keberangkatan</span>
            <span className="text-lg font-black text-slate-800">
              {formatTime(trip.departureTime)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4 text-xs font-medium text-slate-600">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">
              Armada Kendaraan
            </span>
            <span className="mt-1 block text-sm font-bold text-slate-800">
              {trip.vehicle.brand} {trip.vehicle.model}
            </span>
            <span className="mt-0.5 block font-mono text-slate-500">
              {trip.vehicle.licensePlate}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">
              Kapasitas Kursi
            </span>
            <span className="mt-1 block text-sm font-bold text-slate-800">
              {trip.vehicle.capacity} Kursi Penumpang
            </span>
          </div>
        </div>

        {trip.notes && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Catatan Operasional:</strong> {trip.notes}
          </div>
        )}
      </div>

      {/* Primary Actions Grid (Thumb-Friendly Controls) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Navigation Map Action */}
        <button
          onClick={openGoogleMaps}
          className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-slate-800 font-bold text-white shadow-md transition-all hover:bg-slate-900 active:scale-[0.98]"
        >
          <Navigation className="h-5 w-5" />
          Buka Google Maps
        </button>

        {/* SOS / Report Delay Action */}
        {trip.status !== "COMPLETED" && (
          <button
            onClick={() => setIsDelayDialogOpen(true)}
            className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-amber-500 font-bold text-white shadow-md transition-all hover:bg-amber-600 active:scale-[0.98]"
          >
            <AlertTriangle className="h-5 w-5" />
            Laporkan Hambatan (Delay)
          </button>
        )}
      </div>

      {/* Main Lifecycle State Controllers */}
      <div className="mb-8">
        {trip.status === "COMPLETED" ? (
          <div className="animate-in zoom-in rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-800 shadow-sm duration-300">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
            <h4 className="text-lg font-bold">Perjalanan Telah Selesai</h4>
            <p className="mt-1 text-xs text-emerald-600">
              Terima kasih atas kerja keras Anda hari ini. Perjalanan aman dan terekam di sistem
              utama.
            </p>
          </div>
        ) : trip.status === "ONGOING" || trip.status === "DELAYED" ? (
          <button
            disabled={actionLoading === "COMPLETE" || isPending}
            onClick={() => handleTripAction("COMPLETE")}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 text-lg font-black text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
          >
            {actionLoading === "COMPLETE" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="h-6 w-6" />
                Selesaikan Perjalanan
              </>
            )}
          </button>
        ) : (
          <button
            disabled={actionLoading === "START" || isPending}
            onClick={() => handleTripAction("START")}
            className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-teal-600 text-lg font-black text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50"
          >
            {actionLoading === "START" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Memulai...
              </>
            ) : (
              <>
                <Play className="h-6 w-6 fill-current" />
                Mulai Perjalanan Sekarang
              </>
            )}
          </button>
        )}
      </div>

      {/* Pickup Points Map */}
      {(() => {
        const pickupPoints = bookedSeats
          .filter((s) => s.booking?.pickupLat && s.booking?.pickupLng)
          .map((s) => ({
            lat: s.booking!.pickupLat!,
            lng: s.booking!.pickupLng!,
            customerName: s.booking!.customerName,
            seatNo: s.seatNo,
            address: s.booking!.pickupAddress || undefined,
            phone: s.booking!.customerPhone,
          }));

        if (pickupPoints.length === 0) return null;

        return (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Map size={18} className="text-teal-600" />
              <h4 className="font-bold text-slate-800">Peta Titik Penjemputan</h4>
              <span className="ml-auto rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
                {pickupPoints.length} titik
              </span>
            </div>
            <LeafletPickupMap points={pickupPoints} className="h-[320px]" />
          </div>
        );
      })()}

      {/* Boarding Manifest Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-800">Manifes Penumpang</h4>
          <p className="mt-0.5 text-xs text-slate-500">
            Daftar booking kursi berbayar aktif untuk trip ini.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          Boarding: {checkedInCount} / {totalBooked} Penumpang
        </span>
      </div>

      {/* Passenger Manifest List */}
      {bookedSeats.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-slate-500 shadow-sm">
          <Landmark className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <h5 className="font-bold text-slate-700">Belum Ada Penumpang</h5>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400">
            Tidak ada pembelian tiket yang tercatat pada perjalanan terjadwal ini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {bookedSeats.map((seat) => {
            const hasBoarded = checkedInSeats.includes(seat.seatNo);
            const isBoardingLoading = actionLoading === `check-in-${seat.seatNo}`;
            const booking = seat.booking!;

            return (
              <div
                key={seat.id}
                className={`flex flex-col justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-all sm:flex-row sm:items-center ${
                  hasBoarded ? "border-emerald-200 bg-emerald-50/20" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Seat badge */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                      hasBoarded
                        ? "border border-emerald-200 bg-emerald-100 text-emerald-800"
                        : "border border-slate-200 bg-slate-100 text-slate-700"
                    }`}
                  >
                    {seat.seatNo}
                  </div>
                  <div>
                    <h5 className="flex items-center gap-2 font-bold text-slate-800">
                      {booking.customerName}
                      {hasBoarded && (
                        <span className="inline-flex items-center gap-0.5 rounded border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[8px] font-bold text-emerald-800 uppercase">
                          Naik
                        </span>
                      )}
                    </h5>
                    <span className="mt-0.5 block font-mono text-[10px] font-bold text-slate-400">
                      TICKET: {booking.bookingCode}
                    </span>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1">
                      {booking.paymentMethod === "CASH" ? (
                        booking.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 border border-emerald-250 text-emerald-800 text-[9px] font-bold px-2 py-0.5 shadow-sm">
                            TUNAI (LUNAS)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-100 border border-rose-250 text-rose-800 text-[9px] font-black px-2 py-0.5 shadow-sm animate-pulse">
                            TUNAI: TAGIH Rp {booking.totalAmount.toLocaleString("id-ID")}
                          </span>
                        )
                      ) : (
                        booking.paymentStatus === "PAID" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-blue-50 border border-blue-200 text-blue-700 text-[9px] font-bold px-2 py-0.5">
                            LUNAS ({booking.paymentMethod})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold px-2 py-0.5">
                            PENDING ({booking.paymentMethod})
                          </span>
                        )
                      )}
                    </div>
                    {renderBookingNotes(booking.notes)}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {/* Pickup Coordinate Navigation */}
                  {booking.pickupLat && booking.pickupLng && (
                    <button
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${booking.pickupLat},${booking.pickupLng}`,
                          "_blank"
                        )
                      }
                      className="animate-in zoom-in flex items-center justify-center rounded-xl border bg-white p-2.5 text-blue-600 shadow-sm transition-colors duration-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                      title="Lokasi Penjemputan Penumpang"
                    >
                      <MapPin size={16} />
                    </button>
                  )}

                  {/* Whatsapp Quick Contact */}
                  <button
                    onClick={() => handleWhatsApp(booking.customerPhone, booking.customerName)}
                    className="flex items-center justify-center rounded-xl border bg-white p-2.5 text-emerald-600 shadow-sm transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                    title="Hubungi Penumpang"
                  >
                    <MessageSquare size={16} />
                  </button>

                  {/* Boarding Trigger button */}
                  {trip.status !== "COMPLETED" &&
                    (hasBoarded ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800">
                        <Check size={14} className="font-bold text-emerald-700" />
                        Sudah Naik
                      </span>
                    ) : (
                      <Button
                        disabled={isBoardingLoading || isPending}
                        onClick={() => handleCheckIn(seat.seatNo, booking.id, booking.customerName)}
                        className="h-9 rounded-xl bg-teal-600 text-xs font-semibold text-white shadow hover:bg-teal-700"
                      >
                        {isBoardingLoading ? (
                          <>
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            Loading
                          </>
                        ) : (
                          "Check-in"
                        )}
                      </Button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DELAY / SOS REPORT DIALOG */}
      {isDelayDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
          <div className="animate-in fade-in zoom-in mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl duration-300">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-800">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Laporkan Hambatan (Delay)
            </h3>
            <p className="mb-4 text-xs text-slate-500">
              Masukkan deskripsi hambatan operasional (macet parah, ban bocor, cuaca ekstrem).
              Informasi ini akan diteruskan ke panel Owner dan Penumpang.
            </p>

            <textarea
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              placeholder="Contoh: Terjadi ban bocor di KM 52 Tol Cipali, memerlukan waktu 30 menit perbaikan."
              className="mb-4 h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
              required
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl text-slate-700"
                onClick={() => {
                  setIsDelayDialogOpen(false);
                  setDelayReason("");
                }}
              >
                Batal
              </Button>
              <Button
                disabled={actionLoading === "DELAY" || !delayReason.trim()}
                onClick={() => handleTripAction("DELAY")}
                className="flex-1 rounded-xl bg-amber-500 font-bold text-white hover:bg-amber-600"
              >
                {actionLoading === "DELAY" ? (
                  <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Melaporkan...
                  </>
                ) : (
                  "Kirim Laporan"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK MODAL */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
