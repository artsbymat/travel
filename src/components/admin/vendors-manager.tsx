"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, RefreshCw, Trash2, Users, Bus } from "lucide-react";

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
  FieldTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Vendor, VendorCreatePayload, VendorUpdatePayload } from "@/types/vendor-api";

type Province = {
  id: string;
  name: string;
  code?: string;
};

type City = {
  id: string;
  name: string;
  code?: string;
  provinceId: string;
};

type VendorRecord = Vendor & {
  city?: City | null;
};

type VendorFormValues = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  provinceId: string;
  cityId: string;
  address: string;
  description: string;
  legalName: string;
  npwp: string;
  siup: string;
  taxEnabled: boolean;
  taxRate: string;
  taxName: string;
  platformFeeRate: string;
  acceptCash: boolean;
  isActive: boolean;
  isHeld: boolean;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
};

const vendorKeys = {
  all: ["admin", "vendors"] as const,
};

const regionKeys = {
  provinces: ["regions", "provinces"] as const,
  cities: ["regions", "cities"] as const,
};

const defaultVendorValues: VendorFormValues = {
  name: "",
  slug: "",
  email: "",
  phone: "",
  provinceId: "",
  cityId: "",
  address: "",
  description: "",
  legalName: "",
  npwp: "",
  siup: "",
  taxEnabled: false,
  taxRate: "",
  taxName: "PPN",
  platformFeeRate: "",
  acceptCash: true,
  isActive: true,
  isHeld: false,
  bankName: "",
  bankAccountNo: "",
  bankAccountName: "",
};

const EMPTY_VENDORS: VendorRecord[] = [];
const EMPTY_PROVINCES: Province[] = [];
const EMPTY_CITIES: City[] = [];

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toVendorFormValues(vendor?: VendorRecord | null, cities: City[] = []): VendorFormValues {
  if (!vendor) {
    return defaultVendorValues;
  }

  const selectedCity = cities.find((city) => city.id === vendor.cityId);

  return {
    name: vendor.name ?? "",
    slug: vendor.slug ?? "",
    email: vendor.email ?? "",
    phone: vendor.phone ?? "",
    provinceId: selectedCity?.provinceId ?? "",
    cityId: vendor.cityId ?? "",
    address: vendor.address ?? "",
    description: vendor.description ?? "",
    legalName: vendor.legalName ?? "",
    npwp: vendor.npwp ?? "",
    siup: vendor.siup ?? "",
    taxEnabled: vendor.taxEnabled ?? false,
    taxRate: vendor.taxRate != null ? String(vendor.taxRate) : "",
    taxName: vendor.taxName ?? "PPN",
    platformFeeRate:
      vendor.platformFeeRate != null ? String(vendor.platformFeeRate) : "",
    acceptCash: vendor.acceptCash ?? true,
    isActive: vendor.isActive ?? true,
    isHeld: vendor.isHeld ?? false,
    bankName: vendor.bankName ?? "",
    bankAccountNo: vendor.bankAccountNo ?? "",
    bankAccountName: vendor.bankAccountName ?? "",
  };
}

function toVendorPayload(values: VendorFormValues): VendorCreatePayload | VendorUpdatePayload {
  const taxEnabled = values.taxEnabled;

  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    email: values.email.trim() || undefined,
    phone: values.phone.trim() || undefined,
    cityId: values.cityId || undefined,
    address: values.address.trim() || undefined,
    description: values.description.trim() || undefined,
    legalName: values.legalName.trim() || undefined,
    npwp: values.npwp.trim() || undefined,
    siup: values.siup.trim() || undefined,
    taxEnabled,
    taxRate: taxEnabled && values.taxRate.trim() ? Number(values.taxRate) : undefined,
    taxName: taxEnabled ? values.taxName.trim() || "PPN" : undefined,
    platformFeeRate: values.platformFeeRate.trim()
      ? Number(values.platformFeeRate)
      : undefined,
    acceptCash: values.acceptCash,
    isActive: values.isActive,
    isHeld: values.isHeld,
    bankName: values.bankName.trim() || undefined,
    bankAccountNo: values.bankAccountNo.trim() || undefined,
    bankAccountName: values.bankAccountName.trim() || undefined,
  };
}

function formatNumber(value?: number) {
  if (value == null) {
    return "-";
  }

  return `${Number(value).toFixed(2)}%`;
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Field
      orientation="horizontal"
      className="items-start rounded-3xl border border-border/70 bg-background px-4 py-3"
    >
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
        className="mt-1 size-4 rounded border-border text-primary focus:ring-2 focus:ring-ring"
      />
      <FieldContent>
        <FieldTitle>{label}</FieldTitle>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
    </Field>
  );
}

function RegionCombobox<TItem extends { id: string; name: string }>({
  id,
  items,
  value,
  onChange,
  placeholder,
  emptyLabel,
  description,
  disabled = false,
}: {
  id: string;
  items: TItem[];
  value: TItem | null;
  onChange: (value: TItem | null) => void;
  placeholder: string;
  emptyLabel: string;
  description?: (item: TItem) => string;
  disabled?: boolean;
}) {
  return (
    <Combobox
      items={items}
      value={value}
      onValueChange={onChange}
      itemToStringValue={(item) => item?.id ?? ""}
      itemToStringLabel={(item) => item?.name ?? ""}
      id={id}
    >
      <ComboboxInput
        placeholder={placeholder}
        className="w-full"
        disabled={disabled}
        showClear
      />
      <ComboboxContent className="w-full">
        <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item}>
              <Item size="xs" className="p-0">
                <ItemContent>
                  <ItemTitle>{item.name}</ItemTitle>
                  {description ? (
                    <ItemDescription>{description(item)}</ItemDescription>
                  ) : null}
                </ItemContent>
              </Item>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function VendorsManager() {
  const queryClient = useQueryClient();
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<VendorRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const vendorsQuery = useQuery({
    queryKey: vendorKeys.all,
    queryFn: () => readJson<VendorRecord[]>("/api/admin/vendors"),
  });

  const provincesQuery = useQuery({
    queryKey: regionKeys.provinces,
    queryFn: () => readJson<Province[]>("/api/provinces"),
  });

  const citiesQuery = useQuery({
    queryKey: regionKeys.cities,
    queryFn: () => readJson<City[]>("/api/cities"),
  });

  const vendors = vendorsQuery.data ?? EMPTY_VENDORS;
  const provinces = provincesQuery.data ?? EMPTY_PROVINCES;
  const cities = citiesQuery.data ?? EMPTY_CITIES;
  const form = useForm({
    defaultValues: defaultVendorValues,
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      setSubmitSuccess(null);

      const payload = toVendorPayload(value);
      if (editingVendorId) {
        await updateVendorMutation.mutateAsync({
          id: editingVendorId,
          payload,
        });
        setSubmitSuccess("Data vendor berhasil diperbarui.");
      } else {
        await createVendorMutation.mutateAsync(payload as VendorCreatePayload);
        setSubmitSuccess("Vendor baru berhasil ditambahkan.");
      }

      setEditingVendorId(null);
      form.reset(defaultVendorValues);
    },
  });

  const selectedProvinceId = useStore(form.store, (state) => state.values.provinceId);
  const selectedCityId = useStore(form.store, (state) => state.values.cityId);
  const slugValue = useStore(form.store, (state) => state.values.slug);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const filteredCities = useMemo(
    () =>
      selectedProvinceId
        ? cities.filter((city) => city.provinceId === selectedProvinceId)
        : cities,
    [cities, selectedProvinceId]
  );
  const selectedProvince =
    provinces.find((province) => province.id === selectedProvinceId) ?? null;
  const selectedCity =
    filteredCities.find((city) => city.id === selectedCityId) ?? null;

  const createVendorMutation = useMutation({
    mutationFn: (payload: VendorCreatePayload) =>
      readJson<VendorRecord>("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: VendorUpdatePayload;
    }) =>
      readJson<VendorRecord>(`/api/admin/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: (id: string) =>
      readJson<{ message: string }>(`/api/admin/vendors/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      setSubmitSuccess("Vendor berhasil dihapus.");
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    },
  });

  useEffect(() => {
    if (!selectedProvinceId) {
      return;
    }

    const cityExists = filteredCities.some((city) => city.id === selectedCityId);
    if (!cityExists && selectedCityId) {
      form.setFieldValue("cityId", "");
    }
  }, [filteredCities, form, selectedCityId, selectedProvinceId]);

  function resetVendorForm() {
    setEditingVendorId(null);
    form.reset(defaultVendorValues);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function populateVendorForm(values: VendorFormValues) {
    form.setFieldValue("name", values.name);
    form.setFieldValue("slug", values.slug);
    form.setFieldValue("email", values.email);
    form.setFieldValue("phone", values.phone);
    form.setFieldValue("provinceId", values.provinceId);
    form.setFieldValue("cityId", values.cityId);
    form.setFieldValue("address", values.address);
    form.setFieldValue("description", values.description);
    form.setFieldValue("legalName", values.legalName);
    form.setFieldValue("npwp", values.npwp);
    form.setFieldValue("siup", values.siup);
    form.setFieldValue("taxEnabled", values.taxEnabled);
    form.setFieldValue("taxRate", values.taxRate);
    form.setFieldValue("taxName", values.taxName);
    form.setFieldValue("platformFeeRate", values.platformFeeRate);
    form.setFieldValue("acceptCash", values.acceptCash);
    form.setFieldValue("isActive", values.isActive);
    form.setFieldValue("isHeld", values.isHeld);
    form.setFieldValue("bankName", values.bankName);
    form.setFieldValue("bankAccountNo", values.bankAccountNo);
    form.setFieldValue("bankAccountName", values.bankAccountName);
  }

  function startEditVendor(vendor: VendorRecord) {
    setEditingVendorId(vendor.id);
    const values = toVendorFormValues(vendor, cities);
    form.reset(values);
    populateVendorForm(values);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  async function confirmDeleteVendor() {
    if (!vendorToDelete) {
      return;
    }

    await deleteVendorMutation.mutateAsync(vendorToDelete.id);
    if (editingVendorId === vendorToDelete.id) {
      resetVendorForm();
    }
    setVendorToDelete(null);
  }

  const loading = vendorsQuery.isLoading || provincesQuery.isLoading || citiesQuery.isLoading;
  const loadingError =
    vendorsQuery.error?.message ||
    provincesQuery.error?.message ||
    citiesQuery.error?.message;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <section id="manage" className="rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Daftar Vendor</h2>
            <p className="text-sm text-muted-foreground">
              Admin dapat menambah, mengubah, dan menghapus vendor travel.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => vendorsQuery.refetch()}
            disabled={vendorsQuery.isFetching}
          >
            <RefreshCw className={cn("size-4", vendorsQuery.isFetching && "animate-spin")} />
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
        ) : vendors.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
            <Building2 className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">Belum ada vendor terdaftar.</p>
            <p className="text-sm text-muted-foreground">
              Gunakan form di samping untuk menambahkan vendor pertama.
            </p>
          </div>
        ) : (
          <ItemGroup>
            {vendors.map((vendor) => (
              <Item
                key={vendor.id}
                variant={editingVendorId === vendor.id ? "muted" : "outline"}
                className="rounded-[1.5rem] border-border/70 p-4"
              >
                <ItemHeader className="items-start">
                  <div className="flex items-start gap-3">
                    <ItemMedia variant="icon" className="mt-1 rounded-2xl bg-primary/10 p-2 text-primary">
                      <Building2 className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{vendor.name}</ItemTitle>
                      <ItemDescription>
                        {vendor.city?.name ?? "Kota belum dipilih"} • {vendor.email ?? "Tanpa email"}
                      </ItemDescription>
                    </ItemContent>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {vendor.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    {vendor.isHeld ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        Ditahan
                      </span>
                    ) : null}
                  </div>
                </ItemHeader>

                <div className="grid w-full gap-3 text-sm text-muted-foreground md:grid-cols-3">
                  <div className="rounded-2xl bg-muted/40 px-3 py-2">
                    <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                      <Users className="size-4" />
                      Owner/User
                    </div>
                    <div>{vendor._count?.users ?? 0}</div>
                  </div>
                  <div className="rounded-2xl bg-muted/40 px-3 py-2">
                    <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
                      <Bus className="size-4" />
                      Armada
                    </div>
                    <div>{vendor._count?.vehicles ?? 0}</div>
                  </div>
                  <div className="rounded-2xl bg-muted/40 px-3 py-2">
                    <div className="mb-1 font-medium text-foreground">Biaya Platform</div>
                    <div>{formatNumber(vendor.platformFeeRate)}</div>
                  </div>
                </div>

                <ItemActions className="ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => startEditVendor(vendor)}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setVendorToDelete(vendor)}
                    disabled={deleteVendorMutation.isPending}
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
              {editingVendorId ? "Edit Vendor" : "Tambah Vendor"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Form ini memakai TanStack Form untuk validasi dan submit state.
            </p>
          </div>
          {editingVendorId ? (
            <Button
              type="button"
              variant="ghost"
              onClick={resetVendorForm}
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
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      value.trim().length < 3 ? "Nama vendor minimal 3 karakter." : undefined,
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Nama Vendor</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            field.handleChange(event.target.value);
                            if (!editingVendorId && !slugValue) {
                              form.setFieldValue("slug", slugify(event.target.value));
                            }
                          }}
                          placeholder="Sinar Jaya"
                        />
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>

                <form.Field
                  name="slug"
                  validators={{
                    onChange: ({ value }) =>
                      !value.trim() ? "Slug wajib diisi." : undefined,
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(slugify(event.target.value))}
                          placeholder="sinar-jaya"
                        />
                        <FieldDescription>Gunakan format URL-friendly dan unik.</FieldDescription>
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field
                  name="email"
                  validators={{
                    onChange: ({ value }) =>
                      value && !/^\S+@\S+\.\S+$/.test(value)
                        ? "Format email tidak valid."
                        : undefined,
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="vendor@travel.com"
                        />
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
                          placeholder="08123456789"
                        />
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="provinceId">
                  {(field) => (
                    <Field>
                      <FieldLabel>Provinsi</FieldLabel>
                      <FieldContent>
                        <RegionCombobox
                          id="vendor-province"
                          items={provinces}
                          value={selectedProvince}
                          onChange={(value) => {
                            field.handleChange(value?.id ?? "");
                            form.setFieldValue("cityId", "");
                          }}
                          placeholder="Cari provinsi"
                          emptyLabel="Provinsi tidak ditemukan."
                          description={(province) => province.code ?? "Tanpa kode"}
                        />
                        <FieldDescription>
                          Ketik nama provinsi lalu navigasi dengan keyboard.
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="cityId">
                  {(field) => (
                    <Field>
                      <FieldLabel>Kota</FieldLabel>
                      <FieldContent>
                        <RegionCombobox
                          id="vendor-city"
                          items={filteredCities}
                          value={selectedCity}
                          onChange={(value) => field.handleChange(value?.id ?? "")}
                          placeholder="Cari kota"
                          emptyLabel="Kota tidak ditemukan."
                          description={(city) => city.code ?? "Tanpa kode"}
                          disabled={!selectedProvinceId}
                        />
                        <FieldDescription>
                          Pilih provinsi terlebih dulu agar daftar kota lebih relevan.
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="address">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Alamat</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Alamat kantor/vendor"
                        className="min-h-24 rounded-3xl"
                      />
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Deskripsi</FieldLabel>
                    <FieldContent>
                      <Textarea
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="Keterangan singkat vendor"
                        className="min-h-24 rounded-3xl"
                      />
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="legalName">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Nama Legal</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="PT Contoh Transport"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
                <form.Field name="npwp">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>NPWP</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="01.234.567.8-901.000"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="siup">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>SIUP</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Nomor SIUP"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
                <form.Field
                  name="platformFeeRate"
                  validators={{
                    onChange: ({ value }) =>
                      value && Number.isNaN(Number(value))
                        ? "Biaya platform harus berupa angka."
                        : undefined,
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Biaya Platform (%)</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="5"
                        />
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="bankName">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Nama Bank</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="BCA"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
                <form.Field name="bankAccountNo">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Nomor Rekening</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="1234567890"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="bankAccountName">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Nama Pemilik Rekening</FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        placeholder="PT Contoh Transport"
                      />
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-3">
                <form.Field name="taxEnabled">
                  {(field) => (
                    <ToggleField
                      label="Pajak Aktif"
                      description="Aktifkan bila vendor dikenakan pajak pada transaksi."
                      checked={field.state.value}
                      onChange={field.handleChange}
                    />
                  )}
                </form.Field>
                <form.Subscribe
                  selector={(state) => state.values.taxEnabled}
                >
                  {(taxEnabled) =>
                    taxEnabled ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <form.Field name="taxName">
                          {(field) => (
                            <Field>
                              <FieldLabel htmlFor={field.name}>Nama Pajak</FieldLabel>
                              <FieldContent>
                                <Input
                                  id={field.name}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(event) => field.handleChange(event.target.value)}
                                  placeholder="PPN"
                                />
                              </FieldContent>
                            </Field>
                          )}
                        </form.Field>
                        <form.Field
                          name="taxRate"
                          validators={{
                            onChange: ({ value }) =>
                              value && Number.isNaN(Number(value))
                                ? "Tarif pajak harus berupa angka."
                                : undefined,
                          }}
                        >
                          {(field) => (
                            <Field>
                              <FieldLabel htmlFor={field.name}>Tarif Pajak (%)</FieldLabel>
                              <FieldContent>
                                <Input
                                  id={field.name}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(event) => field.handleChange(event.target.value)}
                                  placeholder="11"
                                />
                                <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                              </FieldContent>
                            </Field>
                          )}
                        </form.Field>
                      </div>
                    ) : null
                  }
                </form.Subscribe>
                <form.Field name="acceptCash">
                  {(field) => (
                    <ToggleField
                      label="Terima Pembayaran Tunai"
                      description="Nonaktifkan bila vendor hanya menerima pembayaran non-tunai."
                      checked={field.state.value}
                      onChange={field.handleChange}
                    />
                  )}
                </form.Field>
                <form.Field name="isActive">
                  {(field) => (
                    <ToggleField
                      label="Vendor Aktif"
                      description="Vendor nonaktif tidak bisa dipakai pada operasional normal."
                      checked={field.state.value}
                      onChange={field.handleChange}
                    />
                  )}
                </form.Field>
                <form.Field name="isHeld">
                  {(field) => (
                    <ToggleField
                      label="Tahan Vendor"
                      description="Gunakan status ini bila vendor sedang dibekukan sementara."
                      checked={field.state.value}
                      onChange={field.handleChange}
                    />
                  )}
                </form.Field>
              </div>
            </FieldGroup>
          </FieldSet>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetVendorForm}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingVendorId ? "Simpan Perubahan" : "Tambah Vendor"}
            </Button>
          </div>
        </form>
      </section>

      <AlertDialog
        open={Boolean(vendorToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setVendorToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              {vendorToDelete
                ? `Vendor ${vendorToDelete.name} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`
                : "Data vendor akan dihapus permanen."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteVendorMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                void confirmDeleteVendor();
              }}
              disabled={deleteVendorMutation.isPending}
            >
              Hapus Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
