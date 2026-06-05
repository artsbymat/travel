"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Users, 
  Building2, 
  Bus, 
  Calendar, 
  Ticket, 
  TrendingUp, 
  AlertCircle, 
  Wallet, 
  RefreshCw, 
  Clock, 
  ArrowRight,
  CheckCircle2, 
  XCircle, 
  Check, 
  X,
  CreditCard,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface DashboardStats {
  success: boolean;
  stats: {
    users: number;
    vendors: number;
    vehicles: number;
    trips: number;
    bookings: number;
  };
  finance: {
    platformRevenue: number;
    totalVendorDebt: number;
    totalVendorBalance: number;
    totalPendingIn: number;
  };
  recentBookings: Array<{
    id: string;
    bookingCode: string;
    customerName: string;
    totalAmount: string;
    status: string;
    createdAt: string;
    trip: {
      origin: string;
      destination: string;
      departureTime: string;
      vehicle: {
        vendor: {
          name: string;
        };
      };
    };
  }>;
  recentTripActivities: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
    trip: {
      origin: string;
      destination: string;
      departureTime: string;
      vehicle: {
        vendor: {
          name: string;
        };
      };
    };
  }>;
  pendingWithdrawals: Array<{
    id: string;
    amount: string;
    bankName: string;
    bankAccountNo: string;
    bankAccountName: string;
    status: string;
    requestedAt: string;
    wallet: {
      vendor: {
        name: string;
        slug: string;
      };
    };
  }>;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Gagal mengambil data statistik dashboard");
  return res.json();
}

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: fetchDashboardStats
  });

  // Dialog states for withdrawal processing
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any | null>(null);
  const [processAction, setProcessAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const processWithdrawalMutation = useMutation({
    mutationFn: async ({ id, status, rejectedReason }: { id: string; status: "COMPLETED" | "REJECTED"; rejectedReason?: string }) => {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectedReason })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Gagal memproses penarikan");
      }
      return res.json();
    },
    onSuccess: (res) => {
      toast.success(res.message);
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      closeDialog();
    },
    onError: (err: any) => {
      toast.error(err.message || "Terjadi kesalahan sistem");
    }
  });

  const closeDialog = () => {
    setSelectedWithdrawal(null);
    setProcessAction(null);
    setRejectReason("");
  };

  const handleApproveConfirm = async () => {
    if (!selectedWithdrawal) return;
    await processWithdrawalMutation.mutateAsync({
      id: selectedWithdrawal.id,
      status: "COMPLETED"
    });
  };

  const handleRejectConfirm = async () => {
    if (!selectedWithdrawal) return;
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi");
      return;
    }
    await processWithdrawalMutation.mutateAsync({
      id: selectedWithdrawal.id,
      status: "REJECTED",
      rejectedReason: rejectReason
    });
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const { stats, finance, recentBookings, recentTripActivities, pendingWithdrawals } = data!;

  return (
    <div className="animate-in fade-in space-y-8 duration-500 pb-10">
      {/* ═══════════════════════════════════════
          PAGE HEADER
          ═══════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Super Admin Dashboard</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">
            Pantau performa FluxFleet, kelola permintaan penarikan, dan awasi aktivitas travel hari ini.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs h-9.5"
        >
          <RefreshCw className={cn("size-3.5 mr-1.5", isFetching && "animate-spin")} />
          Refresh Data
        </Button>
      </div>

      {/* ═══════════════════════════════════════
          CORE SYSTEM COUNTS
          ═══════════════════════════════════════ */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <CountCard
          title="Total Pengguna"
          value={stats.users}
          icon={<Users className="size-4 text-sky-600" />}
          gradient="from-sky-500/10 to-blue-500/5 border-sky-500/20"
        />
        <CountCard
          title="Vendor Travel"
          value={stats.vendors}
          icon={<Building2 className="size-4 text-emerald-600" />}
          gradient="from-emerald-500/10 to-teal-500/5 border-emerald-500/20"
        />
        <CountCard
          title="Armada Aktif"
          value={stats.vehicles}
          icon={<Bus className="size-4 text-amber-600" />}
          gradient="from-amber-500/10 to-orange-500/5 border-amber-500/20"
        />
        <CountCard
          title="Perjalanan (Trips)"
          value={stats.trips}
          icon={<Calendar className="size-4 text-indigo-600" />}
          gradient="from-indigo-500/10 to-purple-500/5 border-indigo-500/20"
        />
        <CountCard
          title="Tiket Terjual"
          value={stats.bookings}
          icon={<Ticket className="size-4 text-rose-600" />}
          gradient="from-rose-500/10 to-red-500/5 border-rose-500/20"
        />
      </div>

      {/* ═══════════════════════════════════════
          FINANCIAL PERFORMANCE OVERVIEW
          ═══════════════════════════════════════ */}
      <div className="grid gap-5 md:grid-cols-4">
        <FinanceCard
          title="Keuntungan Platform"
          value={finance.platformRevenue}
          icon={<TrendingUp className="size-4.5" />}
          description="Dari fee transaksi komisi"
          bgClass="from-emerald-500/10 to-teal-500/5 text-emerald-600 border-emerald-500/20"
        />
        <FinanceCard
          title="Dana Piutang (Vendor Debt)"
          value={finance.totalVendorDebt}
          icon={<TrendingDown className="size-4.5" />}
          description="Tagihan cash belum disetor"
          bgClass="from-rose-500/10 to-orange-500/5 text-rose-600 border-rose-500/20"
        />
        <FinanceCard
          title="Dana Hutang (Vendor Balance)"
          value={finance.totalVendorBalance}
          icon={<Wallet className="size-4.5" />}
          description="Saldo aktif vendor siap tarik"
          bgClass="from-amber-500/10 to-yellow-500/5 text-amber-600 border-amber-500/20"
        />
        <FinanceCard
          title="Pending Settlement"
          value={finance.totalPendingIn}
          icon={<RefreshCw className="size-4.5" />}
          description="Menunggu settlement Payment Gateway"
          bgClass="from-blue-500/10 to-indigo-500/5 text-blue-600 border-blue-500/20"
        />
      </div>

      {/* ═══════════════════════════════════════
          RECENT LOGS & ACTIONS
          ═══════════════════════════════════════ */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: BOOKINGS & ACTIVITIES */}
        <div className="space-y-8 lg:col-span-8">
          {/* Recent Bookings */}
          <div className="border border-slate-100 bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b pb-3 mb-4">
              <Ticket className="size-4.5 text-teal-600" />
              Transaksi Tiket Terbaru
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Kode Booking</th>
                    <th className="px-4 py-3">Rincian Customer</th>
                    <th className="px-4 py-3">Perjalanan</th>
                    <th className="px-4 py-3 text-right">Nominal</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-extrabold text-slate-800">{b.bookingCode}</span>
                        <div className="text-[9px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          {new Date(b.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-700">{b.customerName}</span>
                        <div className="text-[9px] text-slate-400 font-semibold">{b.trip.vehicle.vendor.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-700">{b.trip.origin} → {b.trip.destination}</div>
                        <div className="text-[9px] text-slate-400 font-semibold">
                          {new Date(b.trip.departureTime).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} • {b.trip.departureTime.split("T")[1]?.slice(0, 5) || ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-800">
                        {formatCurrency(Number(b.totalAmount))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[9px] font-extrabold border uppercase tracking-wide",
                          b.status === "CONFIRMED" || b.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : b.status === "PENDING"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        )}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400 py-8 italic">
                        Belum ada riwayat pemesanan tiket.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Log */}
          <div className="border border-slate-100 bg-white rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b pb-3 mb-4">
              <Clock className="size-4.5 text-teal-600" />
              Log Aktivitas Armada Terakhir
            </h3>

            <div className="relative border-l border-slate-100 pl-4.5 ml-2 space-y-5.5">
              {recentTripActivities.map((act) => (
                <div key={act.id} className="relative group">
                  <div className="absolute -left-6.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-teal-500 shadow-sm transition-transform duration-300 group-hover:scale-125" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-slate-700">{act.action}</span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(act.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      {act.description}
                    </p>
                    <div className="text-[10px] text-slate-400 font-bold bg-slate-50 rounded-lg px-2 py-1 flex items-center justify-between mt-1 border border-slate-100/50">
                      <span>{act.trip.vehicle.vendor.name}</span>
                      <span>{act.trip.origin} → {act.trip.destination}</span>
                    </div>
                  </div>
                </div>
              ))}
              {recentTripActivities.length === 0 && (
                <div className="text-center text-slate-400 py-6 italic text-xs">
                  Belum ada aktivitas perjalanan tercatat.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PENDING WITHDRAWALS */}
        <div className="space-y-6 lg:col-span-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <CreditCard className="size-4" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800">
                Pencairan Vendor
              </h3>
            </div>
            <span className="rounded-full bg-teal-50 border border-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-700">
              {pendingWithdrawals.length} Pending
            </span>
          </div>

          <div className="space-y-4">
            {pendingWithdrawals.length === 0 ? (
              <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-[1.5rem] p-10 text-center">
                <CheckCircle2 className="mx-auto mb-2.5 size-8 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-700">Tidak Ada Pengajuan</p>
                <p className="text-xs text-slate-400 mt-1">Seluruh permintaan penarikan dana vendor telah diselesaikan.</p>
              </div>
            ) : (
              pendingWithdrawals.map((withdraw) => (
                <div
                  key={withdraw.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <div className="absolute top-0 left-0 h-full w-1.5 bg-teal-600" />
                  
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-sm font-extrabold text-slate-800">{withdraw.wallet.vendor.name}</span>
                        <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                          Diajukan pada: {new Date(withdraw.requestedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-teal-600">
                        {formatCurrency(Number(withdraw.amount))}
                      </span>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-2.5 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Bank:</span>
                        <span className="text-slate-700 font-bold">{withdraw.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">No. Rekening:</span>
                        <span className="text-slate-700 font-bold">{withdraw.bankAccountNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Nama Pemilik:</span>
                        <span className="text-slate-700 font-bold">{withdraw.bankAccountName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setSelectedWithdrawal(withdraw);
                          setProcessAction("APPROVE");
                        }}
                        className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-xs h-8 text-white flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> Setujui
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedWithdrawal(withdraw);
                          setProcessAction("REJECT");
                        }}
                        className="flex-1 rounded-xl font-bold text-xs h-8 flex items-center justify-center gap-1"
                      >
                        <X size={14} /> Tolak
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          DIALOG DIAL-UPS FOR APPROVE & REJECT
          ═══════════════════════════════════════ */}
      {/* APPROVE DIALOG */}
      <AlertDialog
        open={Boolean(selectedWithdrawal && processAction === "APPROVE")}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-emerald-50 text-emerald-600 rounded-2xl p-2.5 w-fit mx-auto mb-2">
              <Check className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-center font-extrabold text-slate-800">Setujui Pencairan?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-xs">
              Apakah Anda yakin dana sebesar <strong className="text-teal-600">{selectedWithdrawal && formatCurrency(Number(selectedWithdrawal.amount))}</strong> telah ditransfer ke rekening vendor <strong>{selectedWithdrawal?.wallet.vendor.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel disabled={processWithdrawalMutation.isPending} className="rounded-xl border-slate-200 text-slate-500 font-bold text-xs h-9.5">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleApproveConfirm();
              }}
              disabled={processWithdrawalMutation.isPending}
              className="rounded-xl font-bold text-xs h-9.5 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Setujui & Tandai Selesai
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* REJECT DIALOG */}
      <AlertDialog
        open={Boolean(selectedWithdrawal && processAction === "REJECT")}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-50 text-red-500 rounded-2xl p-2.5 w-fit mx-auto mb-2">
              <X className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-center font-extrabold text-slate-800">Tolak Pencairan Dana?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-xs mb-3">
              Ketik alasan penolakan penarikan saldo untuk vendor <strong>{selectedWithdrawal?.wallet.vendor.name}</strong>. Saldo akan otomatis dikembalikan ke Wallet mereka.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="px-1 py-2">
            <Input
              placeholder="Alasan penolakan (misal: Rekening tidak terdaftar)"
              className="border-slate-200 rounded-xl h-9.5 text-xs focus:ring-red-500/20 focus:border-red-500"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel disabled={processWithdrawalMutation.isPending} className="rounded-xl border-slate-200 text-slate-500 font-bold text-xs h-9.5">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleRejectConfirm();
              }}
              disabled={processWithdrawalMutation.isPending || !rejectReason.trim()}
              className="rounded-xl font-bold text-xs h-9.5 bg-red-600 hover:bg-red-700 text-white"
            >
              Tolak & Kembalikan Saldo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CountCard({ title, value, icon, gradient }: { title: string; value: number; icon: React.ReactNode; gradient: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4.5 shadow-sm transition-all duration-300 hover:shadow-md", gradient)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{title}</span>
        <div className="flex size-7.5 items-center justify-center rounded-lg bg-white border border-slate-100 shadow-sm">
          {icon}
        </div>
      </div>
      <div className="mt-3.5">
        <h4 className="text-xl font-extrabold text-slate-800">{value.toLocaleString("id-ID")}</h4>
      </div>
    </div>
  );
}

function FinanceCard({ title, value, icon, description, bgClass }: { title: string; value: number; icon: React.ReactNode; description: string; bgClass: string }) {
  return (
    <div className={cn("group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5", bgClass)}>
      <div className="absolute inset-0 bg-gradient-to-br opacity-[0.25] transition-opacity group-hover:opacity-[0.4]" />
      
      <div className="relative space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Keuangan</span>
          <div className="flex size-8 items-center justify-center rounded-lg border bg-white shadow-xs">
            {icon}
          </div>
        </div>
        
        <div>
          <p className="text-slate-500 text-xs font-semibold">{title}</p>
          <h4 className="text-lg font-extrabold tracking-tight text-slate-800 mt-1">{formatCurrency(value)}</h4>
        </div>

        <p className="text-slate-400 text-[9px] font-semibold border-t border-slate-100/50 pt-2 flex items-center justify-between">
          {description}
          <ChevronRight size={10} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-8 pb-10">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-52 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-9.5 w-32 rounded-xl" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-[300px] rounded-3xl" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-[450px] rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-dashed border-red-200 bg-red-50/30 rounded-[2rem] p-16 text-center">
      <AlertCircle className="text-red-500 mx-auto mb-4 size-12" />
      <h3 className="text-red-800 mb-2 text-base font-bold">Gagal Memuat Statistik Dashboard</h3>
      <p className="text-slate-500 mb-6 text-sm max-w-md mx-auto">
        Koneksi internet bermasalah atau server gagal mengolah data dashboard sistem. Silakan coba kembali.
      </p>
      <Button
        variant="outline"
        onClick={onRetry}
        className="border-red-200 bg-white hover:bg-red-50 font-bold text-red-700 rounded-xl"
      >
        Coba Lagi
      </Button>
    </div>
  );
}
