"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Building2, 
  Pencil, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Users, 
  Bus, 
  Wallet, 
  Percent, 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Settings,
  Scale
} from "lucide-react";
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
      className="border border-slate-100 bg-slate-50/50 hover:bg-slate-50 items-center justify-between rounded-2xl px-4 py-3 transition-colors duration-200"
    >
      <FieldContent className="space-y-0.5">
        <FieldTitle className="text-slate-800 text-sm font-bold">{label}</FieldTitle>
        <FieldDescription className="text-slate-400 text-xs font-medium max-w-sm">{description}</FieldDescription>
      </FieldContent>
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
        className="border-slate-200 text-teal-600 focus:ring-teal-500/20 size-4.5 rounded cursor-pointer transition-all"
      />
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
      <ComboboxInput placeholder={placeholder} className="w-full text-xs rounded-xl h-9.5 border-slate-200 focus:border-teal-500 focus:ring-teal-500/20" disabled={disabled} showClear>
        {isLoading ? (
          <div className="mr-7 flex items-center">
            <Spinner className="text-teal-600 size-4 animate-spin" />
          </div>
        ) : null}
      </ComboboxInput>
      <ComboboxContent className="w-full max-h-60 overflow-y-auto">
        <ComboboxEmpty className="text-slate-400 text-xs italic py-2">{isLoading ? "Memuat data..." : emptyLabel}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item} className="data-highlighted:bg-teal-50 data-highlighted:text-teal-700">
              <Item size="xs" className="p-0">
                <ItemContent>
                  <ItemTitle className="font-semibold text-xs">{item.name}</ItemTitle>
                  {description ? <ItemDescription className="text-[10px] text-slate-400">{description(item)}</ItemDescription> : null}
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
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(380px,0.75fr)]">
      {/* LEFT SECTION: LIST OF VENDORS */}
      <section id="manage" className="border border-slate-100 bg-white rounded-3xl p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="text-teal-600 size-5" />
              Daftar Vendor Mitra
            </h2>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              Pantau mitra travel aktif, ketersediaan armada, saldo wallet, dan parameter pajak.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => vendorsQuery.refetch()}
            disabled={vendorsQuery.isFetching}
            className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs h-9.5"
          >
            <RefreshCw className={cn("size-3.5 mr-1.5", vendorsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : loadingError ? (
          <div className="border border-red-200 bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-xs font-bold">
            {loadingError}
          </div>
        ) : vendors.length === 0 ? (
          <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-2xl px-5 py-12 text-center">
            <Building2 className="text-slate-400 mx-auto mb-3 size-12" />
            <p className="font-bold text-slate-800">Belum Ada Vendor Mitra</p>
            <p className="text-slate-400 text-xs mt-1">
              Gunakan formulir di sebelah kanan untuk menambahkan mitra travel pertama Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-4.5">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className={cn(
                  "border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden group hover:shadow-md",
                  editingVendorId === vendor.id 
                    ? "border-teal-200 bg-teal-50/10" 
                    : "border-slate-100 bg-white hover:border-slate-200"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-600 transition-colors group-hover:bg-teal-50 group-hover:text-teal-600">
                      <Building2 className="size-4.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800 transition-colors group-hover:text-teal-600">
                        {vendor.name}
                      </h4>
                      <p className="text-slate-400 text-xs font-semibold flex items-center gap-1.5 mt-0.5">
                        <MapPin size={12} className="text-slate-300" />
                        {vendor.city?.name ?? "Lokasi belum diatur"}
                        {vendor.email && (
                          <>
                            <span className="text-slate-200">•</span>
                            <Mail size={12} className="text-slate-300" />
                            {vendor.email}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider",
                      vendor.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                      {vendor.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                    {vendor.isHeld && (
                      <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        Ditangguhkan
                      </span>
                    )}
                  </div>
                </div>

                {/* Dashboard style metrics */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl p-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Wallet className="size-3.5 text-slate-400" />
                      Saldo Wallet
                    </div>
                    <div className="text-teal-600 font-extrabold text-xs">
                      {formatCurrency(vendor.wallet?.balance ?? 0)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Users className="size-3.5 text-slate-400" />
                      Pengguna / Staff
                    </div>
                    <div className="text-slate-700 font-bold text-xs">
                      {vendor._count?.users ?? 0} Akun
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Bus className="size-3.5 text-slate-400" />
                      Total Armada
                    </div>
                    <div className="text-slate-700 font-bold text-xs">
                      {vendor._count?.vehicles ?? 0} Kendaraan
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Percent className="size-3.5 text-slate-400" />
                      Platform Fee
                    </div>
                    <div className="text-slate-700 font-bold text-xs">
                      {formatNumber(vendor.platformFeeRate)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                  {/* Additional info badge */}
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <FileSpreadsheet size={12} className="text-slate-300" />
                    SIUP: {vendor.siup || "-"}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => startEditVendor(vendor)}
                      className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs h-8 px-3"
                    >
                      <Pencil className="size-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => requestDeleteVendor(vendor)}
                      disabled={deleteVendorMutation.isPending}
                      className="rounded-xl font-bold text-xs h-8 px-3"
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      Hapus
                    </Button>
                  </div>
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
              {editingVendorId ? (
                <>
                  <Settings className="text-amber-500 size-5" />
                  Edit Data Vendor
                </>
              ) : (
                <>
                  <Plus className="text-teal-600 size-5" />
                  Tambah Vendor Baru
                </>
              )}
            </h2>
            <p className="text-slate-400 text-xs font-semibold mt-1">
              {editingVendorId
                ? "Modifikasi pengaturan, detail legalitas, dan parameter komisi vendor."
                : "Daftarkan armada travel baru ke dalam platform Anda."}
            </p>
          </div>
          {editingVendorId && (
            <Button 
              type="button" 
              variant="ghost" 
              size="xs"
              onClick={resetVendorForm}
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
              
              {/* SECTION A: INFORMASI DASAR */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-300" />
                  Informasi Dasar
                </h3>
                
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      value.trim().length < 3 ? "Nama vendor minimal 3 karakter." : undefined
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Nama Vendor</FieldLabel>
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
                          className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                        />
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
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
                      <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Slug URL</FieldLabel>
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
                          className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                        />
                        <FieldDescription className="text-[10px] text-slate-400 mt-1">
                          Format URL unik, otomatis tersinkronisasi dengan nama.
                        </FieldDescription>
                        <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Deskripsi Travel</FieldLabel>
                      <FieldContent>
                        <Textarea
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Deskripsi singkat mengenai layanan travel..."
                          className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl min-h-20"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <hr className="border-slate-100" />

              {/* SECTION B: KONTAK & REGION */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-300" />
                  Kontak & Wilayah
                </h3>

                <div className="grid gap-4 grid-cols-2">
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
                        <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Email</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            type="email"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="vendor@travel.com"
                            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                          />
                          <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
                        </FieldContent>
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="phone">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Telepon</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="08123456789"
                            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                          />
                          <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
                        </FieldContent>
                      </Field>
                    )}
                  </form.Field>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <form.Field name="provinceId">
                    {(field) => (
                      <Field>
                        <FieldLabel className="text-xs font-bold text-slate-700 mb-1">Provinsi</FieldLabel>
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
                        </FieldContent>
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="cityId">
                    {(field) => (
                      <Field>
                        <FieldLabel className="text-xs font-bold text-slate-700 mb-1">Kota / Kabupaten</FieldLabel>
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
                        </FieldContent>
                      </Field>
                    )}
                  </form.Field>
                </div>

                <form.Field name="address">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Alamat Kantor</FieldLabel>
                      <FieldContent>
                        <Textarea
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="Jalan, No. Gedung, RT/RW..."
                          className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl min-h-20"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <hr className="border-slate-100" />

              {/* SECTION C: LEGALITAS & FINANSIAL */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Scale size={13} className="text-slate-300" />
                  Legalitas & Komisi
                </h3>

                <form.Field name="legalName">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Nama Perusahaan Legal</FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="PT Contoh Transport Solusindo"
                          className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                        />
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>

                <div className="grid gap-4 grid-cols-2">
                  <form.Field name="npwp">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">NPWP Perusahaan</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="01.234.567.8-901.000"
                            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                          />
                        </FieldContent>
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="siup">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Nomor SIUP</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="SIUP-XXXX-XXXX"
                            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                          />
                        </FieldContent>
                      </Field>
                    )}
                  </form.Field>
                </div>

                <div className="grid gap-4 grid-cols-2">
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
                        <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Biaya Komisi Platform (%)</FieldLabel>
                        <FieldContent>
                          <Input
                            id={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="5"
                            className="border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                          />
                          <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
                        </FieldContent>
                      </Field>
                    )}
                  </form.Field>

                  <div className="flex flex-col justify-end">
                    <form.Field name="taxEnabled">
                      {(field) => (
                        <ToggleField
                          label="Pajak Aktif"
                          description="Kenakan pajak pada setiap tiket."
                          checked={field.state.value}
                          onChange={field.handleChange}
                        />
                      )}
                    </form.Field>
                  </div>
                </div>

                <form.Subscribe selector={(state) => state.values.taxEnabled}>
                  {(taxEnabled) =>
                    taxEnabled ? (
                      <div className="grid gap-4 grid-cols-2 bg-slate-50 p-4.5 rounded-2xl border border-slate-100 animate-in fade-in duration-300">
                        <form.Field name="taxName">
                          {(field) => (
                            <Field>
                              <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Nama Pajak</FieldLabel>
                              <FieldContent>
                                <Input
                                  id={field.name}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(event) => field.handleChange(event.target.value)}
                                  placeholder="PPN"
                                  className="border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
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
                              <FieldLabel htmlFor={field.name} className="text-xs font-bold text-slate-700 mb-1">Tarif Pajak (%)</FieldLabel>
                              <FieldContent>
                                <Input
                                  id={field.name}
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(event) => field.handleChange(event.target.value)}
                                  placeholder="11"
                                  className="border-slate-200 bg-white focus:border-teal-500 focus:ring-teal-500/20 text-xs rounded-xl h-9.5"
                                />
                                <FieldError errors={toFieldErrors(field.state.meta.errors)} className="text-[10px] text-red-500 font-bold mt-1" />
                              </FieldContent>
                            </Field>
                          )}
                        </form.Field>
                      </div>
                    ) : null
                  }
                </form.Subscribe>
              </div>

              <hr className="border-slate-100" />

              {/* SECTION D: STATUS & FITUR */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Settings size={13} className="text-slate-300" />
                  Status & Fitur Sistem
                </h3>
                
                <div className="space-y-3">
                  <form.Field name="acceptCash">
                    {(field) => (
                      <ToggleField
                        label="Terima Pembayaran Tunai (Cash)"
                        description="Vendor/Driver diperbolehkan memegang kas tiket fisik."
                        checked={field.state.value}
                        onChange={field.handleChange}
                      />
                    )}
                  </form.Field>

                  <form.Field name="isActive">
                    {(field) => (
                      <ToggleField
                        label="Vendor Berstatus Aktif"
                        description="Bila nonaktif, rute/tiket vendor tidak akan muncul di publik."
                        checked={field.state.value}
                        onChange={field.handleChange}
                      />
                    )}
                  </form.Field>

                  <form.Field name="isHeld">
                    {(field) => (
                      <ToggleField
                        label="Bekukan Sementara (Hold Wallet)"
                        description="Batasi pencairan dana penarikan sementara waktu."
                        checked={field.state.value}
                        onChange={field.handleChange}
                      />
                    )}
                  </form.Field>
                </div>
              </div>
            </FieldGroup>
          </FieldSet>

          <div className="flex items-center justify-end gap-3 border-t border-slate-50 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={resetVendorForm}
              className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 h-9.5 text-xs px-4"
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 font-bold text-white h-9.5 text-xs px-4 flex items-center gap-1.5"
            >
              {isSubmitting && <Spinner className="size-3.5 animate-spin text-white" />}
              {editingVendorId ? "Simpan Perubahan" : "Tambah Vendor"}
            </Button>
          </div>
        </form>
      </section>

      {/* DELETE DIALOG */}
      <AlertDialog
        open={Boolean(vendorToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setVendorToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-50 text-red-500 rounded-2xl p-2.5 w-fit mx-auto mb-2">
              <Trash2 className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-center font-extrabold text-slate-800">Hapus Vendor?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-xs">
              {vendorToDelete
                ? `Akun vendor "${vendorToDelete.name}" akan dihapus permanen dari sistem. Tindakan ini tidak dapat diurungkan.`
                : "Data vendor akan dihapus secara permanen."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2 mt-4">
            <AlertDialogCancel disabled={deleteVendorMutation.isPending} className="rounded-xl border-slate-200 text-slate-500 font-bold text-xs h-9.5">Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteVendor();
              }}
              disabled={deleteVendorMutation.isPending}
              className="rounded-xl font-bold text-xs h-9.5 bg-red-600 hover:bg-red-700"
            >
              Hapus Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
