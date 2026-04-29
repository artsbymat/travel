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
    queryFn: fetchFinancialReport,
  });

  const filteredVendors = useMemo(() => {
    if (!data?.vendors) return [];
    return data.vendors.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data?.vendors, searchTerm]);

  const vendorsWithDebt = useMemo(() => {
    return filteredVendors.filter(v => v.debt > 0);
  }, [filteredVendors]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const { summary } = data!;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingDown className="size-5 text-rose-500" />
              Vendor Berhutang
            </h3>
            <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {vendorsWithDebt.length} Vendor
            </span>
          </div>

          <div className="space-y-3">
            {vendorsWithDebt.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-8 text-center bg-muted/20">
                <p className="text-sm text-muted-foreground italic">Semua vendor lunas.</p>
              </div>
            ) : (
              vendorsWithDebt.map(vendor => (
                <div 
                  key={vendor.id} 
                  className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card p-4 transition-all hover:border-rose-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                        <Building2 className="size-4" />
                      </div>
                      <span className="font-semibold text-sm line-clamp-1">{vendor.name}</span>
                    </div>
                    <span className="text-sm font-bold text-rose-600">{formatCurrency(vendor.debt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    <span>Terakhir Update</span>
                    <span>{new Date(vendor.lastUpdate).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════
            FULL VENDOR LEDGER
            ═══════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <RefreshCw className={cn("size-5 text-primary", isFetching && "animate-spin")} />
              Buku Besar Vendor
            </h3>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Cari vendor..." 
                className="pl-9 rounded-2xl h-9 border-border/70"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4 text-right">Saldo Wallet</th>
                    <th className="px-6 py-4 text-right">Hutang ke Kita</th>
                    <th className="px-6 py-4 text-right">Pending</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredVendors.map(vendor => (
                    <tr key={vendor.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{vendor.name}</div>
                        <div className="text-[10px] text-muted-foreground">{vendor.slug}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-sm">
                        {formatCurrency(vendor.balance)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-sm text-rose-600">
                        {vendor.debt > 0 ? formatCurrency(vendor.debt) : "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-muted-foreground italic">
                        {vendor.pendingIn > 0 ? formatCurrency(vendor.pendingIn) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          vendor.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                        )}>
                          {vendor.isActive ? "AKTIF" : "NONAKTIF"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredVendors.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground italic">
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
    blue: "bg-blue-50 text-blue-700 border-blue-100",
  };

  return (
    <div className="relative group overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("size-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", variants[variant])}>
          {icon}
        </div>
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Finance
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h4 className="text-2xl font-bold tracking-tight">{formatCurrency(value)}</h4>
      </div>
      <p className="mt-4 text-[10px] text-muted-foreground font-medium flex items-center gap-1">
        {description}
        <ArrowRight className="size-2 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[2rem]" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-12">
        <Skeleton className="lg:col-span-4 h-[400px] rounded-[2rem]" />
        <Skeleton className="lg:col-span-8 h-[400px] rounded-[2rem]" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[2.5rem] border border-destructive/20 bg-destructive/5 p-12 text-center">
      <AlertCircle className="mx-auto size-12 text-destructive mb-4" />
      <h3 className="text-lg font-bold text-destructive mb-2">Terjadi Kesalahan</h3>
      <p className="text-sm text-muted-foreground mb-6">Gagal memuat data finansial. Silakan coba lagi.</p>
      <Button variant="outline" onClick={onRetry} className="rounded-2xl border-destructive/20 hover:bg-destructive/10">
        Coba Lagi
      </Button>
    </div>
  );
}
