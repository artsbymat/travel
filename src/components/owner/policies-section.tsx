"use client";

import { useMemo, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";

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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  VendorPolicyCreatePayload,
  VendorPolicyRecord,
  VendorPolicyType,
  VendorPolicyUpdatePayload
} from "@/types/owner-vendor-api";

const POLICY_OPTIONS: { value: VendorPolicyType; label: string; hint: string }[] = [
  { value: "CANCELLATION", label: "Pembatalan", hint: "Aturan saat penumpang membatalkan." },
  { value: "RESCHEDULE", label: "Reschedule", hint: "Aturan ubah jadwal." },
  { value: "REFUND", label: "Refund (umum)", hint: "Kebijakan pengembalian dana." },
  { value: "LUGGAGE", label: "Bagasi", hint: "Batas dan aturan bagasi." },
  { value: "DEPARTURE", label: "Keberangkatan", hint: "Aturan keberangkatan & keterlambatan." },
  { value: "DISCLAIMER", label: "Disclaimer", hint: "Pernyataan & batas tanggung jawab." },
  { value: "OTHER", label: "Lainnya", hint: "Aturan tambahan vendor." }
];

const POLICY_LABELS = Object.fromEntries(POLICY_OPTIONS.map((o) => [o.value, o.label])) as Record<
  VendorPolicyType,
  string
>;

type FormValues = {
  type: VendorPolicyType;
  title: string;
  content: string;
  order: string;
  isActive: boolean;
};

const policyKeys = {
  all: ["owner", "vendor", "policies"] as const
};

const defaultValues: FormValues = {
  type: "CANCELLATION",
  title: "",
  content: "",
  order: "0",
  isActive: true
};

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

function toFormValues(policy?: VendorPolicyRecord | null): FormValues {
  if (!policy) return defaultValues;
  return {
    type: policy.type as VendorPolicyType,
    title: policy.title,
    content: policy.content,
    order: String(policy.order ?? 0),
    isActive: policy.isActive
  };
}

function toPayload(values: FormValues): VendorPolicyCreatePayload {
  return {
    type: values.type,
    title: values.title.trim(),
    content: values.content.trim(),
    order: Number(values.order) || 0,
    isActive: values.isActive
  };
}

export function PoliciesSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<VendorPolicyRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const policiesQuery = useQuery({
    queryKey: policyKeys.all,
    queryFn: () => readJson<VendorPolicyRecord[]>("/api/owner/vendor/policies")
  });

  const policies = policiesQuery.data ?? [];
  const editingPolicy = useMemo(
    () => policies.find((p) => p.id === editingId) ?? null,
    [policies, editingId]
  );

  const createMutation = useMutation({
    mutationFn: (payload: VendorPolicyCreatePayload) =>
      readJson<VendorPolicyRecord>("/api/owner/vendor/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
      setOpen(false);
    },
    onError: (e: unknown) => setSubmitError(e instanceof Error ? e.message : "Gagal")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VendorPolicyUpdatePayload }) =>
      readJson<VendorPolicyRecord>(`/api/owner/vendor/policies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
      setOpen(false);
      setEditingId(null);
    },
    onError: (e: unknown) => setSubmitError(e instanceof Error ? e.message : "Gagal")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      readJson<{ message: string }>(`/api/owner/vendor/policies/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: policyKeys.all });
      setToDelete(null);
    }
  });

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      const payload = toPayload(value);
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
    }
  });

  const formType = useStore(form.store, (s) => s.values.type);

  function handleOpenCreate() {
    setEditingId(null);
    setSubmitError(null);
    form.reset(defaultValues);
    setOpen(true);
  }

  function handleOpenEdit(policy: VendorPolicyRecord) {
    setEditingId(policy.id);
    setSubmitError(null);
    form.reset(toFormValues(policy));
    setOpen(true);
  }

  function handleSheetOpenChange(next: boolean) {
    if (!next) {
      setEditingId(null);
      setSubmitError(null);
    }
    setOpen(next);
  }

  return (
    <section id="policies" className="border-border/70 bg-card rounded-[2rem] border p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
            <FileText className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold">Kebijakan Vendor</h2>
            <p className="text-muted-foreground text-xs">
              Atur peraturan, privasi, bagasi, dan pernyataan vendor.
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Tambah kebijakan
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {policiesQuery.isPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))
        ) : policies.length === 0 ? (
          <div className="border-border/60 rounded-2xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Belum ada kebijakan. Tambahkan minimal satu kebijakan untuk pelanggan.
            </p>
          </div>
        ) : (
          policies.map((policy) => (
            <article
              key={policy.id}
              className={cn(
                "group bg-card/40 rounded-2xl border p-4 transition",
                policy.isActive ? "border-border/60" : "border-border/30 opacity-60"
              )}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-primary/10 text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                      {POLICY_LABELS[policy.type as VendorPolicyType] ?? policy.type}
                    </span>
                    {!policy.isActive && (
                      <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                        Nonaktif
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs">Urutan {policy.order}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{policy.title}</h3>
                  <p className="text-muted-foreground mt-1 line-clamp-3 text-xs leading-relaxed whitespace-pre-line">
                    {policy.content}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(policy)}>
                    <Pencil className="size-3.5" />
                    Ubah
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setToDelete(policy)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg!">
          <SheetHeader className="border-b">
            <SheetTitle>{editingId ? "Ubah Kebijakan" : "Tambah Kebijakan"}</SheetTitle>
            <SheetDescription>
              Tuliskan kebijakan dengan jelas agar pelanggan memahami aturan vendor.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="flex flex-1 flex-col gap-6 p-6"
          >
            <FieldSet>
              <FieldGroup>
                <form.Field name="type">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="policy-type">Tipe Kebijakan *</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v as VendorPolicyType)}
                      >
                        <SelectTrigger id="policy-type">
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                        <SelectContent>
                          {POLICY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        {POLICY_OPTIONS.find((o) => o.value === formType)?.hint}
                      </FieldDescription>
                    </Field>
                  )}
                </form.Field>

                <form.Field
                  name="title"
                  validators={{
                    onChange: ({ value }) =>
                      value.trim().length < 3 ? "Judul minimal 3 karakter." : undefined
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Judul *</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Kebijakan Pembatalan Tiket"
                      />
                      <FieldError
                        errors={(field.state.meta.errors ?? []).map((err) =>
                          typeof err === "string" ? { message: err } : undefined
                        )}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field
                  name="content"
                  validators={{
                    onChange: ({ value }) =>
                      value.trim().length < 10 ? "Isi minimal 10 karakter." : undefined
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Isi Kebijakan *</FieldLabel>
                      <Textarea
                        id={field.name}
                        rows={8}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Tuliskan kebijakan dengan rinci..."
                      />
                      <FieldDescription>
                        Mendukung baris baru. Tampil di halaman publik vendor.
                      </FieldDescription>
                      <FieldError
                        errors={(field.state.meta.errors ?? []).map((err) =>
                          typeof err === "string" ? { message: err } : undefined
                        )}
                      />
                    </Field>
                  )}
                </form.Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <form.Field name="order">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Urutan tampil</FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          min="0"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="isActive">
                    {(field) => (
                      <Field>
                        <FieldLabel>Status</FieldLabel>
                        <button
                          type="button"
                          onClick={() => field.handleChange(!field.state.value)}
                          className={cn(
                            "flex h-12 items-center justify-between rounded-2xl border px-4 text-sm transition",
                            field.state.value
                              ? "border-primary/40 bg-primary/5"
                              : "border-border/60 bg-card"
                          )}
                        >
                          <span className="font-medium">
                            {field.state.value ? "Aktif" : "Nonaktif"}
                          </span>
                          <span
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition",
                              field.state.value ? "bg-primary" : "bg-muted"
                            )}
                          >
                            <span
                              className={cn(
                                "absolute size-4 rounded-full bg-white shadow transition-all",
                                field.state.value ? "left-6" : "left-1"
                              )}
                            />
                          </span>
                        </button>
                      </Field>
                    )}
                  </form.Field>
                </div>
              </FieldGroup>
            </FieldSet>

            {submitError && (
              <p className="text-destructive border-destructive/30 bg-destructive/5 rounded-xl border p-3 text-sm">
                {submitError}
              </p>
            )}

            <SheetFooter className="bg-background/80 -mx-6 mt-auto -mb-6 border-t px-6 py-4 backdrop-blur">
              <div className="flex w-full justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSheetOpenChange(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Menyimpan..."
                    : editingPolicy
                      ? "Simpan perubahan"
                      : "Tambah kebijakan"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus kebijakan?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.title} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
