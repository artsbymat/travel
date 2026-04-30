"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Pencil, Trash2, Loader2, Save } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AdminQueryProvider } from "@/components/admin/admin-query-provider";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type Staff = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export default function OwnerStaffPage() {
  return (
    <AdminQueryProvider>
      <StaffPageContent />
    </AdminQueryProvider>
  );
}

function StaffPageContent() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ isOpen: boolean; type: "success" | "error"; title?: string; message: string }>({ isOpen: false, type: "success", message: "" });

  // Fetch staff
  const { data: staffList, isLoading, error } = useQuery<Staff[]>({
    queryKey: ["owner-staff"],
    queryFn: async () => {
      const res = await fetch("/api/owner/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newStaff: Record<string, string>) => {
      const res = await fetch("/api/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create staff");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-staff"] });
      setIsSheetOpen(false);
      setFeedback({ isOpen: true, type: "success", message: "Data staff baru berhasil ditambahkan ke sistem." });
    },
    onError: (err: Error) => {
      setFeedback({ isOpen: true, type: "error", title: "Gagal Menambahkan Staff", message: err.message });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      const res = await fetch(`/api/owner/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update staff");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-staff"] });
      setIsSheetOpen(false);
      setEditingStaff(null);
      setFeedback({ isOpen: true, type: "success", message: "Perubahan data staff berhasil disimpan." });
    },
    onError: (err: Error) => {
      setFeedback({ isOpen: true, type: "error", title: "Gagal Menyimpan Perubahan", message: err.message });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/owner/staff/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete staff");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-staff"] });
      setStaffToDelete(null);
      setFeedback({ isOpen: true, type: "success", message: "Data staff berhasil dihapus." });
    },
    onError: (err: Error) => {
      setFeedback({ isOpen: true, type: "error", title: "Gagal Menghapus Staff", message: err.message });
    },
  });

  const handleDeleteClick = (id: string) => {
    setStaffToDelete(id);
  };

  const confirmDelete = () => {
    if (staffToDelete) {
      deleteMutation.mutate(staffToDelete);
    }
  };

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setIsSheetOpen(true);
  };

  return (
    <div className="scaffold-page p-6">
      <div className="scaffold-header flex justify-between items-center mb-6">
        <div>
          <h1 className="scaffold-title text-2xl font-bold">Kelola Staff</h1>
          <p className="scaffold-subtitle text-gray-500">Daftar staff operasional yang membantu bisnis Anda.</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus size={16} /> Tambah Staff
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : error ? (
        <div className="text-red-500">Failed to load staff list.</div>
      ) : staffList?.length === 0 ? (
        <div className="scaffold-placeholder border border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center">
          <div className="scaffold-placeholder-icon mb-4"><Users size={40} color="#94a3b8" /></div>
          <p className="scaffold-placeholder-text text-gray-500">Belum ada data staff. Klik &quot;Tambah Staff&quot; untuk membuat akun baru.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-medium text-gray-600">Nama</th>
                <th className="p-4 font-medium text-gray-600">Email</th>
                <th className="p-4 font-medium text-gray-600">Telepon</th>
                <th className="p-4 font-medium text-gray-600">Tgl Bergabung</th>
                <th className="p-4 font-medium text-gray-600 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {staffList?.map((staff) => (
                <tr key={staff.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{staff.name}</td>
                  <td className="p-4 text-gray-600">{staff.email || "-"}</td>
                  <td className="p-4 text-gray-600">{staff.phone || "-"}</td>
                  <td className="p-4 text-gray-600">{new Date(staff.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="p-4 flex gap-2 justify-end">
                    <Button variant="outline" size="icon" onClick={() => handleOpenEdit(staff)}>
                      <Pencil size={16} className="text-gray-600" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(staff.id)}>
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
        <SheetContent className="sm:max-w-md w-full overflow-y-auto border-l shadow-2xl p-0">
          <div className="flex flex-col h-full bg-slate-50/50">
            <SheetHeader className="p-6 pb-4 border-b bg-white">
              <SheetTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {editingStaff ? "Edit Data Staff" : "Tambah Staff Baru"}
              </SheetTitle>
              <p className="text-sm text-slate-500 mt-1">
                {editingStaff ? "Perbarui informasi staff operasional di bawah ini." : "Lengkapi form di bawah untuk menambahkan staff baru ke sistem."}
              </p>
            </SheetHeader>
            <div className="flex-1 p-6 overflow-y-auto">
              <StaffForm 
                initialData={editingStaff} 
                onSubmit={(data) => {
                  if (editingStaff) {
                    updateMutation.mutate({ id: editingStaff.id, data });
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
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={confirmDelete}
        title="Apakah Anda yakin?"
        description="Tindakan ini tidak dapat dibatalkan. Data staff ini akan dihapus secara permanen dari sistem."
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

function StaffForm({ initialData, onSubmit, isPending }: { initialData: Staff | null, onSubmit: (data: Record<string, string>) => void, isPending: boolean }) {
  const form = useForm({
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
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
      className="flex flex-col gap-5"
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => (!value ? "Nama wajib diisi" : undefined),
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Nama Lengkap <span className="text-red-500">*</span></label>
            <input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200"
              }`}
              placeholder="Masukkan nama lengkap"
            />
            {field.state.meta.errors ? (
              <span className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                {field.state.meta.errors.join(", ")}
              </span>
            ) : null}
          </div>
        )}
      </form.Field>

      <form.Field
        name="email"
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">Email <span className="text-slate-400 font-normal ml-1">(Opsional)</span></label>
            <input
              id={field.name}
              name={field.name}
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="staff@contoh.com"
            />
          </div>
        )}
      </form.Field>

      <form.Field
        name="phone"
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">No. Telepon <span className="text-slate-400 font-normal ml-1">(Opsional)</span></label>
            <input
              id={field.name}
              name={field.name}
              type="tel"
              value={field.state.value}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, "");
                field.handleChange(numericValue);
              }}
              className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Contoh: 08123456789"
            />
          </div>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => (!initialData && (!value || value.length < 6) ? "Password minimal 6 karakter" : undefined),
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-2">
            <label htmlFor={field.name} className="text-sm font-semibold text-slate-700">
              Password {initialData ? <span className="text-slate-400 font-normal ml-1">(Opsional)</span> : <span className="text-red-500">*</span>}
            </label>
            <input
              id={field.name}
              name={field.name}
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                field.state.meta.errors.length ? "border-red-500 ring-red-500/20 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200"
              }`}
              placeholder={initialData ? "Kosongkan jika tidak ingin mengubah" : "Minimal 6 karakter"}
            />
            {field.state.meta.errors ? (
              <span className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                {field.state.meta.errors.join(", ")}
              </span>
            ) : null}
          </div>
        )}
      </form.Field>

      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50 sticky bottom-0">
        <Button 
          type="submit" 
          disabled={isPending} 
          className="flex h-12 items-center gap-2 rounded-xl bg-primary px-8 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {initialData ? "Simpan Perubahan" : "Buat Staff"}
        </Button>
      </div>
    </form>
  );
}
