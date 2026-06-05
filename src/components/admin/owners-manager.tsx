"use client";

import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Mail, 
  Pencil, 
  Phone, 
  Plus, 
  RefreshCw, 
  Trash2, 
  UserRound,
  UserCheck,
  Building2,
  Lock,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  UserX
} from "lucide-react";

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
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { OwnerCreatePayload, OwnerUpdatePayload } from "@/types/owner-api";

type VendorOption = {
  id: string;
  name: string;
  slug: string;
  email?: string | null;
};

type OwnerRecord = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: "OWNER";
  isActive: boolean;
  vendorId?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: VendorOption | null;
};

type OwnerFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  vendorId: string;
};

const ownerKeys = {
  all: ["admin", "owners"] as const
};

const vendorOptionKeys = {
  all: ["admin", "vendors", "options"] as const
};

const defaultOwnerValues: OwnerFormValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  vendorId: ""
};

const EMPTY_OWNERS: OwnerRecord[] = [];
const EMPTY_VENDORS: VendorOption[] = [];

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : "Request gagal diproses"
    );
  }

  return data as T;
}

function toFieldErrors(errors: unknown[] | undefined) {
  return (errors ?? []).map((error) =>
    typeof error === "string" ? { message: error } : undefined
  );
}

function toOwnerFormValues(owner?: OwnerRecord | null): OwnerFormValues {
  if (!owner) {
    return defaultOwnerValues;
  }

  return {
    name: owner.name ?? "",
    email: owner.email ?? "",
    phone: owner.phone ?? "",
    password: "",
    vendorId: owner.vendorId ?? ""
  };
}

function toOwnerPayload(values: OwnerFormValues): OwnerCreatePayload | OwnerUpdatePayload {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || undefined,
    vendorId: values.vendorId
  };
}

function validateEditedOwnerPassword(value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue && trimmedValue.length < 6) {
    return "Password baru minimal 6 karakter.";
  }
  return undefined;
}

function VendorCombobox({
  vendors,
  value,
  onChange
}: {
  vendors: VendorOption[];
  value: VendorOption | null;
  onChange: (value: VendorOption | null) => void;
}) {
  return (
    <Combobox
      items={vendors}
      value={value}
      onValueChange={onChange}
      itemToStringValue={(vendor) => vendor?.id ?? ""}
      itemToStringLabel={(vendor) => vendor?.name ?? ""}
      id="owner-vendor"
    >
      <ComboboxInput placeholder="Cari vendor" className="w-full text-xs rounded-xl h-9.5 border-slate-200 focus:border-teal-500 focus:ring-teal-500/20" showClear />
      <ComboboxContent className="w-full max-h-60 overflow-y-auto">
        <ComboboxEmpty className="text-slate-400 text-xs italic py-2">Vendor tidak ditemukan.</ComboboxEmpty>
        <ComboboxList>
          {(vendor) => (
            <ComboboxItem key={vendor.id} value={vendor} className="data-highlighted:bg-teal-50 data-highlighted:text-teal-700">
              <Item size="xs" className="p-0">
                <ItemContent>
                  <ItemTitle className="font-semibold text-xs">{vendor.name}</ItemTitle>
                  <ItemDescription className="text-[10px] text-slate-400">{vendor.email ?? "Tanpa email vendor"}</ItemDescription>
                </ItemContent>
              </Item>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function OwnersManager() {
  const queryClient = useQueryClient();
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [ownerToDelete, setOwnerToDelete] = useState<OwnerRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const ownersQuery = useQuery({
    queryKey: ownerKeys.all,
    queryFn: () => readJson<OwnerRecord[]>("/api/admin/owners")
  });

  const vendorsQuery = useQuery({
    queryKey: [...vendorOptionKeys.all, { noOwner: !editingOwnerId }],
    queryFn: async () => {
      const url = editingOwnerId ? "/api/admin/vendors" : "/api/admin/vendors?noOwner=true";
      const vendors = await readJson<VendorOption[]>(url);
      return vendors;
    }
  });

  const owners = ownersQuery.data ?? EMPTY_OWNERS;
  const vendors = vendorsQuery.data ?? EMPTY_VENDORS;
  const form = useForm({
    defaultValues: defaultOwnerValues,
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      setSubmitSuccess(null);

      const payload = toOwnerPayload(value);
      if (editingOwnerId) {
        await updateOwnerMutation.mutateAsync({
          id: editingOwnerId,
          payload
        });
        setSubmitSuccess("Data owner berhasil diperbarui.");
      } else {
        await createOwnerMutation.mutateAsync(payload as OwnerCreatePayload);
        setSubmitSuccess("Owner baru berhasil ditambahkan.");
      }

      setEditingOwnerId(null);
      form.reset(defaultOwnerValues);
    }
  });

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const selectedVendorId = useStore(form.store, (state) => state.values.vendorId);
  const selectedVendor = vendors.find((vendor) => vendor.id === selectedVendorId) ?? null;

  const createOwnerMutation = useMutation({
    mutationFn: (payload: OwnerCreatePayload) =>
      readJson<OwnerRecord>("/api/admin/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    onSuccess: async () => {
      await invalidateOwnersAndVendorOptions();
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    }
  });

  const updateOwnerMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: OwnerUpdatePayload }) =>
      readJson<OwnerRecord>(`/api/admin/owners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    onSuccess: async () => {
      await invalidateOwnersAndVendorOptions();
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    }
  });

  const deleteOwnerMutation = useMutation({
    mutationFn: (id: string) =>
      readJson<{ message: string }>(`/api/admin/owners/${id}`, {
        method: "DELETE"
      }),
    onSuccess: async () => {
      await invalidateOwnersAndVendorOptions();
      setSubmitSuccess("Owner berhasil dihapus.");
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    }
  });

  async function invalidateOwnersAndVendorOptions() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ownerKeys.all }),
      queryClient.invalidateQueries({ queryKey: vendorOptionKeys.all })
    ]);
  }

  function resetOwnerForm() {
    setEditingOwnerId(null);
    form.reset(defaultOwnerValues);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function populateOwnerForm(values: OwnerFormValues) {
    form.setFieldValue("name", values.name);
    form.setFieldValue("email", values.email);
    form.setFieldValue("phone", values.phone);
    form.setFieldValue("password", values.password);
    form.setFieldValue("vendorId", values.vendorId);
  }

  function startEditOwner(owner: OwnerRecord) {
    setEditingOwnerId(owner.id);
    const values = toOwnerFormValues(owner);
    form.reset(values);
    populateOwnerForm(values);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  async function confirmDeleteOwner() {
    if (!ownerToDelete) {
      return;
    }

    await deleteOwnerMutation.mutateAsync(ownerToDelete.id);
    if (editingOwnerId === ownerToDelete.id) {
      resetOwnerForm();
    }
    setOwnerToDelete(null);
  }

  const loading = ownersQuery.isLoading || vendorsQuery.isLoading;
  const loadingError = ownersQuery.error?.message || vendorsQuery.error?.message;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
      {/* LEFT SECTION: LIST OF OWNERS */}
      <section id="manage" className="border border-slate-100 bg-white rounded-3xl p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserRound className="text-teal-600 size-5" />
              Daftar Eksekutif Owner
            </h2>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              Hubungkan akun pemilik (Owner) ke vendor travel terdaftar untuk manajemen armada secara mandiri.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => ownersQuery.refetch()}
            disabled={ownersQuery.isFetching}
            className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs h-9.5"
          >
            <RefreshCw className={cn("size-3.5 mr-1.5", ownersQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : loadingError ? (
          <div className="border border-red-200 bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-xs font-bold">
            {loadingError}
          </div>
        ) : owners.length === 0 ? (
          <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl px-5 py-12 text-center">
            <UserRound className="text-slate-400 mx-auto mb-3 size-12" />
            <p className="font-bold text-slate-800">Belum Ada Akun Owner</p>
            <p className="text-slate-400 text-xs mt-1">
              Tambahkan akun eksekutif pertama menggunakan form di samping.
            </p>
          </div>
        ) : (
          <div className="space-y-4.5">
            {owners.map((owner) => (
              <div
                key={owner.id}
                className={cn(
                  "border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden group hover:shadow-md",
                  editingOwnerId === owner.id 
                    ? "border-teal-200 bg-teal-50/10" 
                    : "border-slate-100 bg-white hover:border-slate-200"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3.5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600 transition-colors group-hover:bg-teal-50 group-hover:text-teal-600">
                      <UserRound className="size-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 transition-colors group-hover:text-teal-600">
                        {owner.name}
                      </h4>
                      <p className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                        <Building2 size={12} className="text-slate-300" />
                        {owner.vendor?.name ?? "Vendor Belum Terhubung"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-teal-50 text-teal-700 border border-teal-100 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      OWNER
                    </span>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider",
                      owner.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {owner.isActive ? "Aktif" : "Menunggu Aktivasi"}
                    </span>
                  </div>
                </div>

                {/* Owner contact details */}
                <div className="grid gap-4 md:grid-cols-2 bg-slate-50/50 border border-slate-100/50 rounded-2xl p-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Mail className="size-3.5 text-slate-400" />
                      Email Login
                    </div>
                    <div className="text-slate-700 font-semibold text-xs">
                      {owner.email ?? "-"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Phone className="size-3.5 text-slate-400" />
                      Nomor Telepon
                    </div>
                    <div className="text-slate-700 font-semibold text-xs">
                      {owner.phone ?? "-"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end border-t border-slate-50 pt-3 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => startEditOwner(owner)}
                    className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs h-8 px-3"
                  >
                    <Pencil className="size-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setOwnerToDelete(owner)}
                    disabled={deleteOwnerMutation.isPending}
                    className="rounded-xl font-bold text-xs h-8 px-3"
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RIGHT SECTION: FORM (CREATE / EDIT) */}
      <section className="border border-slate-100 bg-white rounded-3xl p-6 shadow-sm h-fit">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-50 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {editingOwnerId ? (
                <>
                  <Settings className="text-amber-500 size-5" />
                  Edit Akun Owner
                </>
              ) : (
                <>
                  <Plus className="text-teal-600 size-5" />
                  Tambah Owner Baru
                </>
              )}
            </h2>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              {editingOwnerId
                ? "Perbarui detail akun eksekutif."
                : "Owner baru akan menerima kredensial masuk untuk mengelola portal travel."}
            </p>
          </div>
          {editingOwnerId && (
            <Button 
              type="button" 
              variant="ghost" 
              size="xs"
              onClick={resetOwnerForm}
              className="font-bold text-teal-600 hover:bg-teal-50 rounded-xl"
            >
              Mode Baru
            </Button>
          )}
        </div>

        {submitError && (
          <div className="border border-red-200 bg-red-50 text-red-700 mb-4 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            {submitError}
          </div>
        )}
        {submitSuccess && (
          <div className="border border-emerald-200 bg-emerald-50 text-emerald-700 mb-4 rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {submitSuccess}
          </div>
        )}

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldSet className="space-y-5">
            <FieldGroup className="gap-5">
              
              {/* SECTION A: DATA PENGGUNA */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <UserRound size={13} className="text-slate-300" />
                  Data Pengguna
                </h3>

                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      value.trim().length < 3 ? "Nama owner minimal 3 karakter." : undefined
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Nama Lengkap</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Budi Santoso"
                          className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                        />
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>

                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) {
                        return "Email wajib diisi.";
                      }

                      return /^\S+@\S+\.\S+$/.test(value) ? undefined : "Format email tidak valid.";
                    }
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Email Login</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="owner@travel.com"
                          className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                        />
                        <FieldDescription className="text-[10px] text-slate-400 mt-1">Digunakan untuk login di panel eksekutif.</FieldDescription>
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="phone">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Nomor Telepon</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="081122334455"
                          className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <hr className="border-slate-100" />

              {/* SECTION B: HUBUNGKAN VENDOR */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-300" />
                  Hubungkan ke Vendor
                </h3>

                <form.Field
                  name="vendorId"
                  validators={{
                    onChange: ({ value }) => (!value ? "Vendor wajib dipilih." : undefined)
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel className="text-xs font-bold text-slate-700 mb-1">Pilih Vendor Mitra</FieldLabel>
                      <FieldContent>
                        <VendorCombobox
                          vendors={vendors}
                          value={selectedVendor}
                          onChange={(value) => field.handleChange(value?.id ?? "")}
                        />
                        <FieldDescription className="text-[10px] text-slate-400 mt-1">
                          Satu akun owner hanya dapat terhubung ke satu vendor mitra.
                        </FieldDescription>
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>

                {editingOwnerId && (
                  <form.Field
                    key="edit-password"
                    name="password"
                    validators={{
                      onChange: ({ value }) => validateEditedOwnerPassword(value),
                      onSubmit: ({ value }) => validateEditedOwnerPassword(value)
                    }}
                  >
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Ganti Password</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            type="password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="Kosongkan bila tidak diubah"
                            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                          />
                          <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
                        </FieldContent>
                      </Field>
                    )}
                  </form.Field>
                )}
              </div>

            </FieldGroup>
          </FieldSet>

          <div className="flex items-center justify-end gap-3 border-t border-slate-50 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={resetOwnerForm}
              className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 h-9.5 text-xs px-4"
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-white h-9.5 text-xs px-4"
            >
              {editingOwnerId ? "Simpan Perubahan" : "Tambah Owner"}
            </Button>
          </div>
        </form>
      </section>

      {/* DELETE DIALOG */}
      <AlertDialog
        open={Boolean(ownerToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setOwnerToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-50 text-red-500 rounded-2xl p-2.5 w-fit mx-auto mb-2">
              <UserX className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-center font-extrabold text-slate-800">Hapus Akun Owner?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-xs">
              {ownerToDelete
                ? `Akun owner "${ownerToDelete.name}" akan dihapus permanen. Mereka tidak akan dapat mengakses panel eksekutif vendor.`
                : "Akun owner akan dihapus permanen."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel disabled={deleteOwnerMutation.isPending} className="rounded-xl border-slate-200 text-slate-500 font-bold text-xs h-9.5">Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                void confirmDeleteOwner();
              }}
              disabled={deleteOwnerMutation.isPending}
              className="rounded-xl font-bold text-xs h-9.5 bg-red-600 hover:bg-red-700"
            >
              Hapus Owner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
