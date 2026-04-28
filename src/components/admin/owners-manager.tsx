"use client";

import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Pencil, Phone, Plus, RefreshCw, Trash2, UserRound } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
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
  ItemTitle,
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
  all: ["admin", "owners"] as const,
};

const vendorOptionKeys = {
  all: ["admin", "vendors", "options"] as const,
};

const defaultOwnerValues: OwnerFormValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  vendorId: "",
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
    vendorId: owner.vendorId ?? "",
  };
}

function toOwnerPayload(
  values: OwnerFormValues,
  isEditing: boolean
): OwnerCreatePayload | OwnerUpdatePayload {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || undefined,
    vendorId: values.vendorId,
    password: isEditing ? values.password.trim() || undefined : values.password,
  };
}

function validateOwnerPassword(value: string, isEditing: boolean) {
  const trimmedValue = value.trim();

  if (!isEditing) {
    if (!trimmedValue) {
      return "Password wajib diisi.";
    }

    if (trimmedValue.length < 6) {
      return "Password minimal 6 karakter.";
    }

    return undefined;
  }

  if (trimmedValue && trimmedValue.length < 6) {
    return "Password baru minimal 6 karakter.";
  }

  return undefined;
}

function validateNewOwnerPassword(value: string) {
  return validateOwnerPassword(value, false);
}

function validateEditedOwnerPassword(value: string) {
  return validateOwnerPassword(value, true);
}

function VendorCombobox({
  vendors,
  value,
  onChange,
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
      <ComboboxInput
        placeholder="Cari vendor"
        className="w-full"
        showClear
      />
      <ComboboxContent className="w-full">
        <ComboboxEmpty>Vendor tidak ditemukan.</ComboboxEmpty>
        <ComboboxList>
          {(vendor) => (
            <ComboboxItem key={vendor.id} value={vendor}>
              <Item size="xs" className="p-0">
                <ItemContent>
                  <ItemTitle>{vendor.name}</ItemTitle>
                  <ItemDescription>{vendor.email ?? "Tanpa email vendor"}</ItemDescription>
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
    queryFn: () => readJson<OwnerRecord[]>("/api/admin/owners"),
  });

  const vendorsQuery = useQuery({
    queryKey: vendorOptionKeys.all,
    queryFn: async () => {
      const vendors = await readJson<VendorOption[]>("/api/admin/vendors");
      return vendors;
    },
  });

  const owners = ownersQuery.data ?? EMPTY_OWNERS;
  const vendors = vendorsQuery.data ?? EMPTY_VENDORS;
  const form = useForm({
    defaultValues: defaultOwnerValues,
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      setSubmitSuccess(null);

      const payload = toOwnerPayload(value, Boolean(editingOwnerId));
      if (editingOwnerId) {
        await updateOwnerMutation.mutateAsync({
          id: editingOwnerId,
          payload,
        });
        setSubmitSuccess("Data owner berhasil diperbarui.");
      } else {
        await createOwnerMutation.mutateAsync(payload as OwnerCreatePayload);
        setSubmitSuccess("Owner baru berhasil ditambahkan.");
      }

      setEditingOwnerId(null);
      form.reset(defaultOwnerValues);
    },
  });

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const selectedVendorId = useStore(form.store, (state) => state.values.vendorId);
  const selectedVendor =
    vendors.find((vendor) => vendor.id === selectedVendorId) ?? null;

  const createOwnerMutation = useMutation({
    mutationFn: (payload: OwnerCreatePayload) =>
      readJson<OwnerRecord>("/api/admin/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ownerKeys.all });
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

  const updateOwnerMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: OwnerUpdatePayload;
    }) =>
      readJson<OwnerRecord>(`/api/admin/owners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ownerKeys.all });
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

  const deleteOwnerMutation = useMutation({
    mutationFn: (id: string) =>
      readJson<{ message: string }>(`/api/admin/owners/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ownerKeys.all });
      setSubmitSuccess("Owner berhasil dihapus.");
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.75fr)]">
      <section id="manage" className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Daftar Owner</h2>
            <p className="text-sm text-muted-foreground">
              Hubungkan akun owner ke vendor yang mereka kelola.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => ownersQuery.refetch()}
            disabled={ownersQuery.isFetching}
          >
            <RefreshCw className={cn("size-4", ownersQuery.isFetching && "animate-spin")} />
            Muat Ulang
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-[1.5rem]" />
            <Skeleton className="h-24 w-full rounded-[1.5rem]" />
            <Skeleton className="h-24 w-full rounded-[1.5rem]" />
          </div>
        ) : loadingError ? (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadingError}
          </div>
        ) : owners.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
            <UserRound className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">Belum ada owner.</p>
            <p className="text-sm text-muted-foreground">
              Tambahkan akun owner untuk vendor yang sudah ada.
            </p>
          </div>
        ) : (
          <ItemGroup>
            {owners.map((owner) => (
              <Item
                key={owner.id}
                variant={editingOwnerId === owner.id ? "muted" : "outline"}
                className="rounded-[1.5rem] border-border/70 p-4"
              >
                <ItemHeader className="items-start">
                  <div className="flex items-start gap-3">
                    <ItemMedia variant="icon" className="mt-1 rounded-2xl bg-primary/10 p-2 text-primary">
                      <UserRound className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{owner.name}</ItemTitle>
                      <ItemDescription>
                        {owner.vendor?.name ?? "Vendor belum terhubung"}
                      </ItemDescription>
                    </ItemContent>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    OWNER
                  </span>
                </ItemHeader>

                <div className="grid w-full gap-3 text-sm text-muted-foreground md:grid-cols-2">
                  <div className="rounded-2xl bg-muted/40 px-3 py-2">
                    <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                      <Mail className="size-4" />
                      Email
                    </div>
                    <div>{owner.email ?? "-"}</div>
                  </div>
                  <div className="rounded-2xl bg-muted/40 px-3 py-2">
                    <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                      <Phone className="size-4" />
                      Telepon
                    </div>
                    <div>{owner.phone ?? "-"}</div>
                  </div>
                </div>

                <ItemActions className="ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => startEditOwner(owner)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setOwnerToDelete(owner)}
                    disabled={deleteOwnerMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                    Hapus
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </section>

      <section className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {editingOwnerId ? "Edit Owner" : "Tambah Owner"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Owner baru wajib memiliki password minimal 6 karakter.
            </p>
          </div>
          {editingOwnerId ? (
            <Button
              type="button"
              variant="ghost"
              onClick={resetOwnerForm}
            >
              <Plus className="size-4" />
              Mode Baru
            </Button>
          ) : null}
        </div>

        {submitError ? (
          <div className="mb-4 rounded-3xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        ) : null}
        {submitSuccess ? (
          <div className="mb-4 rounded-3xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            {submitSuccess}
          </div>
        ) : null}

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldSet>
            <FieldGroup className="gap-5">
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    value.trim().length < 3 ? "Nama owner minimal 3 karakter." : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Nama Lengkap</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Budi Santoso"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
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

                    return /^\S+@\S+\.\S+$/.test(value)
                      ? undefined
                      : "Format email tidak valid.";
                  },
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Email Login</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="owner@travel.com"
                      />
                      <FieldDescription>Email ini akan dipakai untuk login owner.</FieldDescription>
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="phone">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Nomor Telepon</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="081122334455"
                      />
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="vendorId"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Vendor wajib dipilih." : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel>Vendor</FieldLabel>
                    <FieldContent>
                      <VendorCombobox
                        vendors={vendors}
                        value={selectedVendor}
                        onChange={(value) => field.handleChange(value?.id ?? "")}
                      />
                      <FieldDescription>
                        Cari vendor dengan keyboard. Dropdown menampilkan nama dan email vendor.
                      </FieldDescription>
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              {editingOwnerId ? (
                <form.Field
                  key="edit-password"
                  name="password"
                  validators={{
                    onChange: ({ value }) => validateEditedOwnerPassword(value),
                    onSubmit: ({ value }) => validateEditedOwnerPassword(value),
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Password Baru</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Kosongkan bila tidak diubah"
                        />
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              ) : (
                <form.Field
                  key="create-password"
                  name="password"
                  validators={{
                    onChange: ({ value }) => validateNewOwnerPassword(value),
                    onSubmit: ({ value }) => validateNewOwnerPassword(value),
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Minimal 6 karakter"
                        />
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              )}
            </FieldGroup>
          </FieldSet>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetOwnerForm}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingOwnerId ? "Simpan Perubahan" : "Tambah Owner"}
            </Button>
          </div>
        </form>
      </section>

      <AlertDialog
        open={Boolean(ownerToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setOwnerToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus owner?</AlertDialogTitle>
            <AlertDialogDescription>
              {ownerToDelete
                ? `Akun owner ${ownerToDelete.name} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                : "Akun owner akan dihapus permanen."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOwnerMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                void confirmDeleteOwner();
              }}
              disabled={deleteOwnerMutation.isPending}
            >
              Hapus Owner
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
