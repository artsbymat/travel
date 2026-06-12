/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  Search,
  ArrowRightLeft,
  Loader2,
  Check,
  X,
  Wallet,
  ShieldAlert,
  Calendar,
  MapPin,
  User,
  Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/ui/feedback-modal";

type WalletData = {
  balance: number;
  pendingIn: number;
  debt: number;
  totalEarned: number;
};

type PendingCashBooking = {
  id: string;
  bookingCode: string;
  customerName: string;
  totalAmount: number;
  vendorAmount: number;
  paymentMethod: string;
  createdAt: string;
  trip: {
    origin: string;
    destination: string;
    departureTime: string;
  };
};

type PendingRefund = {
  id: string;
  refundCode: string;
  bookingId: string;
  bookingCode: string;
  customerName: string;
  refundAmount: number;
  adminFee: number;
  finalAmount: number;
  refundMethod: string;
  customerBankName: string | null;
  customerBankAccount: string | null;
  customerBankAccountName: string | null;
  status: string;
  reason: string | null;
  requestedAt: string;
};

type RecentBooking = {
  id: string;
  bookingCode: string;
  customerName: string;
  totalAmount: number;
  vendorAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  trip: {
    origin: string;
    destination: string;
    departureTime: string;
  };
};

interface StaffBookingsPageContentProps {
  initialData: {
    wallet: WalletData;
    pendingCashBookings: PendingCashBooking[];
    pendingRefunds: PendingRefund[];
    recentBookings: RecentBooking[];
  };
}

export default function StaffBookingsPageContent({ initialData }: StaffBookingsPageContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"cash" | "refunds" | "all">("cash");
  const [bookingSearch, setBookingSearch] = useState("");

  // Loading states for individual buttons
  const [approvingBookingId, setApprovingBookingId] = useState<string | null>(null);
  const [approvingRefundId, setApprovingRefundId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title?: string;
    message: string;
  }>({ isOpen: false, type: "success", message: "" });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const handleApproveCash = async (bookingId: string, code: string, amount: number) => {
    setApprovingBookingId(bookingId);
    try {
      const res = await fetch(`/api/owner/bookings/${bookingId}/approve-cash`, {
        method: "POST"
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyetujui pembayaran kas.");
      }

      setFeedback({
        isOpen: true,
        type: "success",
        title: "Pembayaran Disetujui",
        message: `Pembayaran tunai untuk booking ${code} sebesar ${formatCurrency(amount)} berhasil disetujui.`
      });

      // Refresh the page state to reflect modifications
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Persetujuan Gagal",
        message: err.message || "Koneksi server terganggu."
      });
    } finally {
      setApprovingBookingId(null);
    }
  };

  const handleApproveRefund = async (refundId: string, refundCode: string, amount: number) => {
    setApprovingRefundId(refundId);
    try {
      const res = await fetch(`/api/owner/refunds/${refundId}/approve`, {
        method: "POST"
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyetujui pengembalian dana.");
      }

      setFeedback({
        isOpen: true,
        type: "success",
        title: "Refund Selesai",
        message: `Pengajuan refund ${refundCode} sebesar ${formatCurrency(amount)} telah disetujui dan diselesaikan.`
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Refund Gagal",
        message: err.message || "Koneksi server terganggu."
      });
    } finally {
      setApprovingRefundId(null);
    }
  };

  // Filter recent bookings dynamically
  const filteredBookings = initialData.recentBookings.filter((b) => {
    const q = bookingSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      b.bookingCode.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.trip.origin.toLowerCase().includes(q) ||
      b.trip.destination.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "CONFIRMED":
      case "PAID":
        return (
          <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            Lunas
          </span>
        );
      case "PENDING":
      case "UNPAID":
        return (
          <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            Pending
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
            Refunded
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="scaffold-page animate-in fade-in p-6 duration-300">
      {/* Page Header */}
      <div className="scaffold-header mb-8">
        <h1 className="scaffold-title text-3xl font-black">Validasi &amp; Pembatalan</h1>
        <p className="scaffold-subtitle text-slate-500">
          Otorisasi pembayaran kasir dan proses pengembalian dana (refund) untuk kustomer.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="mb-6 flex max-w-lg rounded-xl border bg-slate-100/60 p-1">
        <button
          onClick={() => setActiveTab("cash")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
            activeTab === "cash"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Konfirmasi Kas ({initialData.pendingCashBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("refunds")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
            activeTab === "refunds"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Persetujuan Refund ({initialData.pendingRefunds.length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
            activeTab === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Riwayat Booking
        </button>
      </div>

      {/* Tab 1: CASH approvals */}
      {activeTab === "cash" && (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-slate-50/50 p-5">
            <h3 className="flex items-center gap-2 font-bold text-slate-800">
              <Banknote className="text-emerald-600" size={18} /> Pembayaran Tunai Menunggu
              Konfirmasi
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              PENTING: Pastikan Anda telah menerima uang fisik secara penuh dari pelanggan di
              counter loket sebelum mengklik tombol setujui.
            </p>
          </div>

          {initialData.pendingCashBookings.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={22} />
              </div>
              <h4 className="font-bold text-slate-700">Semua Tunai Lunas!</h4>
              <p className="mx-auto mt-1 max-w-sm px-4 text-xs text-slate-500">
                Tidak ada pembayaran kasir tertunda. Semua pesanan tunai telah terkonfirmasi.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
                    <th className="p-4">Kode Booking</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Detail Perjalanan</th>
                    <th className="p-4">Dibuat Pada</th>
                    <th className="p-4 text-right">Total Tagihan</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {initialData.pendingCashBookings.map((b) => {
                    const isApproving = approvingBookingId === b.id;
                    return (
                      <tr key={b.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-slate-900">{b.bookingCode}</td>
                        <td className="p-4 font-semibold text-slate-800">{b.customerName}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <MapPin size={12} className="text-slate-400" />
                            {b.trip.origin} → {b.trip.destination}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                            <Calendar size={10} />
                            {formatDate(b.trip.departureTime)}
                          </div>
                        </td>
                        <td className="p-4 text-slate-500">{formatDate(b.createdAt)}</td>
                        <td className="p-4 text-right text-sm font-black text-slate-900">
                          {formatCurrency(b.totalAmount)}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            disabled={isApproving || isPending}
                            onClick={() => handleApproveCash(b.id, b.bookingCode, b.totalAmount)}
                            className="mx-auto flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-95"
                          >
                            {isApproving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Setujui Kas
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: REFUND approvals */}
      {activeTab === "refunds" && (
        <div className="flex flex-col gap-6">
          {/* Info Vendor Wallet Card */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-linear-to-r from-slate-50 to-slate-100 p-6 text-slate-800 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-600 shadow-xs">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-teal-700 uppercase">
                  Saldo Dompet Vendor
                </p>
                <p className="mt-1 text-2xl font-black text-slate-900">
                  {formatCurrency(initialData.wallet.balance)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-lg border border-teal-200 bg-teal-100/50 px-3 py-1 text-xs font-bold text-teal-800">
                Otorisasi Aktif
              </span>
              <p className="mt-1 text-[10px] text-slate-400">
                Persetujuan refund non-tunai langsung mendebit saldo ini.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b bg-slate-50/50 p-5">
              <h3 className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldAlert className="text-rose-600" size={18} /> Permintaan Pembatalan &amp;
                Pengembalian Dana
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Untuk pengembalian transfer bank, pastikan saldo dompet vendor mencukupi.
                Pengembalian cash pickup dapat dilakukan langsung di loket fisik.
              </p>
            </div>

            {initialData.pendingRefunds.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={22} />
                </div>
                <h4 className="font-bold text-slate-700">Semua Refund Selesai!</h4>
                <p className="mx-auto mt-1 max-w-sm px-4 text-xs text-slate-500">
                  Tidak ada antrean permintaan refund tertunda saat ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
                      <th className="p-4">Kode Refund / Tiket</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Tujuan Transfer</th>
                      <th className="p-4">Alasan</th>
                      <th className="p-4">Diajukan Pada</th>
                      <th className="p-4 text-right">Dana Kembali</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {initialData.pendingRefunds.map((r) => {
                      const isApproving = approvingRefundId === r.id;
                      const isInsufficient =
                        r.refundMethod !== "CASH_PICKUP" &&
                        initialData.wallet.balance < r.finalAmount;

                      return (
                        <tr key={r.id} className="transition-colors hover:bg-slate-50/50">
                          <td className="p-4">
                            <div className="font-mono font-bold text-slate-900">{r.refundCode}</div>
                            <div className="mt-1 font-mono text-[10px] text-slate-400">
                              Tiket: {r.bookingCode}
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-800">{r.customerName}</td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                                r.refundMethod === "CASH_PICKUP"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {r.refundMethod === "CASH_PICKUP" ? "Loket Tunai" : "Transfer Bank"}
                            </span>
                            {r.refundMethod === "BANK_TRANSFER" && (
                              <div className="mt-1 leading-normal font-medium text-slate-500">
                                {r.customerBankName} - {r.customerBankAccount} <br />
                                a.n {r.customerBankAccountName}
                              </div>
                            )}
                          </td>
                          <td
                            className="max-w-xs truncate p-4 text-slate-500 italic"
                            title={r.reason || ""}
                          >
                            &quot;{r.reason || "Tidak ada alasan spesifik."}&quot;
                          </td>
                          <td className="p-4 text-slate-400">{formatDate(r.requestedAt)}</td>
                          <td className="p-4 text-right text-sm font-black text-rose-600">
                            {formatCurrency(r.finalAmount)}
                            <div className="mt-0.5 text-[9px] font-normal text-slate-400">
                              (R: {formatCurrency(r.refundAmount)}, Admin: -10K)
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <Button
                                disabled={isApproving || isPending || isInsufficient}
                                onClick={() =>
                                  handleApproveRefund(r.id, r.refundCode, r.finalAmount)
                                }
                                className={`flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white shadow-md transition-all active:scale-95 ${
                                  isInsufficient
                                    ? "bg-slate-350 cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 shadow-none"
                                    : "bg-teal-600 hover:bg-teal-700"
                                }`}
                              >
                                {isApproving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check size={14} />
                                )}
                                Setujui Refund
                              </Button>
                              {isInsufficient && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600">
                                  <AlertCircle size={10} /> Saldo Kurang
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Recent Bookings list & search */}
      {activeTab === "all" && (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {/* Search bar & filter */}
          <div className="flex flex-col gap-4 border-b bg-slate-50/50 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Daftar Reservasi Terbaru</h3>
              <p className="mt-1 text-xs text-slate-500">
                Pencarian dan monitoring seluruh status pesanan tiket bus.
              </p>
            </div>
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode booking atau nama..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-9 text-xs text-slate-800 shadow-sm transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none sm:w-72"
              />
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <ArrowRightLeft size={20} />
              </div>
              <h4 className="font-bold text-slate-700">Tidak Ada Hasil</h4>
              <p className="mx-auto mt-1 max-w-sm px-4 text-xs text-slate-500">
                Tidak ada pesanan tiket yang cocok dengan kata pencarian &quot;{bookingSearch}
                &quot;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
                    <th className="p-4">Kode Booking</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Rute Perjalanan</th>
                    <th className="p-4">Metode Bayar</th>
                    <th className="p-4">Tanggal Pesan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Total Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-slate-900">{b.bookingCode}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{b.customerName}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {b.trip.origin} → {b.trip.destination}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {formatDate(b.trip.departureTime)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center rounded border bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {b.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{formatDate(b.createdAt)}</td>
                      <td className="p-4">{getStatusBadge(b.paymentStatus || b.status)}</td>
                      <td className="p-4 text-right font-bold text-slate-900">
                        {formatCurrency(b.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Feedback Alert Modals */}
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
