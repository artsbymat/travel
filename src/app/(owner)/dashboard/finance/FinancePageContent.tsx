/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowRightLeft,
  Landmark,
  FileText
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/ui/feedback-modal";

interface BookingItem {
  id: string;
  bookingCode: string;
  customerName: string;
  totalAmount: number;
  vendorAmount: number;
  paymentMethod: string;
  paidAt: string;
  trip: {
    origin: string;
    destination: string;
    departureTime: string;
  };
}

interface WithdrawalItem {
  id: string;
  amount: number;
  adminFee: number;
  netAmount: number;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  rejectedReason: string | null;
  reference: string | null;
  notes: string | null;
}

interface PendingCashItem {
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
}

interface RefundItem {
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
}

interface FinancePageContentProps {
  initialData: {
    wallet: {
      balance: number;
      pendingIn: number;
      debt: number;
      totalEarned: number;
    };
    todayRevenue: number;
    todayBookingCount: number;
    monthRevenue: number;
    monthBookingCount: number;
    recentBookings: BookingItem[];
    withdrawals: WithdrawalItem[];
    pendingCashBookings: PendingCashItem[];
    pendingRefunds: RefundItem[];
  };
}

const IndonesianBanks = [
  "BCA - Bank Central Asia",
  "Mandiri - Bank Mandiri",
  "BNI - Bank Negara Indonesia",
  "BRI - Bank Rakyat Indonesia",
  "CIMB Niaga - Bank CIMB Niaga",
  "Permata - Bank Permata",
  "Danamon - Bank Danamon",
  "BSI - Bank Syariah Indonesia",
  "BTN - Bank Tabungan Negara",
  "Bank Jago",
  "Allo Bank"
];

export default function FinancePageContent({ initialData }: FinancePageContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<
    "summary" | "withdrawals" | "cash_approvals" | "refunds"
  >("summary");
  const [approvingBookingId, setApprovingBookingId] = useState<string | null>(null);
  const [approvingRefundId, setApprovingRefundId] = useState<string | null>(null);

  const handleApproveCash = async (bookingId: string, code: string, amount: number) => {
    setApprovingBookingId(bookingId);
    try {
      const res = await fetch(`/api/owner/bookings/${bookingId}/approve-cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyetujui pembayaran cash.");
      }

      setFeedback({
        isOpen: true,
        type: "success",
        title: "Pembayaran Disetujui",
        message: `Pembayaran tunai tiket ${code} sebesar Rp ${amount.toLocaleString("id-ID")} telah sukses divalidasi dan masuk ke sistem keuangan.`
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal Memproses",
        message: err.message || "Terjadi kesalahan koneksi atau server."
      });
    } finally {
      setApprovingBookingId(null);
    }
  };

  const handleApproveRefund = async (refundId: string, refundCode: string, finalAmount: number) => {
    setApprovingRefundId(refundId);
    try {
      const res = await fetch(`/api/owner/refunds/${refundId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyetujui refund.");
      }

      setFeedback({
        isOpen: true,
        type: "success",
        title: "Refund Berhasil Disetujui",
        message: `Persetujuan pengembalian dana ${refundCode} sebesar Rp ${finalAmount.toLocaleString("id-ID")} telah sukses diproses dan didebit dari saldo wallet Anda.`
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal Memproses Refund",
        message: err.message || "Terjadi kesalahan koneksi atau server."
      });
    } finally {
      setApprovingRefundId(null);
    }
  };

  // Booking Filters State
  const [bookingSearch, setBookingSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("ALL");

  // Withdrawal Filters State
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState("ALL");

  // Withdrawal Form Sheet State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [notes, setNotes] = useState("");

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Selesai
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <Loader2 size={13} className="animate-spin text-amber-600" />
            Diproses
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <Clock size={13} className="text-blue-600" />
            Menunggu
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            <XCircle size={13} className="text-red-600" />
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Filters for Bookings
  const filteredBookings = initialData.recentBookings.filter((b) => {
    const matchesSearch =
      b.bookingCode.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.customerName.toLowerCase().includes(bookingSearch.toLowerCase());
    const matchesMethod = paymentMethodFilter === "ALL" || b.paymentMethod === paymentMethodFilter;
    return matchesSearch && matchesMethod;
  });

  // Filters for Withdrawals
  const filteredWithdrawals = initialData.withdrawals.filter((w) => {
    return withdrawStatusFilter === "ALL" || w.status === withdrawStatusFilter;
  });

  const handleMaxWithdraw = () => {
    setWithdrawAmount(initialData.wallet.balance.toString());
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(amountNum) || amountNum <= 0) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Nominal Tidak Valid",
        message: "Silakan masukkan jumlah penarikan yang valid dan lebih besar dari Rp 0."
      });
      return;
    }

    if (amountNum > initialData.wallet.balance) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Saldo Kurang",
        message: "Jumlah penarikan melebihi saldo yang tersedia di wallet Anda."
      });
      return;
    }

    if (!selectedBank) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Bank Belum Dipilih",
        message: "Silakan pilih bank tujuan penarikan saldo."
      });
      return;
    }

    if (!accountNo.trim() || !accountName.trim()) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Informasi Rekening Salah",
        message: "Silakan lengkapi Nomor Rekening dan Nama Pemilik Rekening dengan benar."
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/owner/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          bankName: selectedBank,
          bankAccountNo: accountNo.trim(),
          bankAccountName: accountName.trim(),
          notes: notes.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses penarikan.");
      }

      setIsSheetOpen(false);
      setWithdrawAmount("");
      setSelectedBank("");
      setAccountNo("");
      setAccountName("");
      setNotes("");

      setFeedback({
        isOpen: true,
        type: "success",
        title: "Permintaan Dikirim",
        message:
          "Permintaan penarikan saldo Anda telah berhasil dicatat. Tim kami akan segera memproses dalam 1x24 jam."
      });

      // Refresh the server state
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal Menarik Saldo",
        message: err.message || "Terjadi masalah koneksi atau server."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="scaffold-page animate-in fade-in p-1 duration-300 sm:p-4">
      {/* Header */}
      <div className="scaffold-header mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="scaffold-title text-3xl font-black">Modul Keuangan</h1>
          <p className="scaffold-subtitle text-slate-500">
            Kanal kelola pendapatan, wallet saldo, dan penarikan terpusat untuk Owner.
          </p>
        </div>
        {initialData.wallet.balance > 0 && (
          <Button
            onClick={() => setIsSheetOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl bg-teal-600 px-6 font-semibold text-white shadow-lg shadow-teal-600/20 transition-all hover:bg-teal-700 active:scale-95"
          >
            <Wallet size={16} /> Tarik Saldo Wallet
          </Button>
        )}
      </div>

      {/* Platform Debt Warning Alert (Enterprise UX) */}
      {initialData.wallet.debt > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h4 className="text-sm font-bold text-amber-800">Tagihan Operasional Terdeteksi</h4>
            <p className="mt-1 text-xs text-amber-700">
              Vendor Anda memiliki tagihan/hutang platform sebesar{" "}
              <strong>{formatCurrency(initialData.wallet.debt)}</strong> (biaya layanan, pembatalan
              tiket, dll). Tagihan ini akan diselesaikan secara berkala sesuai ketentuan kontrak
              kerja sama.
            </p>
          </div>
        </div>
      )}

      {/* Financial Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Revenue */}
        <div className="group relative overflow-hidden rounded-2xl border border-teal-400/20 bg-linear-to-br from-teal-500 to-emerald-600 p-6 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform duration-300 group-hover:scale-110">
            <ArrowDownLeft size={80} />
          </div>
          <span className="text-xs font-bold tracking-widest text-teal-100 uppercase">
            Pendapatan Hari Ini
          </span>
          <h3 className="mt-2 text-2xl font-black tracking-tight">
            {formatCurrency(initialData.todayRevenue)}
          </h3>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-teal-100/90">
              {initialData.todayBookingCount} trip sukses hari ini
            </span>
            <span className="rounded bg-teal-400/30 px-2 py-0.5 text-[10px] font-bold">LIVE</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="group relative overflow-hidden rounded-2xl border border-indigo-400/20 bg-linear-to-br from-indigo-500 to-violet-600 p-6 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform duration-300 group-hover:scale-110">
            <FileText size={80} />
          </div>
          <span className="text-xs font-bold tracking-widest text-indigo-100 uppercase">
            Pendapatan Bulan Ini
          </span>
          <h3 className="mt-2 text-2xl font-black tracking-tight">
            {formatCurrency(initialData.monthRevenue)}
          </h3>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-indigo-100/90">
              Bulan ini ({new Date().toLocaleString("id-ID", { month: "long" })})
            </span>
            <span className="rounded bg-indigo-400/30 px-2 py-0.5 text-[10px] font-bold">
              {initialData.monthBookingCount} bookings
            </span>
          </div>
        </div>

        {/* Available Wallet Balance */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-400/20 bg-linear-to-br from-amber-500 to-orange-600 p-6 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform duration-300 group-hover:scale-110">
            <Wallet size={80} />
          </div>
          <span className="text-xs font-bold tracking-widest text-amber-100 uppercase">
            Saldo Dapat Ditarik
          </span>
          <h3 className="mt-2 text-2xl font-black tracking-tight">
            {formatCurrency(initialData.wallet.balance)}
          </h3>
          <div className="mt-4 flex items-center justify-between gap-2">
            {initialData.wallet.balance > 0 ? (
              <button
                onClick={() => setIsSheetOpen(true)}
                className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-orange-600 shadow-sm transition-all hover:bg-orange-50 active:scale-95"
              >
                Tarik Sekarang
              </button>
            ) : (
              <span className="text-xs text-amber-100/95">Saldo kosong</span>
            )}
            {initialData.wallet.pendingIn > 0 && (
              <span className="rounded bg-amber-700/30 px-2 py-0.5 text-[10px] text-amber-100">
                +{formatCurrency(initialData.wallet.pendingIn)} pending
              </span>
            )}
          </div>
        </div>

        {/* Total Lifetime Earnings */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-600/20 bg-linear-to-br from-slate-700 to-slate-900 p-6 text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform duration-300 group-hover:scale-110">
            <ArrowUpRight size={80} />
          </div>
          <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
            Total Akumulasi Hasil
          </span>
          <h3 className="mt-2 text-2xl font-black tracking-tight">
            {formatCurrency(initialData.wallet.totalEarned)}
          </h3>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-300/90">Akumulasi pendapatan bersih</span>
            <span className="rounded bg-slate-600/50 px-2 py-0.5 text-[10px] font-bold">TOTAL</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex max-w-2xl rounded-xl border-b border-slate-200 bg-slate-100/50 p-1">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "summary"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Riwayat Pendapatan
        </button>
        <button
          onClick={() => setActiveTab("withdrawals")}
          className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "withdrawals"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Penarikan Saldo ({initialData.withdrawals.length})
        </button>
        <button
          onClick={() => setActiveTab("cash_approvals")}
          className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "cash_approvals"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Persetujuan Tunai ({initialData.pendingCashBookings.length})
        </button>
        <button
          onClick={() => setActiveTab("refunds")}
          className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all sm:text-sm ${
            activeTab === "refunds"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Persetujuan Refund ({initialData.pendingRefunds.length})
        </button>
      </div>

      {/* TAB CONTENT: Summary & Booking Transactions */}
      {activeTab === "summary" && (
        <div className="animate-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border bg-white shadow-sm duration-300">
          {/* Filters Bar */}
          <div className="flex flex-col gap-4 border-b bg-slate-50/50 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Transaksi Sukses Terbaru</h3>
              <p className="mt-1 text-xs text-slate-500">
                Daftar booking berstatus sukses yang masuk ke pendapatan vendor.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode atau nama..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-9 text-xs text-slate-800 shadow-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none sm:w-64"
                />
              </div>

              {/* Method select filter */}
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none"
              >
                <option value="ALL">Semua Metode</option>
                <option value="CASH">Cash (Tunai)</option>
                <option value="EWALLET">E-Wallet</option>
                <option value="TRANSFER">Transfer Bank</option>
                <option value="BANK_TRANSFER">Bank Transfer PG</option>
                <option value="CREDIT_CARD">Kartu Kredit</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredBookings.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ArrowRightLeft size={20} />
              </div>
              <h4 className="font-bold text-slate-700">Tidak Ada Transaksi</h4>
              <p className="mx-auto mt-1 max-w-sm px-4 text-xs text-slate-500">
                {bookingSearch || paymentMethodFilter !== "ALL"
                  ? "Tidak ada transaksi yang cocok dengan kriteria pencarian Anda."
                  : "Belum ada transaksi pendapatan berstatus lunas yang terekam pada sistem."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
                    <th className="p-4">Kode Booking</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Detail Rute</th>
                    <th className="p-4">Metode Bayar</th>
                    <th className="p-4">Tanggal Lunas</th>
                    <th className="p-4 text-right">Nilai Kotor</th>
                    <th className="p-4 text-right text-teal-700">Porsi Vendor (Net)</th>
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
                        <div className="font-medium text-slate-800">
                          {b.trip.origin} → {b.trip.destination}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          {formatDate(b.trip.departureTime)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center rounded border bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {b.paymentMethod}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{formatDate(b.paidAt)}</td>
                      <td className="p-4 text-right text-slate-500">
                        {formatCurrency(b.totalAmount)}
                      </td>
                      <td className="p-4 text-right font-bold text-teal-600">
                        {formatCurrency(b.vendorAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Withdrawals History */}
      {activeTab === "withdrawals" && (
        <div className="animate-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border bg-white shadow-sm duration-300">
          {/* Filters Bar */}
          <div className="flex flex-col gap-4 border-b bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Riwayat Penarikan Saldo</h3>
              <p className="mt-1 text-xs text-slate-500">
                Daftar pencairan dana dari saldo wallet vendor ke rekening bank Anda.
              </p>
            </div>

            <div className="flex gap-3">
              <select
                value={withdrawStatusFilter}
                onChange={(e) => setWithdrawStatusFilter(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 shadow-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Menunggu</option>
                <option value="PROCESSING">Diproses</option>
                <option value="COMPLETED">Selesai</option>
                <option value="REJECTED">Ditolak</option>
              </select>

              <Button
                onClick={() => setIsSheetOpen(true)}
                size="sm"
                className="rounded-xl bg-teal-600 text-white shadow hover:bg-teal-700"
              >
                Tarik Saldo
              </Button>
            </div>
          </div>

          {/* Table */}
          {filteredWithdrawals.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Landmark size={20} />
              </div>
              <h4 className="font-bold text-slate-700">Belum Ada Penarikan</h4>
              <p className="mx-auto mt-1 max-w-sm px-4 text-xs text-slate-500">
                {withdrawStatusFilter !== "ALL"
                  ? "Tidak ada penarikan saldo dengan status tersebut."
                  : "Anda belum pernah melakukan penarikan saldo wallet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
                    <th className="p-4">Tanggal Pengajuan</th>
                    <th className="p-4">Rekening Tujuan</th>
                    <th className="p-4">Catatan / Referensi</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Biaya Admin</th>
                    <th className="p-4 text-right font-bold text-slate-900">Total Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="transition-colors hover:bg-slate-50/50">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">
                          {formatDate(w.requestedAt)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{w.bankName}</div>
                        <div className="mt-0.5 text-slate-500">
                          {w.bankAccountNo} a.n {w.bankAccountName}
                        </div>
                      </td>
                      <td className="max-w-xs p-4">
                        {w.reference ? (
                          <div className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
                            REF: {w.reference}
                          </div>
                        ) : null}
                        <p className="mt-1 truncate text-slate-500" title={w.notes || ""}>
                          {w.notes || "-"}
                        </p>
                        {w.rejectedReason && (
                          <p className="mt-1 text-[10px] font-medium text-red-600">
                            Alasan Penolakan: {w.rejectedReason}
                          </p>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(w.status)}</td>
                      <td className="p-4 text-right text-slate-400">
                        {formatCurrency(w.adminFee)}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">
                        {formatCurrency(w.netAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Cash Approvals */}
      {activeTab === "cash_approvals" && (
        <div className="animate-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border bg-white shadow-sm duration-300">
          {/* Header */}
          <div className="border-b bg-slate-50/50 p-5">
            <h3 className="font-bold text-slate-800">Menunggu Persetujuan Tunai</h3>
            <p className="mt-1 text-xs text-slate-500">
              Daftar pemesanan tiket dengan metode bayar Tunai (CASH) yang belum dilunasi. Harap
              terima uang fisiknya terlebih dahulu di counter atau dari driver sebelum menyetujui.
            </p>
          </div>

          {/* Table */}
          {initialData.pendingCashBookings.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="font-bold text-slate-700">Semua Tunai Lunas!</h4>
              <p className="mx-auto mt-1 max-w-sm px-4 text-xs text-slate-500">
                Tidak ada antrean persetujuan pembayaran tunai yang tertunda saat ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
                    <th className="p-4">Kode Booking</th>
                    <th className="p-4">Nama Penumpang</th>
                    <th className="p-4">Detail Rute & Trip</th>
                    <th className="p-4">Tanggal Pesan</th>
                    <th className="p-4 text-right">Nilai Tagihan</th>
                    <th className="p-4 text-center">Aksi Operasional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {initialData.pendingCashBookings.map((b) => {
                    const isApproving = approvingBookingId === b.id;

                    return (
                      <tr key={b.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="p-4 font-mono font-bold text-slate-900">{b.bookingCode}</td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-800">{b.customerName}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-800">
                            {b.trip.origin} → {b.trip.destination}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400">
                            {formatDate(b.trip.departureTime)}
                          </div>
                        </td>
                        <td className="p-4 text-slate-500">{formatDate(b.createdAt)}</td>
                        <td className="text-slate-850 p-4 text-right font-black">
                          {formatCurrency(b.totalAmount)}
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            disabled={isApproving || isPending}
                            onClick={() => handleApproveCash(b.id, b.bookingCode, b.totalAmount)}
                            className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-95"
                          >
                            {isApproving ? (
                              <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                Memproses
                              </>
                            ) : (
                              "Setujui Kas"
                            )}
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

      {/* TAB CONTENT: Refund Approvals */}
      {activeTab === "refunds" && (
        <div className="animate-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border bg-white shadow-sm duration-300">
          <div className="border-b bg-slate-50/50 p-5">
            <h3 className="font-bold text-slate-800">Menunggu Persetujuan Refund</h3>
            <p className="mt-1 text-xs text-slate-500">
              Daftar pengajuan pengembalian dana (refund) dari kustomer yang membatalkan tiket.
              Persetujuan akan memotong saldo dari wallet vendor secara real-time.
            </p>
          </div>

          {initialData.pendingRefunds.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <h4 className="font-bold text-slate-700">Semua Refund Selesai!</h4>
              <p className="mx-auto mt-1 max-w-sm px-4 text-xs text-slate-500">
                Tidak ada antrean pengajuan refund kustomer yang tertunda saat ini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
                    <th className="p-4">Kode Refund / Tiket</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Metode & Rincian Tujuan</th>
                    <th className="p-4">Alasan Pembatalan</th>
                    <th className="p-4">Tanggal Pengajuan</th>
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
                          <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                            Tiket: {r.bookingCode}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-800">{r.customerName}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-bold ${
                              r.refundMethod === "CASH_PICKUP"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {r.refundMethod === "CASH_PICKUP" ? "TUNAI (CASH)" : "TRANSFER BANK"}
                          </span>
                          {r.refundMethod === "BANK_TRANSFER" && (
                            <div className="mt-1 text-slate-500">
                              {r.customerBankName} - {r.customerBankAccount} <br />
                              a.n {r.customerBankAccountName}
                            </div>
                          )}
                        </td>
                        <td className="max-w-xs p-4 text-slate-500 italic">
                          &quot;{r.reason || "Tidak ada alasan spesifik."}&quot;
                        </td>
                        <td className="p-4 text-slate-400">{formatDate(r.requestedAt)}</td>
                        <td className="p-4 text-right font-black text-rose-600">
                          {formatCurrency(r.finalAmount)}
                          <div className="text-[10px] font-normal text-slate-400">
                            (Porsi: {formatCurrency(r.refundAmount)}, Admin: -10K)
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <Button
                              disabled={isApproving || isPending}
                              onClick={() => handleApproveRefund(r.id, r.refundCode, r.finalAmount)}
                              className={`h-9 rounded-xl px-4 text-xs font-bold text-white shadow-md transition-all active:scale-95 ${
                                isInsufficient
                                  ? "hover:bg-slate-450 cursor-not-allowed bg-slate-400"
                                  : "bg-teal-600 hover:bg-teal-700"
                              }`}
                            >
                              {isApproving ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  Memproses
                                </>
                              ) : (
                                "Setujui Refund"
                              )}
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
      )}

      {/* WITHDRAWAL FORM DRAWER (SLIDE-OVER PANEL) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-l bg-slate-50/50 p-0 shadow-2xl sm:max-w-md"
        >
          <div className="flex h-full flex-col bg-slate-50/50">
            <SheetHeader className="border-b bg-white p-6 pb-4">
              <SheetTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Wallet className="h-5 w-5 text-teal-600" />
                Tarik Saldo Wallet
              </SheetTitle>
              <SheetDescription className="mt-1 text-xs text-slate-500">
                Cairkan saldo wallet FluxFleet langsung ke rekening bank vendor Anda secara instan.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-5">
                {/* Info Wallet Card */}
                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 p-4 text-slate-800 shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold tracking-wide text-orange-700 uppercase">
                      Saldo Tersedia
                    </p>
                    <p className="mt-1 text-xl font-black text-slate-900">
                      {formatCurrency(initialData.wallet.balance)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={handleMaxWithdraw}
                    className="rounded-lg border-amber-300 bg-white font-bold text-orange-700 shadow-sm hover:bg-orange-50"
                  >
                    Tarik Semua
                  </Button>
                </div>

                {/* Amount Field */}
                <div className="flex flex-col gap-2">
                  <label className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>
                      Jumlah Penarikan (IDR) <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-xs font-bold text-slate-400">Rp</span>
                    </div>
                    <input
                      type="text"
                      value={withdrawAmount}
                      onChange={(e) => {
                        const numericVal = e.target.value.replace(/[^0-9]/g, "");
                        setWithdrawAmount(numericVal);
                      }}
                      className="flex h-12 w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-9 text-sm font-bold text-slate-800 shadow-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none"
                      placeholder="Masukkan nominal, cth: 500000"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Minimal penarikan sebesar Rp 10.000
                  </span>
                </div>

                {/* Destination Bank */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Bank Tujuan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Bank --</option>
                    {IndonesianBanks.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Number */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Nomor Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNo}
                    onChange={(e) => {
                      const numericVal = e.target.value.replace(/[^0-9]/g, "");
                      setAccountNo(numericVal);
                    }}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 font-mono text-sm font-semibold text-slate-800 shadow-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none"
                    placeholder="Masukkan nomor rekening bank"
                    required
                  />
                </div>

                {/* Account Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Nama Pemilik Rekening <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 uppercase shadow-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none"
                    placeholder="Sesuai nama di buku tabungan"
                    required
                  />
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Catatan <span className="ml-1 font-normal text-slate-400">(Opsional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 focus:outline-none"
                    placeholder="Cth: Penarikan dana darurat"
                  />
                </div>

                {/* Breakdown Summary */}
                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-100 p-4 text-xs font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal Penarikan</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(Number(withdrawAmount) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Transaksi (Admin)</span>
                    <span className="font-bold text-emerald-600">GRATIS</span>
                  </div>
                  <hr className="my-1 border-slate-200" />
                  <div className="flex justify-between text-sm font-bold text-slate-800">
                    <span>Total Bersih Diterima</span>
                    <span className="text-base font-black text-teal-600">
                      {formatCurrency(Number(withdrawAmount) || 0)}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="mt-4 flex gap-3 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1 rounded-xl text-slate-700"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isPending}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 font-bold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      "Konfirmasi"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
