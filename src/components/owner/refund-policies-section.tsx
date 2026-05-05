"use client";

import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";

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
import { cn } from "@/lib/utils";
import type {
  VendorRefundPolicyCreatePayload,
  VendorRefundPolicyRecord,
  VendorRefundPolicyUpdatePayload
} from "@/types/owner-vendor-api";

type FormValues = {
  hoursBeforeDeparture: string;
  refundPercentage: string;
  description: string;
  isActive: boolean;
};

const refundKeys = {
  all: ["owner", "vendor", "refund-policies"] as const
};

const defaultValues: FormValues = {
  hoursBeforeDeparture: "24",
  refundPercentage: "50",
  description: "",
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

function toFormValues(record?: VendorRefundPolicyRecord | null): FormValues {
  if (!record) return defaultValues;
  return {
    hoursBeforeDeparture: String(record.hoursBeforeDeparture),
    refundPercentage: String(record.refundPercentage),
    description: record.description ?? "",
    isActive: record.isActive
  };
}

function toPayload(values: FormValues): VendorRefundPolicyCreatePayload {
  return {
    hoursBeforeDeparture: Number(values.hoursBeforeDeparture),
    refundPercentage: Number(values.refundPercentage),
    description: values.description.trim() || null,
    isActive: values.isActive
  };
}

export function RefundPoliciesSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<VendorRefundPolicyRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: refundKeys.all,
    queryFn: () => readJson<VendorRefundPolicyRecord[]>("/api/owner/vendor/refund-policies")
  });

  const tiers = query.data ?? [];
  const editing = useMemo(() => tiers.find((t) => t.id === editingId) ?? null, [tiers, editingId]);

  const createMutation = useMutation({
    mutationFn: (payload: VendorRefundPolicyCreatePayload) =>
      readJson<VendorRefundPolicyRecord>("/api/owner/vendor/refund-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
      setOpen(false);
    },
    onError: (e: unknown) => setSubmitError(e instanceof Error ? e.message : "Gagal")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VendorRefundPolicyUpdatePayload }) =>
      readJson<VendorRefundPolicyRecord>(`/api/owner/vendor/refund-policies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
      setOpen(false);
      setEditingId(null);
    },
    onError: (e: unknown) => setSubmitError(e instanceof Error ? e.message : "Gagal")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      readJson<{ message: string }>(`/api/owner/vendor/refund-policies/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundKeys.all });
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

  function handleOpenCreate() {
    setEditingId(null);
    setSubmitError(null);
    form.reset(defaultValues);
    setOpen(true);
  }

  function handleOpenEdit(t: VendorRefundPolicyRecord) {
    setEditingId(t.id);
    setSubmitError(null);
    form.reset(toFormValues(t));
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
    <section
      id="refund-tiers"
      className="border-border/70 bg-card rounded-[2rem] border p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
            <Receipt className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold">Aturan Refund Bertingkat</h2>
            <p className="text-muted-foreground text-xs">
              Tentukan persentase refund berdasarkan waktu pembatalan sebelum keberangkatan.
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Tambah tier
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {query.isPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : tiers.length === 0 ? (
          <div className="border-border/60 rounded-2xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Belum ada aturan refund. Tambahkan minimal satu tier.
            </p>
          </div>
        ) : (
          tiers.map((tier) => (
            <article
              key={tier.id}
              className={cn(
                "bg-card/40 flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between",
                tier.isActive ? "border-border/60" : "border-border/30 opacity-60"
              )}
            >
              <div className="flex flex-1 items-center gap-4">
                <div className="bg-primary/10 text-primary flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl">
                  <span className="text-base leading-none font-bold">{tier.refundPercentage}%</span>
                  <span className="mt-0.5 text-[9px] tracking-wider uppercase">refund</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Pembatalan ≥ {tier.hoursBeforeDeparture} jam sebelum keberangkatan
                  </p>
                  {tier.description && (
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      {tier.description}
                    </p>
                  )}
                  {!tier.isActive && (
                    <span className="bg-muted text-muted-foreground mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                      Nonaktif
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(tier)}>
                  <Pencil className="size-3.5" />
                  Ubah
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setToDelete(tier)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md!">
          <SheetHeader className="border-b">
            <SheetTitle>{editingId ? "Ubah Tier Refund" : "Tambah Tier Refund"}</SheetTitle>
            <SheetDescription>
              Refund bertingkat memberikan transparansi pada pelanggan.
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
                <form.Field
                  name="hoursBeforeDeparture"
                  validators={{
                    onChange: ({ value }) => {
                      const n = Number(value);
                      if (!Number.isInteger(n) || n < 0) return "Harus bilangan bulat ≥ 0.";
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Jam sebelum keberangkatan *</FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        min="0"
                        step="1"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldDescription>
                        Pembatalan minimal sekian jam sebelum berangkat untuk dapat persentase ini.
                      </FieldDescription>
                      <FieldError
                        errors={(field.state.meta.errors ?? []).map((err) =>
                          typeof err === "string" ? { message: err } : undefined
                        )}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field
                  name="refundPercentage"
                  validators={{
                    onChange: ({ value }) => {
                      const n = Number(value);
                      if (Number.isNaN(n) || n < 0 || n > 100) return "Persentase 0 - 100.";
                      return undefined;
                    }
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Persentase refund (%) *</FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError
                        errors={(field.state.meta.errors ?? []).map((err) =>
                          typeof err === "string" ? { message: err } : undefined
                        )}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Catatan (opsional)</FieldLabel>
                      <Textarea
                        id={field.name}
                        rows={3}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Penjelasan tambahan untuk tier ini."
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
                    : editing
                      ? "Simpan perubahan"
                      : "Tambah tier"}
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
            <AlertDialogTitle>Hapus tier refund?</AlertDialogTitle>
            <AlertDialogDescription>
              Tier {toDelete?.hoursBeforeDeparture} jam ({toDelete?.refundPercentage}%) akan dihapus
              permanen.
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
