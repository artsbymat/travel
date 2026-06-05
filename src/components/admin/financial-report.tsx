/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  ArrowRight,
  ChevronRight,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

interface FinancialData {
  summary: {
    platformRevenue: number;
    totalVendorBalance: number;
    totalVendorDebt: number;
    totalPendingIn: number;
    vendorCount: number;
  };
  vendors: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    balance: number;
    debt: number;
    pendingIn: number;
    totalEarned: number;
    lastUpdate: string;
  }>;
}

async function fetchFinancialReport(): Promise<FinancialData> {
  const res = await fetch("/api/admin/reports/finance");
  if (!res.ok) throw new Error("Gagal mengambil data laporan keuangan");
  return res.json();
}

export function FinancialReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "reports", "finance"],
    queryFn: fetchFinancialReport
  });

  const filteredVendors = useMemo(() => {
    if (!data?.vendors) return [];
    return data.vendors.filter((v) => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [data?.vendors, searchTerm]);

  const vendorsWithDebt = useMemo(() => {
    return filteredVendors.filter((v) => v.debt > 0);
  }, [filteredVendors]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const { summary } = data!;

  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      {/* ═══════════════════════════════════════
          SUMMARY STATS
          ═══════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pendapatan Platform"
          value={summary.platformRevenue}
          icon={<TrendingUp className="size-5" />}
          description="Total profit dari fee komisi sistem"
          colorClass="from-emerald-500/10 to-teal-500/5 text-emerald-600 border-emerald-500/20"
          badgeColor="bg-emerald-500/10 text-emerald-700"
          glowClass="shadow-emerald-500/5"
        />
        <StatCard
          title="Piutang Platform"
          value={summary.totalVendorDebt}
          icon={<AlertCircle className="size-5" />}
          description="Tagihan cash vendor wajib setor"
          colorClass="from-rose-500/10 to-orange-500/5 text-rose-600 border-rose-500/20"
          badgeColor="bg-rose-500/10 text-rose-700"
          glowClass="shadow-rose-500/5"
        />
        <StatCard
          title="Hutang Platform"
          value={summary.totalVendorBalance}
          icon={<Wallet className="size-5" />}
          description="Saldo aktif vendor siap ditarik"
          colorClass="from-amber-500/10 to-yellow-500/5 text-amber-600 border-amber-500/20"
          badgeColor="bg-amber-500/10 text-amber-700"
          glowClass="shadow-amber-500/5"
        />
        <StatCard
          title="Pending Settlement"
          value={summary.totalPendingIn}
          icon={<RefreshCw className="size-5" />}
          description="Dana online menunggu verifikasi PG"
          colorClass="from-blue-500/10 to-indigo-500/5 text-blue-600 border-blue-500/20"
          badgeColor="bg-blue-500/10 text-blue-700"
          glowClass="shadow-blue-500/5"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ═══════════════════════════════════════
            VENDORS WITH DEBT (PIUTANG)
            ═══════════════════════════════════════ */}
        <div className="space-y-6 lg:col-span-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                <TrendingDown className="size-4" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Vendor Berhutang
              </h3>
            </div>
            <span className="rounded-full bg-rose-50 border border-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
              {vendorsWithDebt.length} Vendor
            </span>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {vendorsWithDebt.length === 0 ? (
              <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-[1.5rem] p-10 text-center">
                <ShieldCheck className="mx-auto mb-2.5 size-8 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-700">Semua Vendor Lunas</p>
                <p className="text-xs text-slate-400 mt-1">Tidak ada tagihan tertunggak saat ini.</p>
              </div>
            ) : (
              vendorsWithDebt.map((vendor) => (
                <div
                  key={vendor.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:border-rose-200 hover:shadow-md"
                >
                  <div className="absolute top-0 left-0 h-full w-1 bg-rose-500" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600 transition-colors group-hover:bg-rose-50 group-hover:text-rose-500">
                        <Building2 className="size-4" />
                      </div>
                      <div>
                        <span className="line-clamp-1 text-sm font-bold text-slate-800 transition-colors group-hover:text-rose-600">{vendor.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{vendor.slug}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-600">
                        {formatCurrency(vendor.debt)}
                      </span>
                      <div className="text-[9px] text-slate-400 font-bold flex items-center justify-end gap-1 mt-0.5">
                        <Clock size={10} />
                        {new Date(vendor.lastUpdate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            FULL VENDOR LEDGER
            ═══════════════════════════════════════ */}
        <div className="space-y-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <FileSpreadsheet className="size-4" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Buku Besar Vendor
              </h3>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="text-slate-400 absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Cari vendor..."
                  className="border-slate-200 h-9.5 rounded-xl pl-9 text-xs focus:border-teal-500 focus:ring-teal-500/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="h-9.5 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 shrink-0"
              >
                <RefreshCw className={cn("size-3.5 mr-1.5", isFetching && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="border border-slate-100 bg-white overflow-hidden rounded-3xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[10px] font-extrabold tracking-wider uppercase">
                    <th className="px-6 py-4">Informasi Vendor</th>
                    <th className="px-6 py-4 text-right">Saldo Wallet</th>
                    <th className="px-6 py-4 text-right">Hutang (Piutang Kita)</th>
                    <th className="px-6 py-4 text-right">Pending In</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                            <Building2 className="size-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 transition-colors group-hover:text-teal-600">{vendor.name}</div>
                            <div className="text-slate-400 text-[10px] font-medium mt-0.5">{vendor.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-semibold text-slate-700">
                          {formatCurrency(vendor.balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {vendor.debt > 0 ? (
                          <span className="text-sm font-extrabold text-rose-600 bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded-lg">
                            {formatCurrency(vendor.debt)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {vendor.pendingIn > 0 ? (
                          <span className="text-sm font-semibold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-lg">
                            {formatCurrency(vendor.pendingIn)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border",
                            vendor.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-slate-50 text-slate-400 border-slate-100"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", vendor.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                          {vendor.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredVendors.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-slate-400 px-6 py-14 text-center text-sm italic bg-slate-50/20"
                      >
                        Tidak ada data vendor ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, colorClass, badgeColor, glowClass }: any) {
  return (
    <div className={cn(
      "group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
      glowClass
    )}>
      {/* Decorative subtle background gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.4] transition-opacity group-hover:opacity-[0.7]", colorClass)} />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Finance</span>
          <div className={cn("flex size-9 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110", colorClass)}>
            {icon}
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-slate-500 text-xs font-medium">{title}</p>
          <h4 className="text-2xl font-extrabold tracking-tight text-slate-800">{formatCurrency(value)}</h4>
        </div>

        <p className="text-slate-400 text-[10px] font-semibold flex items-center gap-1 border-t pt-3.5 mt-2">
          {description}
          <ArrowRight className="size-3 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 text-slate-500 ml-auto" />
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-12">
        <Skeleton className="h-[450px] rounded-3xl lg:col-span-4" />
        <Skeleton className="h-[450px] rounded-3xl lg:col-span-8" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border border-dashed border-red-200 bg-red-50/30 rounded-[2rem] p-16 text-center">
      <AlertCircle className="text-red-500 mx-auto mb-4 size-12" />
      <h3 className="text-red-800 mb-2 text-base font-bold">Gagal Memuat Laporan Keuangan</h3>
      <p className="text-slate-500 mb-6 text-sm max-w-md mx-auto">
        Koneksi internet bermasalah atau server gagal memproses data keuangan. Silakan coba beberapa saat lagi.
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
