"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Banknote, Users, UserCog, Settings2, CalendarRange, Plus,
  Loader2, Save, ChevronDown, ChevronRight, Trash2, CheckCircle2,
  CreditCard, Eye, PlusCircle, MinusCircle, X, TrendingUp,
  ArrowRight, CircleDollarSign, Wallet, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminQueryProvider } from "@/components/admin/admin-query-provider";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

/* ═══════════════════════════════════════════════ */
/* TYPES                                           */
/* ═══════════════════════════════════════════════ */

type PayrollConfigUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  role: { name: string };
  createdAt: string;
  payrollConfig: {
    id: string;
    baseSalary: string;
    commissionType: string | null;
    commissionValue: string | null;
    effectiveFrom: string;
    notes: string | null;
  } | null;
};

type PayrollSlipUser = {
  id: string;
  name: string;
  role: { name: string };
  phone?: string | null;
  email?: string | null;
};

type PayrollSlipItem = {
  id: string;
  type: string;
  label: string;
  amount: string;
  notes: string | null;
};

type PayrollTripCommission = {
  id: string;
  tripId: string;
  tripDate: string;
  tripRoute: string;
  tripPrice: string;
  commissionType: string;
  commissionValue: string;
  commissionAmount: string;
};

type PayrollSlip = {
  id: string;
  userId: string;
  baseSalary: string;
  totalCommission: string;
  totalBonus: string;
  totalDeduction: string;
  netAmount: string;
  status: string;
  notes: string | null;
  user: PayrollSlipUser;
  items?: PayrollSlipItem[];
  commissions?: PayrollTripCommission[];
};

type PayrollPeriod = {
  id: string;
  month: number;
  year: number;
  status: string;
  totalAmount: string;
  approvedAt: string | null;
  paidAt: string | null;
  notes: string | null;
  slips: PayrollSlip[];
  _count: { slips: number };
};

/* ═══════════════════════════════════════════════ */
/* HELPERS                                         */
/* ═══════════════════════════════════════════════ */

function formatRupiah(val: string | number) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: "bg-amber-100", text: "text-amber-700", label: "Draft" },
    APPROVED: { bg: "bg-blue-100", text: "text-blue-700", label: "Approved" },
    PAID: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Paid" },
    PENDING: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  };
  const s = map[status] || { bg: "bg-gray-100", text: "text-gray-600", label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════ */
/* PAGE ROOT                                       */
/* ═══════════════════════════════════════════════ */

export default function PayrollPage() {
  return (
    <AdminQueryProvider>
      <PayrollContent />
    </AdminQueryProvider>
  );
}

function PayrollContent() {
  const [activeTab, setActiveTab] = useState<"config" | "periods">("config");

  return (
    <div className="scaffold-page p-6">
      <div className="scaffold-header mb-6">
        <h1 className="scaffold-title text-2xl font-bold flex items-center gap-2">
          <Banknote className="w-7 h-7 text-primary" />
          Payroll
        </h1>
        <p className="scaffold-subtitle text-gray-500">
          Kelola gaji, komisi, dan slip pembayaran untuk driver dan staff Anda.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "config"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Settings2 size={16} />
          Konfigurasi Gaji
        </button>
        <button
          onClick={() => setActiveTab("periods")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "periods"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <CalendarRange size={16} />
          Payroll Bulanan
        </button>
      </div>

      {activeTab === "config" ? <ConfigTab /> : <PeriodsTab />}
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/* TAB 1: KONFIGURASI GAJI                         */
/* ═══════════════════════════════════════════════ */

function ConfigTab() {
  const queryClient = useQueryClient();
  const [editUser, setEditUser] = useState<PayrollConfigUser | null>(null);
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title?: string;
    message: string;
  }>({ isOpen: false, type: "success", message: "" });

  const { data: employees, isLoading } = useQuery<PayrollConfigUser[]>({
    queryKey: ["payroll-config"],
    queryFn: async () => {
      const res = await fetch("/api/owner/payroll/config");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/owner/payroll/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-config"] });
      setEditUser(null);
      setFeedback({
        isOpen: true,
        type: "success",
        message: "Konfigurasi payroll berhasil disimpan.",
      });
    },
    onError: (err: Error) => {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal Menyimpan",
        message: err.message,
      });
    },
  });

  const drivers = employees?.filter((e) => e.role.name === "DRIVER") || [];
  const staff = employees?.filter((e) => e.role.name === "STAFF") || [];

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Truck size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Driver</p>
                <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {drivers.filter((d) => d.payrollConfig).length} sudah dikonfigurasi
                </p>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{staff.length}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {staff.filter((s) => s.payrollConfig).length} sudah dikonfigurasi
                </p>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CircleDollarSign size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Est. Gaji Pokok/bln</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatRupiah(
                    (employees || []).reduce(
                      (s, e) => s + parseFloat(e.payrollConfig?.baseSalary || "0"),
                      0
                    )
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">Belum termasuk komisi</p>
              </div>
            </div>
          </div>

          {/* Drivers Section */}
          <EmployeeSection
            title="Driver"
            icon={<UserCog size={18} className="text-blue-600" />}
            accentColor="blue"
            employees={drivers}
            onEdit={setEditUser}
            showCommission
          />

          {/* Staff Section */}
          <EmployeeSection
            title="Staff"
            icon={<Users size={18} className="text-violet-600" />}
            accentColor="violet"
            employees={staff}
            onEdit={setEditUser}
            showCommission={false}
          />
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto border-l shadow-2xl p-0">
          <div className="flex flex-col h-full bg-slate-50/50">
            <SheetHeader className="p-6 pb-4 border-b bg-white">
              <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                Konfigurasi Gaji
              </SheetTitle>
              <p className="text-sm text-slate-500 mt-1">
                {editUser?.name} — {editUser?.role.name === "DRIVER" ? "Driver" : "Staff"}
              </p>
            </SheetHeader>
            <div className="flex-1 p-6 overflow-y-auto">
              {editUser && (
                <ConfigForm
                  user={editUser}
                  onSubmit={(data) => saveMutation.mutate(data)}
                  isPending={saveMutation.isPending}
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </>
  );
}

/* ── Employee Table Section ── */

function EmployeeSection({
  title,
  icon,
  accentColor,
  employees,
  onEdit,
  showCommission,
}: {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  employees: PayrollConfigUser[];
  onEdit: (u: PayrollConfigUser) => void;
  showCommission: boolean;
}) {
  if (employees.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-8 text-center">
        <p className="text-gray-400 text-sm">
          Belum ada {title.toLowerCase()} terdaftar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg bg-${accentColor}-50 flex items-center justify-center`}>
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <span className="text-xs text-gray-400 ml-1">({employees.length})</span>
      </div>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Nama</th>
              <th className="p-4 font-medium text-gray-600">Gaji Pokok</th>
              {showCommission && (
                <th className="p-4 font-medium text-gray-600">Komisi</th>
              )}
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const cfg = emp.payrollConfig;
              return (
                <tr
                  key={emp.id}
                  className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{emp.name}</div>
                    <div className="text-xs text-gray-400">{emp.phone || emp.email || "-"}</div>
                  </td>
                  <td className="p-4">
                    {cfg ? (
                      <span className="font-semibold text-gray-800">
                        {formatRupiah(cfg.baseSalary)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Belum diatur</span>
                    )}
                  </td>
                  {showCommission && (
                    <td className="p-4">
                      {cfg?.commissionType ? (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                              cfg.commissionType === "FIXED"
                                ? "bg-teal-50 text-teal-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {cfg.commissionType === "FIXED" ? "Tetap" : "Persen"}
                          </span>
                          <span className="text-gray-700 font-medium text-sm">
                            {cfg.commissionType === "FIXED"
                              ? formatRupiah(cfg.commissionValue || "0") + "/trip"
                              : `${parseFloat(cfg.commissionValue || "0")}%`}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Tidak ada</span>
                      )}
                    </td>
                  )}
                  <td className="p-4">
                    {cfg ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 size={14} />
                        Configured
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(emp)}
                      className="text-xs"
                    >
                      <Settings2 size={14} className="mr-1" />
                      {cfg ? "Edit" : "Atur"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Config Form ── */

function ConfigForm({
  user,
  onSubmit,
  isPending,
}: {
  user: PayrollConfigUser;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const cfg = user.payrollConfig;
  const isDriver = user.role.name === "DRIVER";

  const [baseSalary, setBaseSalary] = useState(cfg?.baseSalary || "0");
  const [commissionType, setCommissionType] = useState(cfg?.commissionType || "");
  const [commissionValue, setCommissionValue] = useState(cfg?.commissionValue || "0");
  const [notes, setNotes] = useState(cfg?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      userId: user.id,
      baseSalary: Number(baseSalary),
      commissionType: isDriver && commissionType ? commissionType : null,
      commissionValue: isDriver && commissionType ? Number(commissionValue) : null,
      notes: notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Base Salary */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          Gaji Pokok (per bulan) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
          <input
            type="number"
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
            className="flex h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="0"
            min="0"
          />
        </div>
        <p className="text-xs text-gray-400">
          Gaji tetap yang dibayarkan setiap bulan. Isi 0 jika full komisi.
        </p>
      </div>

      {/* Commission (Driver only) */}
      {isDriver && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Tipe Komisi</label>
            <select
              value={commissionType}
              onChange={(e) => setCommissionType(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Tidak Ada Komisi</option>
              <option value="FIXED">Nominal Tetap per Trip</option>
              <option value="PERCENTAGE">Persentase dari Harga Trip</option>
            </select>
          </div>

          {commissionType && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">
                Nilai Komisi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                {commissionType === "FIXED" ? (
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    Rp
                  </span>
                ) : null}
                <input
                  type="number"
                  value={commissionValue}
                  onChange={(e) => setCommissionValue(e.target.value)}
                  className={`flex h-12 w-full rounded-xl border border-slate-200 bg-white py-2 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                    commissionType === "FIXED" ? "pl-10 pr-4" : "pl-4 pr-10"
                  }`}
                  placeholder="0"
                  min="0"
                  max={commissionType === "PERCENTAGE" ? "100" : undefined}
                  step={commissionType === "PERCENTAGE" ? "0.1" : "1000"}
                />
                {commissionType === "PERCENTAGE" ? (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    %
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-400">
                {commissionType === "FIXED"
                  ? "Jumlah rupiah tetap yang dibayar setiap menyelesaikan 1 trip."
                  : "Persentase dari harga trip yang menjadi komisi driver."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">
          Catatan <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          placeholder="Keterangan tambahan..."
        />
      </div>

      {/* Preview */}
      <div className="bg-slate-100 rounded-xl p-4 mt-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ringkasan</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Gaji Pokok</span>
            <span className="font-medium text-slate-800">{formatRupiah(baseSalary)}</span>
          </div>
          {isDriver && commissionType && (
            <div className="flex justify-between">
              <span className="text-slate-600">Komisi</span>
              <span className="font-medium text-slate-800">
                {commissionType === "FIXED"
                  ? `${formatRupiah(commissionValue)}/trip`
                  : `${commissionValue}% per trip`}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="flex h-12 items-center gap-2 rounded-xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Simpan Konfigurasi
        </Button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════ */
/* TAB 2: PAYROLL BULANAN                          */
/* ═══════════════════════════════════════════════ */

function PeriodsTab() {
  const queryClient = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<PayrollSlip | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title?: string;
    message: string;
  }>({ isOpen: false, type: "success", message: "" });

  const { data: periods, isLoading } = useQuery<PayrollPeriod[]>({
    queryKey: ["payroll-periods"],
    queryFn: async () => {
      const res = await fetch("/api/owner/payroll/periods");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { month: number; year: number }) => {
      const res = await fetch("/api/owner/payroll/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setShowGenerate(false);
      setFeedback({
        isOpen: true,
        type: "success",
        message: "Payroll berhasil di-generate! Cek detail slip karyawan.",
      });
    },
    onError: (err: Error) => {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal Generate Payroll",
        message: err.message,
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/owner/payroll/periods/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setFeedback({
        isOpen: true,
        type: "success",
        message: "Status payroll berhasil diperbarui.",
      });
    },
    onError: (err: Error) => {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal Update Status",
        message: err.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/owner/payroll/periods/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setPeriodToDelete(null);
      setFeedback({
        isOpen: true,
        type: "success",
        message: "Payroll draft berhasil dihapus.",
      });
    },
    onError: (err: Error) => {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal Menghapus",
        message: err.message,
      });
    },
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Riwayat Payroll</h2>
            <p className="text-sm text-gray-500">Kelola payroll bulanan untuk seluruh karyawan.</p>
          </div>
          <Button onClick={() => setShowGenerate(true)} className="flex items-center gap-2">
            <Plus size={16} />
            Generate Payroll
          </Button>
        </div>

        {/* Summary */}
        {periods && periods.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <CalendarRange size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Periode</p>
                <p className="text-2xl font-bold text-gray-900">{periods.length}</p>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sudah Dibayar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {periods.filter((p) => p.status === "PAID").length}
                </p>
              </div>
            </div>
            <div className="bg-white border rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Wallet size={20} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatRupiah(
                    periods
                      .filter((p) => p.status === "PAID")
                      .reduce((s, p) => s + parseFloat(p.totalAmount), 0)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Periods List */}
        {isLoading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : !periods || periods.length === 0 ? (
          <div className="bg-white border border-dashed rounded-xl p-12 flex flex-col items-center text-center">
            <CalendarRange size={40} className="text-gray-300 mb-4" />
            <p className="text-gray-500">Belum ada payroll yang di-generate.</p>
            <p className="text-sm text-gray-400 mt-1">
              Klik &quot;Generate Payroll&quot; untuk membuat payroll bulanan pertama.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => (
              <PeriodCard
                key={period.id}
                period={period}
                isExpanded={expandedPeriod === period.id}
                onToggle={() =>
                  setExpandedPeriod(expandedPeriod === period.id ? null : period.id)
                }
                onApprove={() =>
                  statusMutation.mutate({ id: period.id, status: "APPROVED" })
                }
                onPay={() =>
                  statusMutation.mutate({ id: period.id, status: "PAID" })
                }
                onDelete={() => setPeriodToDelete(period.id)}
                onViewSlip={(slip) => setSelectedSlip(slip)}
                isUpdating={statusMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Generate Dialog */}
      <Sheet open={showGenerate} onOpenChange={setShowGenerate}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto border-l shadow-2xl p-0">
          <div className="flex flex-col h-full bg-slate-50/50">
            <SheetHeader className="p-6 pb-4 border-b bg-white">
              <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Generate Payroll Baru
              </SheetTitle>
              <p className="text-sm text-slate-500 mt-1">
                Pilih bulan dan tahun untuk generate slip gaji otomatis.
              </p>
            </SheetHeader>
            <div className="flex-1 p-6 overflow-y-auto">
              <GenerateForm
                onSubmit={(data) => generateMutation.mutate(data)}
                isPending={generateMutation.isPending}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Slip Detail Sheet */}
      <Sheet open={!!selectedSlip} onOpenChange={(open) => !open && setSelectedSlip(null)}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto border-l shadow-2xl p-0">
          <div className="flex flex-col h-full bg-slate-50/50">
            <SheetHeader className="p-6 pb-4 border-b bg-white">
              <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Detail Slip Gaji
              </SheetTitle>
              <p className="text-sm text-slate-500 mt-1">{selectedSlip?.user.name}</p>
            </SheetHeader>
            <div className="flex-1 p-6 overflow-y-auto">
              {selectedSlip && <SlipDetail slip={selectedSlip} />}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!periodToDelete}
        onClose={() => setPeriodToDelete(null)}
        onConfirm={() => periodToDelete && deleteMutation.mutate(periodToDelete)}
        title="Hapus Payroll Draft?"
        description="Data payroll draft ini beserta seluruh slip gaji akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan."
        confirmText="Ya, Hapus"
        isPending={deleteMutation.isPending}
      />

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </>
  );
}

/* ── Period Card ── */

function PeriodCard({
  period,
  isExpanded,
  onToggle,
  onApprove,
  onPay,
  onDelete,
  onViewSlip,
  isUpdating,
}: {
  period: PayrollPeriod;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onPay: () => void;
  onDelete: () => void;
  onViewSlip: (slip: PayrollSlip) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <CalendarRange size={22} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {MONTHS[period.month - 1]} {period.year}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {period._count.slips} karyawan • {formatRupiah(period.totalAmount)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge(period.status)}
          {isExpanded ? (
            <ChevronDown size={18} className="text-gray-400" />
          ) : (
            <ChevronRight size={18} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t">
          {/* Actions */}
          <div className="p-4 bg-gray-50 border-b flex items-center gap-2 flex-wrap">
            {period.status === "DRAFT" && (
              <>
                <Button
                  size="sm"
                  onClick={onApprove}
                  disabled={isUpdating}
                  className="flex items-center gap-1 text-xs"
                >
                  {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onDelete}
                  className="flex items-center gap-1 text-xs"
                >
                  <Trash2 size={14} />
                  Hapus
                </Button>
              </>
            )}
            {period.status === "APPROVED" && (
              <Button
                size="sm"
                onClick={onPay}
                disabled={isUpdating}
                className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                Tandai Sudah Dibayar
              </Button>
            )}
            {period.status === "PAID" && (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 size={14} />
                Dibayar pada {new Date(period.paidAt!).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </div>

          {/* Slips Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-xs">
                <tr>
                  <th className="p-3 font-medium text-gray-500">Nama</th>
                  <th className="p-3 font-medium text-gray-500">Role</th>
                  <th className="p-3 font-medium text-gray-500 text-right">Gaji Pokok</th>
                  <th className="p-3 font-medium text-gray-500 text-right">Komisi</th>
                  <th className="p-3 font-medium text-gray-500 text-right">Bonus</th>
                  <th className="p-3 font-medium text-gray-500 text-right">Potongan</th>
                  <th className="p-3 font-medium text-gray-500 text-right">Total</th>
                  <th className="p-3 font-medium text-gray-500 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {period.slips.map((slip) => (
                  <tr
                    key={slip.id}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3 font-medium text-gray-800">{slip.user.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                          slip.user.role.name === "DRIVER"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-violet-50 text-violet-700"
                        }`}
                      >
                        {slip.user.role.name === "DRIVER" ? "Driver" : "Staff"}
                      </span>
                    </td>
                    <td className="p-3 text-right text-gray-700">
                      {formatRupiah(slip.baseSalary)}
                    </td>
                    <td className="p-3 text-right text-gray-700">
                      {parseFloat(slip.totalCommission) > 0
                        ? formatRupiah(slip.totalCommission)
                        : "-"}
                    </td>
                    <td className="p-3 text-right text-emerald-600">
                      {parseFloat(slip.totalBonus) > 0
                        ? `+${formatRupiah(slip.totalBonus)}`
                        : "-"}
                    </td>
                    <td className="p-3 text-right text-red-500">
                      {parseFloat(slip.totalDeduction) > 0
                        ? `-${formatRupiah(slip.totalDeduction)}`
                        : "-"}
                    </td>
                    <td className="p-3 text-right font-semibold text-gray-900">
                      {formatRupiah(slip.netAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewSlip(slip)}
                        title="Lihat Detail"
                      >
                        <Eye size={16} className="text-gray-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={6} className="p-3 text-right font-semibold text-gray-600 text-sm">
                    Total Payroll:
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900 text-base">
                    {formatRupiah(period.totalAmount)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Generate Form ── */

function GenerateForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: { month: number; year: number }) => void;
  isPending: boolean;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ month, year });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">Bulan</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-slate-700">Tahun</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          min={2024}
          max={2030}
          className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-2">
        <p className="text-sm text-blue-700 flex items-start gap-2">
          <TrendingUp size={16} className="mt-0.5 flex-shrink-0" />
          <span>
            Payroll akan dihitung otomatis untuk seluruh driver dan staff aktif.
            Driver yang memiliki trip dengan status <strong>COMPLETED</strong> dalam bulan ini
            akan mendapat komisi sesuai konfigurasi.
          </span>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="flex h-12 items-center gap-2 rounded-xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
          Generate Payroll
        </Button>
      </div>
    </form>
  );
}

/* ── Slip Detail ── */

function SlipDetail({ slip }: { slip: PayrollSlip }) {
  const queryClient = useQueryClient();
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemType, setItemType] = useState<"BONUS" | "DEDUCTION">("BONUS");
  const [itemLabel, setItemLabel] = useState("");
  const [itemAmount, setItemAmount] = useState("");
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title?: string;
    message: string;
  }>({ isOpen: false, type: "success", message: "" });

  // Fetch full slip detail
  const { data: fullSlip } = useQuery<PayrollSlip & { items: PayrollSlipItem[]; commissions: PayrollTripCommission[]; period?: { status: string } }>({
    queryKey: ["payroll-slip", slip.id],
    queryFn: async () => {
      const res = await fetch(`/api/owner/payroll/slips/${slip.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/owner/payroll/slips/${slip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_item", ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-slip", slip.id] });
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
      setShowAddItem(false);
      setItemLabel("");
      setItemAmount("");
    },
    onError: (err: Error) => {
      setFeedback({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: err.message,
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/owner/payroll/slips/${slip.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_item", itemId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-slip", slip.id] });
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
    },
  });

  const displaySlip = fullSlip || slip;
  const items = fullSlip?.items || [];
  const commissions = fullSlip?.commissions || [];
  const isDraft = (fullSlip as { period?: { status: string } })?.period?.status === "DRAFT";

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-300">Total Gaji Bersih</p>
            <p className="text-3xl font-bold mt-1">{formatRupiah(displaySlip.netAmount)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <CreditCard size={24} className="text-white/80" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-slate-400">Gaji Pokok</p>
            <p className="font-semibold">{formatRupiah(displaySlip.baseSalary)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Komisi</p>
            <p className="font-semibold">{formatRupiah(displaySlip.totalCommission)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Bonus</p>
            <p className="font-semibold text-emerald-300">
              +{formatRupiah(displaySlip.totalBonus)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Potongan</p>
            <p className="font-semibold text-red-300">
              -{formatRupiah(displaySlip.totalDeduction)}
            </p>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 text-sm">Detail Item</h3>
          {isDraft && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddItem(!showAddItem)}
              className="text-xs"
            >
              {showAddItem ? <X size={14} className="mr-1" /> : <PlusCircle size={14} className="mr-1" />}
              {showAddItem ? "Batal" : "Tambah Bonus/Potongan"}
            </Button>
          )}
        </div>

        {/* Add Item Form */}
        {showAddItem && (
          <div className="bg-white border rounded-xl p-4 mb-3 space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setItemType("BONUS")}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  itemType === "BONUS"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <PlusCircle size={14} />
                Bonus
              </button>
              <button
                type="button"
                onClick={() => setItemType("DEDUCTION")}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  itemType === "DEDUCTION"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <MinusCircle size={14} />
                Potongan
              </button>
            </div>
            <input
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              placeholder="Keterangan (misal: Bonus Lembur)"
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                Rp
              </span>
              <input
                type="number"
                value={itemAmount}
                onChange={(e) => setItemAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button
              size="sm"
              onClick={() =>
                addItemMutation.mutate({
                  type: itemType,
                  label: itemLabel,
                  amount: Number(itemAmount),
                })
              }
              disabled={!itemLabel || !itemAmount || addItemMutation.isPending}
              className="w-full"
            >
              {addItemMutation.isPending ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : (
                <Save size={14} className="mr-1" />
              )}
              Tambah {itemType === "BONUS" ? "Bonus" : "Potongan"}
            </Button>
          </div>
        )}

        {/* Items */}
        <div className="bg-white border rounded-xl overflow-hidden divide-y">
          {items.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Tidak ada item detail.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.type === "BASE_SALARY"
                        ? "bg-blue-50"
                        : item.type === "COMMISSION"
                          ? "bg-teal-50"
                          : item.type === "BONUS"
                            ? "bg-emerald-50"
                            : "bg-red-50"
                    }`}
                  >
                    {item.type === "BASE_SALARY" && <Wallet size={14} className="text-blue-500" />}
                    {item.type === "COMMISSION" && <TrendingUp size={14} className="text-teal-500" />}
                    {item.type === "BONUS" && <PlusCircle size={14} className="text-emerald-500" />}
                    {item.type === "DEDUCTION" && <MinusCircle size={14} className="text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {item.type === "BASE_SALARY"
                        ? "Gaji Pokok"
                        : item.type === "COMMISSION"
                          ? "Komisi"
                          : item.type === "BONUS"
                            ? "Bonus"
                            : "Potongan"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-sm ${
                      item.type === "DEDUCTION" ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {item.type === "DEDUCTION" ? "-" : "+"}
                    {formatRupiah(item.amount)}
                  </span>
                  {isDraft && (item.type === "BONUS" || item.type === "DEDUCTION") && (
                    <button
                      onClick={() => removeItemMutation.mutate(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      disabled={removeItemMutation.isPending}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Commission Details (Driver only) */}
      {commissions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Detail Komisi Per Trip</h3>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 font-medium text-gray-500">Tanggal</th>
                  <th className="p-3 font-medium text-gray-500">Rute</th>
                  <th className="p-3 font-medium text-gray-500 text-right">Harga Trip</th>
                  <th className="p-3 font-medium text-gray-500 text-right">Komisi</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3 text-gray-600">
                      {new Date(c.tripDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="p-3 text-gray-800 font-medium">{c.tripRoute}</td>
                    <td className="p-3 text-right text-gray-600">{formatRupiah(c.tripPrice)}</td>
                    <td className="p-3 text-right font-semibold text-teal-600">
                      {formatRupiah(c.commissionAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={3} className="p-3 text-right font-semibold text-gray-500">
                    Total Komisi:
                  </td>
                  <td className="p-3 text-right font-bold text-teal-700">
                    {formatRupiah(displaySlip.totalCommission)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

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
