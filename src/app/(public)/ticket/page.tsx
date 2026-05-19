/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type FormEvent, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Download,
  MapPin,
  Phone,
  QrCode,
  Search,
  ShieldCheck,
  Ticket,
  UserRound,
  Loader2,
  AlertTriangle,
  Star,
  Activity,
  Trash2,
  HelpCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const statuses = [
  {
    key: "pending",
    label: "Menunggu Pembayaran",
    tone: "border-amber-200 bg-amber-50 text-amber-700"
  },
  {
    key: "paid",
    label: "Sudah Dibayar",
    tone: "border-sky-200 bg-sky-50 text-sky-700"
  },
  {
    key: "confirmed",
    label: "Terkonfirmasi",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  {
    key: "ongoing",
    label: "Dalam Perjalanan",
    tone: "border-teal-200 bg-teal-50 text-teal-700"
  },
  {
    key: "completed",
    label: "Selesai",
    tone: "border-slate-200 bg-slate-50 text-slate-700"
  },
  {
    key: "cancelled",
    label: "Dibatalkan",
    tone: "border-rose-200 bg-rose-50 text-rose-700"
  },
  {
    key: "refunded",
    label: "Refund Selesai",
    tone: "border-purple-200 bg-purple-50 text-purple-700"
  }
];

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0
});

function SearchTicketContent() {
  const searchParams = useSearchParams();

  // Search parameter inputs
  const [bookingCodeInput, setBookingCodeInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  // DB States
  const [booking, setBooking] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [refundCalc, setRefundCalc] = useState<any>(null);
  const [userReview, setUserReview] = useState<any>(null);

  const [hasSearched, setHasSearched] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState<string | null>(null);

  // Cancellation (Refund Submission Form)
  const [refundMethod, setRefundMethod] = useState<"BANK_TRANSFER" | "CASH_PICKUP">("BANK_TRANSFER");
  const [bankName, setBankName] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Rating & Review Panel State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // 1. Check if URL contains booking code parameters and automatically search
  useEffect(() => {
    const code = searchParams.get("code");
    const phone = searchParams.get("phone");

    if (code) {
      setBookingCodeInput(code);
      if (phone) setPhoneInput(phone);
      executeLookup(code, phone || "");
    }
  }, [searchParams]);

  const executeLookup = async (code: string, phone: string) => {
    try {
      setHasSearched(false);
      setErrorSearch(null);
      setLoadingSearch(true);

      const params = new URLSearchParams({ code });
      if (phone) params.set("phone", phone);

      const res = await fetch(`/api/public/ticket?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melacak tiket.");
      }

      setBooking(data.booking);
      setTimeline(data.timeline);
      setRefundCalc(data.refundCalculation);
      setUserReview(data.review);
      setHasSearched(true);
    } catch (err: any) {
      console.error("Lookup ticket error:", err);
      setErrorSearch(err.message || "Gagal melacak tiket. Pastikan Kode Booking benar.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookingCodeInput.trim()) {
      setErrorSearch("Kode booking wajib diisi.");
      return;
    }
    executeLookup(bookingCodeInput, phoneInput);
  };

  // 2. Submit cancellation with refund
  const handleCancelBooking = async () => {
    if (!booking) return;
    try {
      setErrorSearch(null);
      setSubmittingCancel(true);

      const payload = {
        refundMethod,
        bankName: refundMethod === "CASH_PICKUP" ? "CASH" : bankName,
        bankAccountNo: refundMethod === "CASH_PICKUP" ? "CASH" : bankAccountNo,
        bankAccountName: refundMethod === "CASH_PICKUP" ? "CASH" : bankAccountName,
        reason: cancelReason
      };

      const res = await fetch(`/api/public/ticket/${booking.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membatalkan tiket.");
      }

      setCancelSuccess(true);
      // Reload ticket status from backend after 2 seconds
      setTimeout(() => {
        executeLookup(booking.code, booking.phone);
        setCancelSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Cancel ticket error:", err);
      setErrorSearch(err.message || "Gagal mengajukan pembatalan tiket.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  // 3. Submit dynamic star rating & ulasan
  const handleSubmitReview = async () => {
    if (!booking) return;
    try {
      setErrorSearch(null);
      setSubmittingReview(true);

      const payload = {
        rating: reviewRating,
        comment: reviewComment
      };

      const res = await fetch(`/api/public/ticket/${booking.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan ulasan.");
      }

      setReviewSuccess(true);
      setTimeout(() => {
        executeLookup(booking.code, booking.phone);
      }, 1500);
    } catch (err: any) {
      console.error("Review submit error:", err);
      setErrorSearch(err.message || "Gagal mengirimkan ulasan.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeStatus = booking ? statuses.find((status) => status.key === booking.status) : null;

  const tripDetails = booking
    ? [
        { icon: CalendarDays, label: "Tanggal Keberangkatan", value: booking.departureDate },
        { icon: Clock3, label: "Jam Berangkat", value: booking.departureTime },
        { icon: MapPin, label: "Titik Penjemputan", value: booking.pickup },
        { icon: RouteIcon, label: "Titik Pengantaran", value: booking.dropoff },
        { icon: Ticket, label: "Nomor Kursi Anda", value: booking.seat },
        { icon: ShieldCheck, label: "Armada Kendaraan", value: booking.vehicle }
      ]
    : [];

  const paymentRows = booking
    ? [
        { label: "Subtotal Tiket", value: currencyFormatter.format(booking.subtotal) },
        { label: "Pajak Vendor", value: currencyFormatter.format(booking.taxAmount) },
        {
          label: "Biaya Layanan Sistem",
          value: currencyFormatter.format(
            booking.totalAmount - booking.subtotal - booking.taxAmount
          )
        },
        {
          label: "Total Pembayaran Lunas",
          value: currencyFormatter.format(booking.totalAmount),
          strong: true
        }
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.18em] text-[#0D9488] uppercase">
              Status Tiket Perjalanan
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Lacak Booking Travel
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 font-medium text-slate-500 md:text-right">
            Masukkan kode booking dan nomor HP pemesan untuk melihat status perjalanan secara live,
            detail check-in driver, mengajukan refund, atau mengirim ulasan bintang.
          </p>
        </div>

        {/* Search Results / Error display */}
        {errorSearch && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            {errorSearch}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-teal-100/50 bg-teal-50 text-[#0D9488]">
                  <Search className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Cari Booking</h2>
                  <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Lacak Tiket Live
                  </p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSearch}>
                <div>
                  <label className="mb-2 block text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                    Kode Booking
                  </label>
                  <Input
                    placeholder="Contoh: TRV-2605-A94B"
                    value={bookingCodeInput}
                    onChange={(e) => setBookingCodeInput(e.target.value)}
                    aria-label="Kode Booking"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
                    Nomor HP Pemesan
                  </label>
                  <Input
                    placeholder="Contoh: 08123456789"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    aria-label="Nomor HP Pemesan"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-semibold text-slate-900"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loadingSearch}
                  size="lg"
                  className="flex h-12 w-full items-center justify-center gap-2 bg-[#8B5E02] text-base font-bold text-white shadow-lg shadow-amber-900/10 hover:bg-[#744E02]"
                >
                  {loadingSearch ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mencari...
                    </>
                  ) : (
                    <>
                      Cek Status Tiket
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-5 text-xs leading-5 text-slate-400">
                Kode booking dan data kontak tersedia di WhatsApp konfirmasi atau email Anda sesaat
                setelah pembayaran lunas.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold tracking-wider text-slate-950 uppercase">
                Status Milestones
              </h2>
              <div className="space-y-3">
                {statuses.map((status) => {
                  const isActive = booking && booking.status === status.key;
                  return (
                    <div
                      key={status.key}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-bold transition-all",
                        isActive
                          ? `${status.tone} scale-102 shadow-xs ring-2 ring-teal-600/10`
                          : "border-slate-100 bg-slate-50/50 text-slate-400"
                      )}
                    >
                      <span className="tracking-wider uppercase">{status.label}</span>
                      <span className="font-mono text-[10px]">{status.key}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {hasSearched && booking ? (
              <>
                <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-600">
                          {booking.code}
                        </span>
                        {activeStatus && (
                          <span
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-bold tracking-wider uppercase",
                              activeStatus.tone
                            )}
                          >
                            {booking.statusLabel}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-4xl">
                        Detail Booking Perjalanan
                      </h2>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-lg font-bold text-slate-900">
                        <span>{booking.route.split(" ke ")[0]}</span>
                        <ArrowRight className="size-5 text-[#0D9488]" />
                        <span>{booking.route.split(" ke ")[1]}</span>
                      </div>
                      <p className="mt-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                        Berangkat: {booking.departureDate}, pukul {booking.departureTime}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4 md:min-w-56">
                      <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                        Plat Nomor Armada
                      </p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                        {booking.licensePlate}
                      </p>
                      <p className="mt-1 text-xs font-bold tracking-wider text-teal-700 uppercase">
                        {booking.vehicle}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-7" />

                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
                    {timeline.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          "relative rounded-2xl border p-4 transition-all",
                          item.done
                            ? "border-teal-100 bg-teal-50/30"
                            : "border-slate-100 bg-slate-50/50"
                        )}
                      >
                        <div
                          className={cn(
                            "mb-3 flex size-9 items-center justify-center rounded-full shadow-xs transition-all",
                            item.done ? "bg-[#0D9488] text-white" : "bg-slate-200 text-slate-500"
                          )}
                        >
                          {item.done ? (
                            <Check className="size-4 stroke-3" />
                          ) : (
                            <Clock3 className="size-4" />
                          )}
                        </div>
                        <h3 className="text-xs font-bold tracking-wider text-slate-950 uppercase">
                          {item.label}
                        </h3>
                        <p className="mt-1 text-[10px] leading-4 font-semibold text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                  <section className="space-y-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                    <div>
                      <h2 className="mb-5 text-xl font-bold text-slate-950">
                        Informasi Perjalanan
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        {tripDetails.map((detail, idx) => {
                          const Icon = detail.icon;

                          return (
                            <div
                              key={idx}
                              className="rounded-2xl border border-slate-100 bg-slate-50/20 p-4"
                            >
                              <div className="mb-3 flex items-center gap-2 text-slate-500">
                                <Icon className="size-4 text-teal-600" />
                                <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                                  {detail.label}
                                </p>
                              </div>
                              <p className="text-sm leading-6 font-bold text-slate-950">
                                {detail.value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Separator />

                    {/* Driver check-in profile block */}
                    <div>
                      <h2 className="mb-4 text-base font-bold tracking-wider text-slate-950 uppercase">
                        Kontak Driver & Manifest
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-teal-100/50 bg-teal-50 p-5">
                          <div className="mb-3 flex items-center gap-2 text-slate-500">
                            <UserRound className="size-4 text-teal-600" />
                            <p className="text-[10px] font-bold tracking-[0.14em] text-teal-700 uppercase">
                              Driver Bertugas
                            </p>
                          </div>
                          <p className="text-lg leading-tight font-bold text-slate-950">
                            {booking.driverName}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            WhatsApp:{" "}
                            <span className="font-bold text-slate-800">{booking.driverPhone}</span>
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                          <div className="mb-3 flex items-center gap-2 text-slate-500">
                            <Phone className="size-4 text-teal-600" />
                            <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                              Kontak Pemesan
                            </p>
                          </div>
                          <p className="text-lg leading-tight font-bold text-slate-950">
                            {booking.customerName}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {booking.phone} - {booking.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Passenger Manifest details list */}
                    {booking.passengers && booking.passengers.length > 0 && (
                      <div className="space-y-4 rounded-2xl border border-slate-100 p-5">
                        <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                          Manifest Rincian Penumpang
                        </h4>
                        <div className="divide-y divide-slate-100">
                          {booking.passengers.map((p: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between py-3 text-sm"
                            >
                              <div>
                                <p className="font-bold text-slate-950">{p.fullName}</p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  WhatsApp: {p.phone}{" "}
                                  {p.identityNumber ? `| KTP: ${p.identityNumber}` : ""}
                                </p>
                              </div>
                              <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800">
                                Kursi {p.seatNo || booking.seat}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post-Trip Rating Star Review Panel */}
                    {(booking.status === "completed" || booking.status === "confirmed") && (
                      <div className="space-y-4 rounded-3xl border border-amber-100 bg-amber-50/20 p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-950">
                              Berikan Rating Ulasan Anda
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-500">
                              Bagikan pengalaman perjalanan Anda bersama kami.
                            </p>
                          </div>
                        </div>

                        {reviewSuccess ? (
                          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
                            <Check className="h-4 w-4 stroke-3" />
                            Ulasan Anda berhasil dikirim! Terima kasih atas feedback berharga Anda.
                          </div>
                        ) : userReview ? (
                          <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-white p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Ulasan Anda
                              </span>
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "h-4 w-4",
                                      i < userReview.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-200"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm font-bold text-slate-800">
                              &quot;{userReview.comment || "Bintang " + userReview.rating}"
                            </p>
                            <p className="text-[10px] tracking-wide text-slate-400">
                              Dikirim pada{" "}
                              {new Date(userReview.createdAt).toLocaleDateString("id-ID")}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2">
                              <span className="shrink-0 text-xs font-bold tracking-widest text-slate-400 uppercase">
                                Bintang Ulasan:
                              </span>
                              <div className="flex gap-1.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    className="scale-110 transition-all hover:scale-120 focus:outline-none"
                                  >
                                    <Star
                                      className={cn(
                                        "h-6 w-6 transition-all",
                                        star <= reviewRating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-300"
                                      )}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Komentar & Ulasan
                              </label>
                              <Textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Bagaimana kondisi kabin? Apakah driver ramah dan tepat waktu? Tuliskan ulasan Anda..."
                                className="min-h-20 rounded-xl border-slate-200 bg-white text-sm"
                              />
                            </div>

                            <Button
                              onClick={handleSubmitReview}
                              disabled={submittingReview}
                              className="h-10 rounded-xl bg-[#8B5E02] px-6 text-xs font-bold tracking-wider text-white uppercase hover:bg-[#744E02]"
                            >
                              {submittingReview ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Mengirim Ulasan...
                                </>
                              ) : (
                                "Kirim Ulasan Bintang"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  <aside className="space-y-6">
                    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-center gap-3">
                        <CreditCard className="size-5 text-teal-600" />
                        <h2 className="text-lg leading-tight font-bold text-slate-950">
                          Ringkasan Pembayaran
                        </h2>
                      </div>
                      <div className="space-y-3">
                        {paymentRows.map((row, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center justify-between gap-4",
                              row.strong
                                ? "border-t border-slate-100 pt-3 text-base font-bold text-[#0D9488]"
                                : "text-xs font-bold tracking-wider text-slate-400 uppercase"
                            )}
                          >
                            <span>{row.label}</span>
                            <span>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg leading-tight font-bold text-slate-950">
                            Tiket Digital
                          </h2>
                          <p className="mt-1 text-xs font-semibold tracking-widest text-slate-400 uppercase">
                            {booking.ticketNumber}
                          </p>
                        </div>
                        <QrCode className="size-6 text-teal-600" />
                      </div>

                      {/* Dynamic QR code container */}
                      <div className="mx-auto mb-5 grid size-44 grid-cols-5 gap-2 rounded-3xl bg-slate-950 p-4">
                        {Array.from({ length: 25 }).map((_, index) => (
                          <span
                            key={index}
                            className={cn(
                              "rounded-sm",
                              [0, 1, 3, 5, 6, 8, 11, 12, 14, 16, 18, 19, 21, 23, 24].includes(index)
                                ? "bg-white"
                                : "bg-teal-700"
                            )}
                          />
                        ))}
                      </div>

                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                        <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                          Tunjukkan saat boarding
                        </p>
                        <p className="mt-2 text-xs font-bold tracking-wider text-slate-950 uppercase">
                          {booking.customerName} - Kursi {booking.seat}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-teal-900/10 hover:bg-teal-800"
                      >
                        <Download className="size-4" />
                        Unduh Tiket PDF
                      </Button>
                    </section>

                    {/* Cancellation and dynamic refund submission form */}
                    {refundCalc && refundCalc.eligible && (() => {
                      let isVendorCancelled = false;
                      if (booking) {
                        let isVendorCancelledByNotes = false;
                        if (booking.notes) {
                          try {
                            const parsed = JSON.parse(booking.notes);
                            if (parsed.cancelledBy === "VENDOR" || parsed.cancelReason?.toLowerCase().includes("armada") || parsed.cancelReason?.toLowerCase().includes("dibatalkan otomatis")) {
                              isVendorCancelledByNotes = true;
                            }
                          } catch (e) {
                            if (booking.notes.includes("Armada") || booking.notes.includes("dibatalkan otomatis") || booking.notes.includes("VENDOR")) {
                              isVendorCancelledByNotes = true;
                            }
                          }
                        }
                        const isTripCancelled = booking.trip?.status?.toLowerCase() === "cancelled";
                        isVendorCancelled = (isTripCancelled || isVendorCancelledByNotes) && booking.paymentStatus === "PAID" && (!booking.refunds || booking.refunds.length === 0);
                      }
                      
                      return (
                        <section className={`space-y-4 rounded-3xl border p-6 ${
                          isVendorCancelled 
                            ? "border-amber-100 bg-amber-50/15" 
                            : "border-rose-100 bg-rose-50/30"
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                              isVendorCancelled 
                                ? "bg-amber-100 text-amber-700" 
                                : "bg-rose-100 text-rose-700"
                            }`}>
                              {isVendorCancelled ? (
                                <ShieldCheck className="h-5 w-5" />
                              ) : (
                                <Trash2 className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-950">
                                {isVendorCancelled ? "Lengkapi Data Refund" : "Ajukan Pembatalan"}
                              </h3>
                              <p className="mt-0.5 text-xs text-slate-500">
                                {isVendorCancelled 
                                  ? "Jadwal dibatalkan oleh pihak vendor" 
                                  : "Sesuai kebijakan vendor penjemputan."}
                              </p>
                            </div>
                          </div>

                          {/* Calculated refund details */}
                          <div className={`space-y-2.5 rounded-2xl border bg-white p-4 text-xs ${
                            isVendorCancelled ? "border-amber-100" : "border-rose-100"
                          }`}>
                            <div className="flex justify-between">
                              <span className="font-bold text-slate-400 uppercase">Batas Waktu:</span>
                              <span className="font-bold text-slate-800">
                                {isVendorCancelled 
                                  ? "Bebas (Dibatalkan Vendor)" 
                                  : `${refundCalc.hoursBeforeDeparture} jam sebelum berangkat`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold text-slate-400 uppercase">
                                Persentase Refund:
                              </span>
                              <span className="font-mono text-sm font-bold text-emerald-700">
                                {refundCalc.refundPercentage}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-bold text-slate-400 uppercase">
                                Admin Penanganan:
                              </span>
                              <span className="font-bold text-slate-800">
                                {refundCalc.adminFee === 0 
                                  ? "Gratis / Rp 0" 
                                  : currencyFormatter.format(refundCalc.adminFee)}
                              </span>
                            </div>
                            <Separator />
                            <div className={`flex justify-between font-bold ${
                              isVendorCancelled ? "text-amber-800" : "text-rose-800"
                            }`}>
                              <span className="uppercase">Dana Kembali:</span>
                              <span className={`text-base font-bold ${
                                isVendorCancelled ? "text-amber-700" : "text-rose-700"
                              }`}>
                                {currencyFormatter.format(refundCalc.finalAmount)}
                              </span>
                            </div>
                          </div>

                          {cancelSuccess ? (
                            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
                              <Check className="h-4 w-4 stroke-3" />
                              Pembatalan sukses! Mengembalikan saldo...
                            </div>
                          ) : (
                            <div className="space-y-3 pt-2">
                              <h4 className={`text-[10px] font-bold tracking-widest uppercase ${
                                isVendorCancelled ? "text-amber-800" : "text-rose-800"
                              }`}>
                                Metode Pengembalian Dana
                              </h4>
                              
                              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                                <button
                                  type="button"
                                  onClick={() => setRefundMethod("BANK_TRANSFER")}
                                  className={`rounded-lg py-1.5 text-center text-[10px] font-bold transition-all ${
                                    refundMethod === "BANK_TRANSFER"
                                      ? "bg-white text-slate-900 shadow-sm"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  🏦 Transfer Bank
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRefundMethod("CASH_PICKUP")}
                                  className={`rounded-lg py-1.5 text-center text-[10px] font-bold transition-all ${
                                    refundMethod === "CASH_PICKUP"
                                      ? "bg-white text-slate-900 shadow-sm"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  💵 Tunai (Cash Pickup)
                                </button>
                              </div>

                              <div className="space-y-2">
                                {refundMethod === "BANK_TRANSFER" && (
                                  <>
                                    <Input
                                      placeholder="Nama Bank (misal: BCA, Mandiri)"
                                      value={bankName}
                                      onChange={(e) => setBankName(e.target.value)}
                                      className={`h-9 rounded-xl bg-white text-xs ${
                                        isVendorCancelled ? "border-amber-100 focus:border-amber-400" : "border-rose-100 focus:border-rose-400"
                                      }`}
                                    />
                                    <Input
                                      placeholder="Nomor Rekening"
                                      value={bankAccountNo}
                                      onChange={(e) => setBankAccountNo(e.target.value)}
                                      className={`h-9 rounded-xl bg-white text-xs ${
                                        isVendorCancelled ? "border-amber-100 focus:border-amber-400" : "border-rose-100 focus:border-rose-400"
                                      }`}
                                    />
                                    <Input
                                      placeholder="Nama Pemilik Rekening"
                                      value={bankAccountName}
                                      onChange={(e) => setBankAccountName(e.target.value)}
                                      className={`h-9 rounded-xl bg-white text-xs ${
                                        isVendorCancelled ? "border-amber-100 focus:border-amber-400" : "border-rose-100 focus:border-rose-400"
                                      }`}
                                    />
                                  </>
                                )}

                                {refundMethod === "CASH_PICKUP" && (
                                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-[10px] text-amber-800 font-medium leading-relaxed">
                                    💡 <strong>Refund Tunai:</strong> Dana Anda dapat diambil langsung di counter utama vendor setelah pengajuan disetujui oleh Owner/Staff. Harap tunjukkan kode booking ini saat pengambilan.
                                  </div>
                                )}

                                <Textarea
                                  placeholder={isVendorCancelled ? "Alasan refund / Catatan tambahan (Opsional)" : "Alasan pembatalan (Opsional)"}
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  className={`min-h-12 rounded-xl bg-white text-xs ${
                                    isVendorCancelled ? "border-amber-100 focus:border-amber-400" : "border-rose-100 focus:border-rose-400"
                                  }`}
                                />
                              </div>

                              <Button
                                onClick={handleCancelBooking}
                                disabled={
                                  submittingCancel || 
                                  (refundMethod === "BANK_TRANSFER" && (!bankName || !bankAccountNo || !bankAccountName))
                                }
                                className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold tracking-wider text-white uppercase shadow-md ${
                                  isVendorCancelled 
                                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-900/10" 
                                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-900/10"
                                }`}
                              >
                                {submittingCancel ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Memproses Refund...
                                  </>
                                ) : (
                                  isVendorCancelled ? "💸 Ajukan Klaim Refund" : "💸 Batalkan & Ajukan Refund"
                                )}
                              </Button>
                            </div>
                          )}
                        </section>
                      );
                    })()}

                    {/* Refund Status Card (Visible when there is already a refund request submitted) */}
                    {booking.refunds && booking.refunds.length > 0 && (
                      <section className="space-y-4 rounded-3xl border border-amber-100 bg-amber-50/20 p-6">
                        <div className="flex items-start gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <Clock3 className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-950">Status Pengembalian</h3>
                            <p className="mt-0.5 text-xs text-slate-500 font-mono">
                              {booking.refunds[0].refundCode}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-amber-100 bg-white p-4 text-xs">
                          {/* Status Badge */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="font-semibold text-slate-500">Status Refund</span>
                            {booking.refunds[0].status === "PENDING" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                                <Clock3 size={12} className="text-amber-600 animate-pulse" />
                                Menunggu Verifikasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                <Check size={12} className="text-emerald-600 stroke-3" />
                                Dana Dikembalikan
                              </span>
                            )}
                          </div>

                          {/* Method & Destination details */}
                          <div className="space-y-2 text-slate-600">
                            <div className="flex justify-between">
                              <span>Metode Pengembalian</span>
                              <span className="font-bold text-slate-900">
                                {booking.refunds[0].refundMethod === "CASH_PICKUP" ? "💵 TUNAI (CASH)" : "🏦 TRANSFER BANK"}
                              </span>
                            </div>

                            {booking.refunds[0].refundMethod === "BANK_TRANSFER" && (
                              <div className="rounded-xl bg-slate-50 p-2.5 space-y-1 text-[11px] text-slate-700 border border-slate-100">
                                <p className="font-semibold text-slate-900">{booking.refunds[0].customerBankName}</p>
                                <p className="font-mono">{booking.refunds[0].customerBankAccount}</p>
                                <p className="text-slate-500">a.n {booking.refunds[0].customerBankAccountName}</p>
                              </div>
                            )}

                            {booking.refunds[0].refundMethod === "CASH_PICKUP" && (
                              <div className="rounded-xl bg-amber-50/50 p-2.5 text-[11px] text-amber-800 border border-amber-100/50 leading-relaxed font-medium">
                                📍 Uang tunai dapat diambil di counter fisik setelah disetujui. Bawa kode booking ini.
                              </div>
                            )}

                            <div className="flex justify-between pt-1 border-t border-slate-100">
                              <span>Porsi Refund</span>
                              <span className="font-semibold text-slate-900">
                                {currencyFormatter.format(booking.refunds[0].refundAmount)}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span>Biaya Admin Sistem</span>
                              <span className="text-rose-600">
                                -{currencyFormatter.format(booking.refunds[0].adminFee)}
                              </span>
                            </div>

                            <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900 text-sm">
                              <span>Total Dana Kembali</span>
                              <span className="text-teal-700">
                                {currencyFormatter.format(booking.refunds[0].finalAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {booking.refunds[0].status === "PENDING" && (
                          <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-3 text-[11px] text-blue-800 leading-relaxed">
                            💡 <strong>Catatan:</strong> Refund Anda sedang ditinjau oleh staff keuangan vendor. Proses persetujuan membutuhkan waktu sekitar 1x24 jam.
                          </div>
                        )}
                      </section>
                    )}
                  </aside>
                </div>
              </>
            ) : (
              <NotSearchedTicket />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function NotSearchedTicket() {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
      <div className="grid min-h-[560px] gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col justify-center">
          <div className="mb-6 flex size-16 items-center justify-center rounded-3xl border border-teal-100/50 bg-teal-50 text-[#0D9488] shadow-xs">
            <Ticket className="size-8" />
          </div>
          <p className="mb-3 text-xs font-bold tracking-[0.18em] text-slate-400 uppercase">
            Belum Dicari
          </p>
          <h2 className="max-w-xl text-3xl leading-tight font-bold tracking-tight text-slate-950 md:text-5xl">
            Masukkan data booking untuk melacak tiket.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-6 font-medium text-slate-500 md:text-base">
            Informasi rute, status pembayaran, QR boarding, kontak driver bertugas, estimasi
            penjemputan, pembatalan dana kembali, dan rating ulasan bintang akan muncul di area ini
            setelah pencarian berhasil.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Kode Booking",
                text: "Gunakan kode booking unik dari email atau WhatsApp."
              },
              {
                step: "02",
                title: "Nomor HP Pemesan",
                text: "Gunakan nomor kontak pemesan utama."
              },
              { step: "03", title: "Lacak Live", text: "Tiket digital & status perjalanan instan." }
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="mb-3 font-mono text-xs font-bold text-teal-700">{item.step}</p>
                <h3 className="text-xs font-bold tracking-wider text-slate-950 uppercase">
                  {item.title}
                </h3>
                <p className="mt-2 text-[10px] leading-4 font-semibold text-slate-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                  Preview Tiket
                </p>
                <p className="mt-2 text-lg font-bold text-slate-300">TRV-XXXX-XXXX</p>
              </div>
              <QrCode className="size-7 text-slate-300" />
            </div>

            <div className="mx-auto mb-5 grid size-40 grid-cols-5 gap-2 rounded-3xl bg-slate-200 p-4">
              {Array.from({ length: 25 }).map((_, index) => (
                <span
                  key={index}
                  className={cn("rounded-sm", index % 3 === 0 ? "bg-white" : "bg-slate-300")}
                />
              ))}
            </div>

            <div className="space-y-3">
              <div className="h-4 rounded-full bg-slate-200" />
              <div className="h-4 w-3/4 rounded-full bg-slate-200" />
              <div className="h-11 rounded-2xl bg-slate-200" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-[#0D9488]" />
              <div>
                <h3 className="text-sm font-bold text-slate-950">Data booking terenkripsi</h3>
                <p className="mt-1 text-xs leading-4 font-semibold text-slate-400">
                  Hanya pemesan sah yang memiliki Kode Booking valid dan WhatsApp terdaftar yang
                  dapat melihat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RouteIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M18 9v2a4 4 0 0 1-4 4H10" />
      <polyline points="14 7 18 3 22 7" />
    </svg>
  );
}

export default function SearchTicket() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-solid border-teal-700 border-t-transparent"></div>
            <p className="mt-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
              Memuat Pelacakan Tiket...
            </p>
          </div>
        </div>
      }
    >
      <SearchTicketContent />
    </Suspense>
  );
}
