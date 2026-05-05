"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Pencil, Plus, RefreshCw, Trash2, Users, Bus, Wallet } from "lucide-react";
import { toast } from "sonner";

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
  FieldSet,
  FieldTitle
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
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency } from "@/lib/utils";
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

type ApiError = Error & {
  code?: string;
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
};

const vendorKeys = {
  all: ["admin", "vendors"] as const
};

const regionKeys = {
  provinces: (query: string) => ["regions", "provinces", query] as const,
  cities: (provinceId: string, query: string) => ["regions", "cities", provinceId, query] as const
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
  isHeld: false
};

const EMPTY_VENDORS: VendorRecord[] = [];
const EMPTY_PROVINCES: Province[] = [];
const EMPTY_CITIES: City[] = [];

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data && typeof data === "object" && "error" in data
        ? String(data.error)
        : "Request gagal diproses"
    ) as ApiError;

    if (data && typeof data === "object" && "code" in data) {
      error.code = String(data.code);
    }

    throw error;
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

function useDebouncedValue(value: string, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

function uniqueById<TItem extends { id: string }>(items: TItem[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
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
    platformFeeRate: vendor.platformFeeRate != null ? String(vendor.platformFeeRate) : "",
    acceptCash: vendor.acceptCash ?? true,
    isActive: vendor.isActive ?? true,
    isHeld: vendor.isHeld ?? false
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
    platformFeeRate: values.platformFeeRate.trim() ? Number(values.platformFeeRate) : undefined,
    acceptCash: values.acceptCash,
    isActive: values.isActive,
    isHeld: values.isHeld
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
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Field
      orientation="horizontal"
      className="border-border/70 bg-background items-start rounded-3xl border px-4 py-3"
    >
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
        className="border-border text-primary focus:ring-ring mt-1 size-4 rounded focus:ring-2"
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
  isLoading = false,
  onSearchChange
}: {
  id: string;
  items: TItem[];
  value: TItem | null;
  onChange: (value: TItem | null) => void;
  placeholder: string;
  emptyLabel: string;
  description?: (item: TItem) => string;
  disabled?: boolean;
  isLoading?: boolean;
  onSearchChange?: (value: string) => void;
}) {
  return (
    <Combobox
      items={items}
      filter={null}
      value={value}
      onValueChange={onChange}
      onInputValueChange={(inputValue) => onSearchChange?.(inputValue)}
      itemToStringValue={(item) => item?.id ?? ""}
      itemToStringLabel={(item) => item?.name ?? ""}
      isItemEqualToValue={(item, selectedItem) => item.id === selectedItem.id}
      id={id}
    >
      <ComboboxInput placeholder={placeholder} className="w-full" disabled={disabled} showClear>
        {isLoading ? (
          <div className="mr-7 flex items-center">
            <Spinner className="text-muted-foreground" />
          </div>
        ) : null}
      </ComboboxInput>
      <ComboboxContent className="w-full">
        <ComboboxEmpty>{isLoading ? "Memuat data..." : emptyLabel}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item}>
              <Item size="xs" className="p-0">
                <ItemContent>
                  <ItemTitle>{item.name}</ItemTitle>
                  {description ? <ItemDescription>{description(item)}</ItemDescription> : null}
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
  const slugEditedManuallyRef = useRef(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<VendorRecord | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const debouncedProvinceSearch = useDebouncedValue(provinceSearch);
  const debouncedCitySearch = useDebouncedValue(citySearch);
  const provinceQuery = debouncedProvinceSearch.trim();
  const cityQuery = debouncedCitySearch.trim();

  const vendorsQuery = useQuery({
    queryKey: vendorKeys.all,
    queryFn: () => readJson<VendorRecord[]>("/api/admin/vendors")
  });

  const provincesQuery = useQuery({
    queryKey: regionKeys.provinces(provinceQuery),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ limit: "34" });

      if (provinceQuery) {
        params.set("q", provinceQuery);
      }

      return readJson<Province[]>(`/api/provinces?${params.toString()}`, { signal });
    },
    placeholderData: keepPreviousData
  });

  const vendors = vendorsQuery.data ?? EMPTY_VENDORS;
  const provinces = provincesQuery.data ?? EMPTY_PROVINCES;
  const form = useForm({
    defaultValues: defaultVendorValues,
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      setSubmitSuccess(null);

      const payload = toVendorPayload(value);
      if (editingVendorId) {
        await updateVendorMutation.mutateAsync({
          id: editingVendorId,
          payload
        });
        setSubmitSuccess("Data vendor berhasil diperbarui.");
      } else {
        await createVendorMutation.mutateAsync(payload as VendorCreatePayload);
        setSubmitSuccess("Vendor baru berhasil ditambahkan.");
      }

      setEditingVendorId(null);
      slugEditedManuallyRef.current = false;
      form.reset(defaultVendorValues);
      setProvinceSearch("");
      setCitySearch("");
    }
  });

  const selectedProvinceId = useStore(form.store, (state) => state.values.provinceId);
  const selectedCityId = useStore(form.store, (state) => state.values.cityId);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const provinceCitiesQuery = useQuery({
    queryKey: regionKeys.cities(selectedProvinceId, cityQuery),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ provinceId: selectedProvinceId, limit: "20" });

      if (cityQuery) {
        params.set("q", cityQuery);
      }

      return readJson<City[]>(`/api/cities?${params.toString()}`, { signal });
    },
    enabled: Boolean(selectedProvinceId),
    placeholderData: keepPreviousData
  });

  const selectedVendor = vendors.find((vendor) => vendor.id === editingVendorId) ?? null;
  const selectedVendorCity = selectedVendor?.city ?? null;
  const cities = useMemo(
    () =>
      uniqueById([
        ...(provinceCitiesQuery.data ?? EMPTY_CITIES),
        ...(selectedVendorCity ? [selectedVendorCity] : [])
      ]),
    [provinceCitiesQuery.data, selectedVendorCity]
  );
  const selectedProvince = provinces.find((province) => province.id === selectedProvinceId) ?? null;
  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? null;

  const createVendorMutation = useMutation({
    mutationFn: (payload: VendorCreatePayload) =>
      readJson<VendorRecord>("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    }
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: VendorUpdatePayload }) =>
      readJson<VendorRecord>(`/api/admin/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
    onError: (error: Error) => {
      setSubmitError(error.message);
    }
  });

  const deleteVendorMutation = useMutation({
    mutationFn: (id: string) =>
      readJson<{ message: string }>(`/api/admin/vendors/${id}`, {
        method: "DELETE"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      setSubmitSuccess("Vendor berhasil dihapus.");
    },
    onError: (error: ApiError) => {
      if (error.code === "VENDOR_HAS_OWNERS") {
        toast.error("Vendor masih memiliki owner/driver", {
          description: error.message
        });
        return;
      }

      toast.error("Vendor gagal dihapus", {
        description: error.message
      });
      setSubmitError(error.message);
    }
  });

  useEffect(() => {
    if (!selectedProvinceId) {
      return;
    }

    if (provinceCitiesQuery.isFetching) {
      return;
    }

    const cityExists = cities.some((city) => city.id === selectedCityId);
    if (!cityExists && selectedCityId) {
      form.setFieldValue("cityId", "");
    }
  }, [cities, form, provinceCitiesQuery.isFetching, selectedCityId, selectedProvinceId]);

  function resetVendorForm() {
    setEditingVendorId(null);
    slugEditedManuallyRef.current = false;
    form.reset(defaultVendorValues);
    setProvinceSearch("");
    setCitySearch("");
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
  }

  function startEditVendor(vendor: VendorRecord) {
    setEditingVendorId(vendor.id);
    slugEditedManuallyRef.current = true;
    const values = toVendorFormValues(vendor, vendor.city ? [vendor.city] : cities);
    form.reset(values);
    populateVendorForm(values);
    setProvinceSearch("");
    setCitySearch("");
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function requestDeleteVendor(vendor: VendorRecord) {
    const ownerCount = vendor._count?.users ?? 0;

    if (ownerCount > 0) {
      toast.error("Vendor masih memiliki owner/driver", {
        description: `Lepaskan ${ownerCount} owner/driver dari vendor ini sebelum menghapus vendor.`
      });
      return;
    }

    setVendorToDelete(vendor);
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

  const loading = vendorsQuery.isLoading || provincesQuery.isLoading;
  const loadingError = vendorsQuery.error?.message || provincesQuery.error?.message;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <section id="manage" className="border-border/70 bg-card rounded-[2rem] border p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Daftar Vendor</h2>
            <p className="text-muted-foreground text-sm">
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
          <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-3xl border px-4 py-3 text-sm">
            {loadingError}
          </div>
        ) : vendors.length === 0 ? (
          <div className="border-border bg-muted/30 rounded-[1.5rem] border border-dashed px-5 py-10 text-center">
            <Building2 className="text-muted-foreground mx-auto mb-3 size-10" />
            <p className="font-medium">Belum ada vendor terdaftar.</p>
            <p className="text-muted-foreground text-sm">
              Gunakan form di samping untuk menambahkan vendor pertama.
            </p>
          </div>
        ) : (
          <ItemGroup>
            {vendors.map((vendor) => (
              <Item
                key={vendor.id}
                variant={editingVendorId === vendor.id ? "muted" : "outline"}
                className="border-border/70 rounded-[1.5rem] p-4"
              >
                <ItemHeader className="items-start">
                  <div className="flex items-start gap-3">
                    <ItemMedia
                      variant="icon"
                      className="bg-primary/10 text-primary mt-1 rounded-2xl p-2"
                    >
                      <Building2 className="size-4" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{vendor.name}</ItemTitle>
                      <ItemDescription>
                        {vendor.city?.name ?? "Kota belum dipilih"} •{" "}
                        {vendor.email ?? "Tanpa email"}
                      </ItemDescription>
                    </ItemContent>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                      {vendor.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    {vendor.isHeld ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                        Ditahan
                      </span>
                    ) : null}
                  </div>
                </ItemHeader>

                <div className="text-muted-foreground grid w-full gap-3 text-sm md:grid-cols-4">
                  <div className="bg-muted/40 rounded-2xl px-3 py-2">
                    <div className="text-foreground mb-1 flex items-center gap-2 font-medium">
                      <Wallet className="size-4" />
                      Saldo Wallet
                    </div>
                    <div className="text-primary font-semibold">
                      {formatCurrency(vendor.wallet?.balance ?? 0)}
                    </div>
                  </div>
                  <div className="bg-muted/40 rounded-2xl px-3 py-2">
                    <div className="text-foreground mb-1 flex items-center gap-2 font-medium">
                      <Users className="size-4" />
                      Owner/User
                    </div>
                    <div>{vendor._count?.users ?? 0}</div>
                  </div>
                  <div className="bg-muted/40 rounded-2xl px-3 py-2">
                    <div className="text-foreground mb-1 flex items-center gap-2 font-medium">
                      <Bus className="size-4" />
                      Armada
                    </div>
                    <div>{vendor._count?.vehicles ?? 0}</div>
                  </div>
                  <div className="bg-muted/40 rounded-2xl px-3 py-2">
                    <div className="text-foreground mb-1 font-medium">Biaya Platform</div>
                    <div>{formatNumber(vendor.platformFeeRate)}</div>
                  </div>
                </div>

                <ItemActions className="ml-auto">
                  <Button type="button" variant="outline" onClick={() => startEditVendor(vendor)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => requestDeleteVendor(vendor)}
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

      <section className="border-border/70 bg-card rounded-[2rem] border p-5 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {editingVendorId ? "Edit Vendor" : "Tambah Vendor"}
            </h2>
            <p className="text-muted-foreground text-sm">
              Form ini memakai TanStack Form untuk validasi dan submit state.
            </p>
          </div>
          {editingVendorId ? (
            <Button type="button" variant="ghost" onClick={resetVendorForm}>
              <Plus className="size-4" />
              Mode Baru
            </Button>
          ) : null}
        </div>

        {submitError ? (
          <div className="border-destructive/20 bg-destructive/5 text-destructive mb-4 rounded-3xl border px-4 py-3 text-sm">
            {submitError}
          </div>
        ) : null}
        {submitSuccess ? (
          <div className="border-primary/20 bg-primary/5 text-primary mb-4 rounded-3xl border px-4 py-3 text-sm">
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
                      value.trim().length < 3 ? "Nama vendor minimal 3 karakter." : undefined
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
                            if (!editingVendorId && !slugEditedManuallyRef.current) {
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
                    onChange: ({ value }) => (!value.trim() ? "Slug wajib diisi." : undefined)
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
                          onChange={(event) => {
                            slugEditedManuallyRef.current = true;
                            field.handleChange(slugify(event.target.value));
                          }}
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
                        : undefined
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
                            setCitySearch("");
                          }}
                          onSearchChange={setProvinceSearch}
                          placeholder="Cari provinsi"
                          emptyLabel="Provinsi tidak ditemukan."
                          description={(province) => province.code ?? "Tanpa kode"}
                          isLoading={provincesQuery.isFetching}
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
                          items={cities}
                          value={selectedCity}
                          onChange={(value) => field.handleChange(value?.id ?? "")}
                          onSearchChange={setCitySearch}
                          placeholder="Cari kota"
                          emptyLabel={
                            provinceCitiesQuery.isError
                              ? "Gagal memuat kota."
                              : "Kota tidak ditemukan."
                          }
                          description={(city) => city.code ?? "Tanpa kode"}
                          disabled={!selectedProvinceId}
                          isLoading={provinceCitiesQuery.isFetching}
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
                        : undefined
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
                <form.Subscribe selector={(state) => state.values.taxEnabled}>
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
                                : undefined
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
            <Button type="button" variant="outline" onClick={resetVendorForm}>
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
            <AlertDialogCancel disabled={deleteVendorMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
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
