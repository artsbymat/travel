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
  ArrowRight
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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
          icon={<TrendingUp className="size-5 text-emerald-500" />}
          description="Total keuntungan dari biaya platform"
          variant="emerald"
        />
        <StatCard
          title="Piutang Platform"
          value={summary.totalVendorDebt}
          icon={<AlertCircle className="size-5 text-rose-500" />}
          description="Uang vendor yang harus disetor ke kita"
          variant="rose"
        />
        <StatCard
          title="Hutang Platform"
          value={summary.totalVendorBalance}
          icon={<Wallet className="size-5 text-amber-500" />}
          description="Saldo vendor yang siap ditarik"
          variant="amber"
        />
        <StatCard
          title="Pending Masuk"
          value={summary.totalPendingIn}
          icon={<RefreshCw className="size-5 text-blue-500" />}
          description="Transaksi yang menunggu settlement"
          variant="blue"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ═══════════════════════════════════════
            VENDORS WITH DEBT (PIUTANG)
            ═══════════════════════════════════════ */}
        <div className="space-y-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <TrendingDown className="size-5 text-rose-500" />
              Vendor Berhutang
            </h3>
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
              {vendorsWithDebt.length} Vendor
            </span>
          </div>

          <div className="space-y-3">
            {vendorsWithDebt.length === 0 ? (
              <div className="border-border bg-muted/20 rounded-3xl border border-dashed p-8 text-center">
                <p className="text-muted-foreground text-sm italic">Semua vendor lunas.</p>
              </div>
            ) : (
              vendorsWithDebt.map((vendor) => (
                <div
                  key={vendor.id}
                  className="group border-border/70 bg-card relative overflow-hidden rounded-[1.5rem] border p-4 transition-all hover:border-rose-200 hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <Building2 className="size-4" />
                      </div>
                      <span className="line-clamp-1 text-sm font-semibold">{vendor.name}</span>
                    </div>
                    <span className="text-sm font-bold text-rose-600">
                      {formatCurrency(vendor.debt)}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center justify-between text-[10px] font-bold tracking-wider uppercase">
                    <span>Terakhir Update</span>
                    <span>{new Date(vendor.lastUpdate).toLocaleDateString("id-ID")}</span>
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <RefreshCw className={cn("text-primary size-5", isFetching && "animate-spin")} />
              Buku Besar Vendor
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Cari vendor..."
                className="border-border/70 h-9 rounded-2xl pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="border-border/70 bg-card overflow-hidden rounded-[2rem] border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-muted/30 text-muted-foreground text-[11px] font-bold tracking-widest uppercase">
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4 text-right">Saldo Wallet</th>
                    <th className="px-6 py-4 text-right">Hutang ke Kita</th>
                    <th className="px-6 py-4 text-right">Pending</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-border/50 divide-y">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold">{vendor.name}</div>
                        <div className="text-muted-foreground text-[10px]">{vendor.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        {formatCurrency(vendor.balance)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">
                        {vendor.debt > 0 ? formatCurrency(vendor.debt) : "-"}
                      </td>
                      <td className="text-muted-foreground px-6 py-4 text-right text-sm italic">
                        {vendor.pendingIn > 0 ? formatCurrency(vendor.pendingIn) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            vendor.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {vendor.isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredVendors.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-muted-foreground px-6 py-10 text-center italic"
                      >
                        Tidak ada data ditemukan.
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

function StatCard({ title, value, icon, description, variant }: any) {
  const variants: any = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100"
  };

  return (
    <div className="group border-border/70 bg-card relative overflow-hidden rounded-[2rem] border p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
            variants[variant]
          )}
        >
          {icon}
        </div>
        <div className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
          Finance
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm font-medium">{title}</p>
        <h4 className="text-2xl font-bold tracking-tight">{formatCurrency(value)}</h4>
      </div>
      <p className="text-muted-foreground mt-4 flex items-center gap-1 text-[10px] font-medium">
        {description}
        <ArrowRight className="size-2 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[2rem]" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-12">
        <Skeleton className="h-[400px] rounded-[2rem] lg:col-span-4" />
        <Skeleton className="h-[400px] rounded-[2rem] lg:col-span-8" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="border-destructive/20 bg-destructive/5 rounded-[2.5rem] border p-12 text-center">
      <AlertCircle className="text-destructive mx-auto mb-4 size-12" />
      <h3 className="text-destructive mb-2 text-lg font-bold">Terjadi Kesalahan</h3>
      <p className="text-muted-foreground mb-6 text-sm">
        Gagal memuat data finansial. Silakan coba lagi.
      </p>
      <Button
        variant="outline"
        onClick={onRetry}
        className="border-destructive/20 hover:bg-destructive/10 rounded-2xl"
      >
        Coba Lagi
      </Button>
    </div>
  );
}
