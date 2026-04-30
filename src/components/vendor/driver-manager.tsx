"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, Loader2, Save, Car, Camera } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ImageUpload } from "@/components/ui/image-upload";

type DriverProfile = {
  simNumber: string;
  ktpNumber: string;
  address: string;
  photoUrl: string | null;
  ktpImage: string | null;
  simImage: string | null;
};

type Driver = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  driverProfile: DriverProfile | null;
};

export function DriverManager() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isOpen: boolean; type: "success" | "error"; title?: string; message: string }>({ isOpen: false, type: "success", message: "" });

  const { data: driverList, isLoading, error } = useQuery<Driver[]>({
    queryKey: ["vendor-drivers"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/drivers");
      if (!res.ok) throw new Error("Failed to fetch drivers");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newDriver: Record<string, string>) => {
      const res = await fetch("/api/vendor/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDriver),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create driver");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-drivers"] });
      setIsSheetOpen(false);
      setFeedback({ isOpen: true, type: "success", message: "Data driver baru berhasil ditambahkan." });
    },
    onError: (err: Error) => {
      setFeedback({ isOpen: true, type: "error", title: "Gagal Menambahkan Driver", message: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const res = await fetch(`/api/vendor/drivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update driver");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-drivers"] });
      setIsSheetOpen(false);
      setEditingDriver(null);
      setFeedback({ isOpen: true, type: "success", message: "Perubahan data driver berhasil disimpan." });
    },
    onError: (err: Error) => {
      setFeedback({ isOpen: true, type: "error", title: "Gagal Menyimpan Perubahan", message: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vendor/drivers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete driver");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-drivers"] });
      setDriverToDelete(null);
      setFeedback({ isOpen: true, type: "success", message: "Data driver berhasil dihapus." });
    },
    onError: (err: Error) => {
      setFeedback({ isOpen: true, type: "error", title: "Gagal Menghapus Driver", message: err.message });
    },
  });

  const confirmDelete = () => {
    if (driverToDelete) {
      deleteMutation.mutate(driverToDelete);
    }
  };

  return (
    <div className="scaffold-page p-6">
      <div className="scaffold-header flex justify-between items-center mb-6">
        <div>
          <h1 className="scaffold-title text-2xl font-bold flex items-center gap-2">
            <Car className="text-primary" /> Kelola Driver
          </h1>
          <p className="scaffold-subtitle text-slate-500 mt-1">Daftar driver operasional kendaraan untuk vendor Anda.</p>
        </div>
        <Button onClick={() => { setEditingDriver(null); setIsSheetOpen(true); }} className="flex h-11 items-center gap-2 rounded-xl px-5 font-semibold shadow-lg shadow-primary/20">
          <Plus size={18} /> Tambah Driver
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-16"><Loader2 className="animate-spin w-8 h-8 text-slate-300" /></div>
      ) : error ? (
        <div className="text-red-500 p-6 bg-red-50 rounded-xl border border-red-100">Failed to load drivers list.</div>
      ) : driverList?.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-slate-50/50">
          <div className="bg-white p-4 rounded-full shadow-sm mb-4"><Car size={40} className="text-slate-300" /></div>
          <p className="text-slate-500 font-medium">Belum ada data driver. Klik &quot;Tambah Driver&quot; untuk membuat akun baru.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold text-slate-600">Profil</th>
                <th className="p-4 font-semibold text-slate-600">Kontak</th>
                <th className="p-4 font-semibold text-slate-600">Identitas</th>
                <th className="p-4 font-semibold text-slate-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverList?.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border flex items-center justify-center overflow-hidden shrink-0">
                      {driver.driverProfile?.photoUrl ? (
                        <img src={driver.driverProfile.photoUrl} alt={driver.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{driver.name}</p>
                      <p className="text-xs text-slate-500">Bergabung {new Date(driver.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-700">{driver.phone || "-"}</p>
                    <p className="text-xs text-slate-500">{driver.email || "-"}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-slate-500">SIM: <span className="font-medium text-slate-700">{driver.driverProfile?.simNumber || "-"}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5">KTP: <span className="font-medium text-slate-700">{driver.driverProfile?.ktpNumber || "-"}</span></p>
                  </td>
                  <td className="p-4 flex gap-2 justify-end items-center h-full">
                    <Button variant="outline" size="icon" className="rounded-lg hover:bg-slate-100 hover:text-slate-900" onClick={() => { setEditingDriver(driver); setIsSheetOpen(true); }}>
                      <Pencil size={16} className="text-slate-600" />
                    </Button>
                    <Button variant="destructive" size="icon" className="rounded-lg shadow-sm" onClick={() => setDriverToDelete(driver.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto border-l shadow-2xl p-0">
          <div className="flex flex-col h-full bg-slate-50/50">
            <SheetHeader className="p-6 pb-4 border-b bg-white sticky top-0 z-10">
              <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                {editingDriver ? "Edit Data Driver" : "Tambah Driver Baru"}
              </SheetTitle>
              <p className="text-sm text-slate-500 mt-1">
                {editingDriver ? "Perbarui informasi identitas dan kontak driver." : "Lengkapi semua data yang diperlukan untuk mendaftarkan driver."}
              </p>
            </SheetHeader>
            <div className="flex-1 p-6 overflow-y-auto">
              <DriverForm 
                initialData={editingDriver} 
                onSubmit={(data) => {
                  if (editingDriver) {
                    updateMutation.mutate({ id: editingDriver.id, data });
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
        isOpen={!!driverToDelete}
        onClose={() => setDriverToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Data Driver?"
        description="Data driver ini akan dihapus secara permanen. Pastikan tidak ada perjalanan aktif yang sedang ditugaskan ke driver ini."
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

function DriverForm({ initialData, onSubmit, isPending }: { initialData: Driver | null, onSubmit: (data: Record<string, string>) => void, isPending: boolean }) {
  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      simNumber: initialData?.driverProfile?.simNumber || "",
      ktpNumber: initialData?.driverProfile?.ktpNumber || "",
      address: initialData?.driverProfile?.address || "",
      photoUrl: initialData?.driverProfile?.photoUrl || "",
      ktpImage: initialData?.driverProfile?.ktpImage || "",
      simImage: initialData?.driverProfile?.simImage || "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
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
      <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-5 md:items-center">
        <div className="w-full md:w-40 shrink-0">
          <form.Field name="photoUrl">
            {(field) => (
              <ImageUpload 
                value={field.state.value} 
                onChange={(url) => field.handleChange(url)}
                onRemove={() => field.handleChange("")}
                label="Foto Profil"
                aspectRatio="square"
              />
            )}
          </form.Field>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="font-semibold text-slate-800">Foto Profil Driver</h3>
          <p className="text-sm text-slate-500">Gunakan foto wajah yang jelas. Opsional namun disarankan agar profil terlihat profesional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <form.Field name="name" validators={{ onChange: ({ value }) => (!value ? "Nama wajib diisi" : undefined) }}>
          {(field) => (
            <div className="flex flex-col gap-2">
              <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
              <input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
                placeholder="Nama lengkap"
              />
              {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
            </div>
          )}
        </form.Field>

        <form.Field name="email" validators={{ onChange: ({ value }) => (!value ? "Email wajib diisi" : undefined) }}>
          {(field) => (
            <div className="flex flex-col gap-2">
              <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Email <span className="text-red-500">*</span></label>
              <input
                id={field.name}
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
                placeholder="driver@contoh.com"
              />
              {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <form.Field name="phone" validators={{ onChange: ({ value }) => (!value ? "Telepon wajib diisi" : undefined) }}>
          {(field) => (
            <div className="flex flex-col gap-2">
              <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">No. Telepon <span className="text-red-500">*</span></label>
              <input
                id={field.name}
                type="tel"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value.replace(/[^0-9]/g, ""))}
                className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
                placeholder="08123456789"
              />
              {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
            </div>
          )}
        </form.Field>

        <form.Field name="password" validators={{ onChange: ({ value }) => (!initialData && (!value || value.length < 6) ? "Password minimal 6 karakter" : undefined) }}>
          {(field) => (
            <div className="flex flex-col gap-2">
              <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Password {initialData ? <span className="text-slate-400 font-normal ml-1">(Opsional)</span> : <span className="text-red-500">*</span>}</label>
              <input
                id={field.name}
                type="password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
                placeholder={initialData ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
              />
              {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
            </div>
          )}
        </form.Field>
      </div>

      <div className="border-t border-slate-200 pt-5 mt-2">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">Identitas & Legalitas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-4">
            <form.Field name="simNumber" validators={{ onChange: ({ value }) => (!value ? "No SIM wajib diisi" : undefined) }}>
              {(field) => (
                <div className="flex flex-col gap-2">
                  <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Nomor SIM <span className="text-red-500">*</span></label>
                  <input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value.replace(/[^0-9]/g, ""))}
                    className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
                    placeholder="Nomor SIM (hanya angka)"
                  />
                  {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
                </div>
              )}
            </form.Field>
            <form.Field name="simImage">
              {(field) => (
                <ImageUpload 
                  value={field.state.value} 
                  onChange={(url) => field.handleChange(url)}
                  onRemove={() => field.handleChange("")}
                  label="Foto SIM (Opsional)"
                />
              )}
            </form.Field>
          </div>

          <div className="flex flex-col gap-4">
            <form.Field name="ktpNumber" validators={{ onChange: ({ value }) => (!value ? "No KTP wajib diisi" : undefined) }}>
              {(field) => (
                <div className="flex flex-col gap-2">
                  <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Nomor KTP <span className="text-red-500">*</span></label>
                  <input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value.replace(/[^0-9]/g, ""))}
                    className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
                    placeholder="Nomor KTP (hanya angka)"
                  />
                  {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
                </div>
              )}
            </form.Field>
            <form.Field name="ktpImage">
              {(field) => (
                <ImageUpload 
                  value={field.state.value} 
                  onChange={(url) => field.handleChange(url)}
                  onRemove={() => field.handleChange("")}
                  label="Foto KTP (Opsional)"
                />
              )}
            </form.Field>
          </div>
        </div>
      </div>

      <form.Field name="address" validators={{ onChange: ({ value }) => (!value ? "Alamat wajib diisi" : undefined) }}>
        {(field) => (
          <div className="flex flex-col gap-2">
            <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Alamat Tinggal <span className="text-red-500">*</span></label>
            <textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              rows={3}
              className={`flex w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 ${field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500" : "border-slate-200 focus:ring-primary/20 focus:border-primary"}`}
              placeholder="Alamat lengkap tempat tinggal"
            />
            {field.state.meta.errors && <span className="text-xs font-medium text-red-500">{field.state.meta.errors.join(", ")}</span>}
          </div>
        )}
      </form.Field>

      <div className="mt-4 pt-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-slate-50/50 pb-2">
        <Button 
          type="submit" 
          disabled={isPending} 
          className="flex h-12 items-center gap-2 rounded-xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 w-full md:w-auto justify-center"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {initialData ? "Simpan Perubahan" : "Buat Driver"}
        </Button>
      </div>
    </form>
  );
}
