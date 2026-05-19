"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Car, Plus, Pencil, Trash2, Loader2, Save, RefreshCw, Wrench, CircleOff, CircleCheck, Armchair, Camera } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { VehicleImageUpload, type VehicleImages } from "@/components/vendor/vehicle-image-upload";
import { SeatLayoutBuilder, SeatLayoutPreview, type SeatLayout } from "@/components/vendor/seat-layout-builder";

type Vehicle = {
    id: string;
    licensePlate: string;
    name: string | null;
    brand: string;
    model: string;
    year: number | null;
    capacity: number;
    color: string | null;
    status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
    imageUrl: string | null;
    images: VehicleImages | null;
    seatLayout: SeatLayout | null;
    createdAt: string;
};

function getFirstImage(vehicle: Vehicle): string | null {
    if (vehicle.images) {
        return vehicle.images.front || vehicle.images.left || vehicle.images.right || vehicle.images.back || null;
    }
    return vehicle.imageUrl;
}

const STATUS_CONFIG = {
    ACTIVE: { label: "Aktif", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: CircleCheck },
    MAINTENANCE: { label: "Servis", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Wrench },
    INACTIVE: { label: "Nonaktif", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: CircleOff },
};

export function FleetManager() {
    const queryClient = useQueryClient();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ isOpen: boolean; type: "success" | "error"; title?: string; message: string }>({ isOpen: false, type: "success", message: "" });

    const { data: vehicleList, isLoading, error } = useQuery<Vehicle[]>({
        queryKey: ["vendor-fleet"],
        queryFn: async () => {
            const res = await fetch("/api/vendor/fleet");
            if (!res.ok) throw new Error("Gagal mengambil data armada");
            return res.json();
        },
    });

    const createMutation = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: async (newVehicle: Record<string, any>) => {
            const res = await fetch("/api/vendor/fleet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newVehicle),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Gagal menambahkan armada");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-fleet"] });
            setIsSheetOpen(false);
            setFeedback({ isOpen: true, type: "success", message: "Armada baru berhasil ditambahkan." });
        },
        onError: (err: Error) => {
            setFeedback({ isOpen: true, type: "error", title: "Gagal Menambahkan Armada", message: err.message });
        },
    });

    const updateMutation = useMutation({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
            const res = await fetch(`/api/vendor/fleet/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Gagal memperbarui armada");
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["vendor-fleet"] });
            setIsSheetOpen(false);
            setEditingVehicle(null);
            
            if (data && data.cancelledTripsCount > 0) {
                const parts = [
                    `Data armada berhasil diperbarui menjadi ${data.status === "MAINTENANCE" ? "Servis" : "Nonaktif"}.`,
                    `Sistem mendeteksi ada ${data.cancelledTripsCount} jadwal perjalanan aktif mendatang yang terdampak.`
                ];
                
                if (data.transferredBookingsCount > 0) {
                    parts.push(`• **${data.transferredBookingsCount} tiket kustomer** berhasil DIPINDAHKAN OTOMATIS ke jadwal pengganti/armada lain yang aktif pada hari yang sama dengan kapasitas yang mencukupi.`);
                }
                
                if (data.cancelledBookingsCount > 0) {
                    parts.push(`• **${data.cancelledBookingsCount} tiket kustomer** otomatis DIBATALKAN & DI-REFUND karena tidak ada jadwal alternatif berkapasitas cukup pada hari bersangkutan.`);
                }
                
                setFeedback({
                    isOpen: true,
                    type: "success",
                    title: "Status Diperbarui & Proteksi Jadwal Kustomer Aktif",
                    message: parts.join("\n\n")
                });
            } else {
                setFeedback({ isOpen: true, type: "success", message: "Data armada berhasil diperbarui." });
            }
        },
        onError: (err: Error) => {
            setFeedback({ isOpen: true, type: "error", title: "Gagal Memperbarui Armada", message: err.message });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/vendor/fleet/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Gagal menghapus armada");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vendor-fleet"] });
            setVehicleToDelete(null);
            setFeedback({ isOpen: true, type: "success", message: "Data armada berhasil dihapus." });
        },
        onError: (err: Error) => {
            setFeedback({ isOpen: true, type: "error", title: "Gagal Menghapus Armada", message: err.message });
        },
    });

    const confirmDelete = () => {
        if (vehicleToDelete) {
            deleteMutation.mutate(vehicleToDelete);
        }
    };

    return (
        <div className="scaffold-page p-6">
            <div className="scaffold-header flex justify-between items-center mb-6">
                <div>
                    <h1 className="scaffold-title text-2xl font-bold flex items-center gap-2">
                        <Car className="text-primary" /> Kelola Armada
                    </h1>
                    <p className="scaffold-subtitle text-slate-500 mt-1">Daftar kendaraan operasional dan statusnya untuk vendor Anda.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["vendor-fleet"] })}
                        disabled={isLoading}
                        className="rounded-xl"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Button onClick={() => { setEditingVehicle(null); setIsSheetOpen(true); }} className="flex h-11 items-center gap-2 rounded-xl px-5 font-semibold shadow-lg shadow-primary/20">
                        <Plus size={18} /> Tambah Armada
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-16"><Loader2 className="animate-spin w-8 h-8 text-slate-300" /></div>
            ) : error ? (
                <div className="text-red-500 p-6 bg-red-50 rounded-xl border border-red-100">Gagal memuat daftar armada.</div>
            ) : vehicleList?.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-slate-50/50">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4"><Car size={40} className="text-slate-300" /></div>
                    <p className="text-slate-500 font-medium">Belum ada armada terdaftar. Klik &quot;Tambah Armada&quot; untuk menambahkan kendaraan baru.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Kendaraan</th>
                                <th className="p-4 font-semibold text-slate-600">Plat Nomor</th>
                                <th className="p-4 font-semibold text-slate-600">Layout Kursi</th>
                                <th className="p-4 font-semibold text-slate-600">Status</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {vehicleList?.map((vehicle) => {
                                const statusCfg = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG.ACTIVE;
                                const StatusIcon = statusCfg.icon;
                                return (
                                    <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 border flex items-center justify-center overflow-hidden shrink-0">
                                                    {getFirstImage(vehicle) ? (
                                                        <img src={getFirstImage(vehicle)!} alt={vehicle.model} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Car className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{vehicle.name || `${vehicle.brand} ${vehicle.model}`}</p>
                                                    <p className="text-xs text-slate-500">{vehicle.brand} {vehicle.model} {vehicle.year ? `• ${vehicle.year}` : ""} {vehicle.color ? `• ${vehicle.color}` : ""}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs tracking-wide">
                                                {vehicle.licensePlate}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <SeatLayoutPreview layout={vehicle.seatLayout} />
                                                <span className="text-sm font-medium text-slate-700">{vehicle.capacity} <span className="text-slate-400 font-normal">kursi</span></span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                                <StatusIcon size={12} />
                                                {statusCfg.label}
                                            </span>
                                        </td>
                                        <td className="p-4 flex gap-2 justify-end items-center">
                                            <Button variant="outline" size="icon" className="rounded-lg hover:bg-slate-100 hover:text-slate-900" onClick={() => { setEditingVehicle(vehicle); setIsSheetOpen(true); }}>
                                                <Pencil size={16} className="text-slate-600" />
                                            </Button>
                                            <Button variant="destructive" size="icon" className="rounded-lg shadow-sm" onClick={() => setVehicleToDelete(vehicle.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-2xl w-full overflow-y-auto border-l shadow-2xl p-0">
                    <div className="flex flex-col h-full bg-slate-50/50">
                        <SheetHeader className="p-6 pb-4 border-b bg-white sticky top-0 z-10">
                            <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Car className="w-5 h-5 text-primary" />
                                {editingVehicle ? "Edit Data Armada" : "Tambah Armada Baru"}
                            </SheetTitle>
                            <p className="text-sm text-slate-500 mt-1">
                                {editingVehicle ? "Perbarui informasi kendaraan ini." : "Lengkapi detail kendaraan yang akan didaftarkan."}
                            </p>
                        </SheetHeader>
                        <div className="flex-1 p-6 overflow-y-auto">
                            <VehicleForm
                                key={editingVehicle?.id || "new"}
                                initialData={editingVehicle}
                                onSubmit={(data) => {
                                    if (editingVehicle) {
                                        updateMutation.mutate({ id: editingVehicle.id, data });
                                    } else {
                                        createMutation.mutate(data);
                                    }
                                }}
                                isPending={createMutation.isPending || updateMutation.isPending}
                            />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <ConfirmModal
                isOpen={!!vehicleToDelete}
                onClose={() => setVehicleToDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Data Armada?"
                description="Data kendaraan ini akan dihapus secara permanen. Pastikan tidak ada trip aktif yang menggunakan kendaraan ini."
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
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VehicleForm({ initialData, onSubmit, isPending }: { initialData: Vehicle | null; onSubmit: (data: Record<string, any>) => void; isPending: boolean }) {
    const [images, setImages] = useState<VehicleImages>(initialData?.images || {});
    const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(initialData?.seatLayout || null);

    const form = useForm({
        defaultValues: {
            licensePlate: initialData?.licensePlate || "",
            name: initialData?.name || "",
            brand: initialData?.brand || "",
            model: initialData?.model || "",
            year: initialData?.year?.toString() || "",
            color: initialData?.color || "",
            status: initialData?.status || "ACTIVE",
        },
        onSubmit: async ({ value }) => {
            const capacity = seatLayout?.seats?.length || 0;
            // Use front image as main thumbnail for backward compat
            const imageUrl = images.front || images.left || images.right || images.back || null;
            onSubmit({
                ...value,
                capacity: capacity.toString(),
                imageUrl,
                images,
                seatLayout: seatLayout,
            });
        },
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
            className="flex flex-col gap-6"
        >
            {/* Foto Kendaraan */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" /> Foto Kendaraan
                </h3>
                <p className="text-sm text-slate-500 mb-4">Upload foto dari berbagai sisi untuk profil armada yang lengkap.</p>
                <VehicleImageUpload value={images} onChange={setImages} />
            </div>

            {/* Info Utama */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" /> Informasi Kendaraan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <form.Field name="licensePlate" validators={{ onChange: ({ value }) => (!value ? "Plat nomor wajib diisi" : undefined) }}>
                        {(field) => (
                            <div className="flex flex-col gap-2">
                                <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Plat Nomor <span className="text-red-500">*</span></label>
                                <input
                                    id={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                                    className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
                                    placeholder="B 1234 ABC"
                                />
                                {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="name">
                        {(field) => (
                            <div className="flex flex-col gap-2">
                                <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Nama Panggilan <span className="text-slate-400 font-normal">(Opsional)</span></label>
                                <input
                                    id={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Si Merah"
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="brand" validators={{ onChange: ({ value }) => (!value ? "Merek wajib diisi" : undefined) }}>
                        {(field) => (
                            <div className="flex flex-col gap-2">
                                <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Merek <span className="text-red-500">*</span></label>
                                <input
                                    id={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
                                    placeholder="Toyota"
                                />
                                {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="model" validators={{ onChange: ({ value }) => (!value ? "Model wajib diisi" : undefined) }}>
                        {(field) => (
                            <div className="flex flex-col gap-2">
                                <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Model <span className="text-red-500">*</span></label>
                                <input
                                    id={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
                                    placeholder="Hiace / Avanza"
                                />
                                {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
                            </div>
                        )}
                    </form.Field>
                </div>
            </div>

            {/* Detail Spesifikasi */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">Detail Spesifikasi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <form.Field name="year">
                        {(field) => (
                            <div className="flex flex-col gap-2">
                                <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Tahun</label>
                                <input
                                    id={field.name}
                                    type="number"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="2022"
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="color">
                        {(field) => (
                            <div className="flex flex-col gap-2">
                                <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Warna</label>
                                <input
                                    id={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Putih"
                                />
                            </div>
                        )}
                    </form.Field>
                </div>

                <form.Field name="status">
                    {(field) => (
                        <div className="flex flex-col gap-2 mt-4">
                            <label className="text-sm font-semibold text-slate-700">Status Kendaraan</label>
                            <div className="flex gap-2">
                                {(["ACTIVE", "MAINTENANCE", "INACTIVE"] as const).map((status) => {
                                    const cfg = STATUS_CONFIG[status];
                                    const isSelected = field.state.value === status;
                                    return (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => field.handleChange(status)}
                                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${isSelected
                                                ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                                                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            <cfg.icon size={14} />
                                            {cfg.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </form.Field>
            </div>

            {/* Seat Layout Builder */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-primary" /> Tata Letak Kursi
                </h3>
                <p className="text-sm text-slate-500 mb-4">Klik pada posisi grid untuk menambah atau menghapus kursi. Kapasitas dihitung otomatis.</p>
                <SeatLayoutBuilder
                    value={seatLayout}
                    onChange={(layout) => setSeatLayout(layout)}
                />
            </div>

            <div className="mt-4 pt-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-slate-50/50 pb-2">
                <Button
                    type="submit"
                    disabled={isPending}
                    className="flex h-12 items-center gap-2 rounded-xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 w-full md:w-auto justify-center"
                >
                    {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {initialData ? "Simpan Perubahan" : "Tambah Armada"}
                </Button>
            </div>
        </form>
    );
}
