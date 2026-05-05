"use client";

import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Coins,
  CreditCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  Wallet
} from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { ComboboxCitySearch, type City } from "@/components/public/combobox-city-search";
import { cn } from "@/lib/utils";
import type { OwnerVendorRecord, OwnerVendorUpdatePayload } from "@/types/owner-vendor-api";

type VendorFormValues = {
  name: string;
  description: string;
  address: string;
  city: City | null;
  phone: string;
  email: string;
  logo: string;
  legalName: string;
  npwp: string;
  siup: string;
  taxEnabled: boolean;
  taxRate: string;
  taxName: string;
  acceptCash: boolean;
};

const vendorKeys = {
  detail: ["owner", "vendor"] as const
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

function toFormValues(vendor: OwnerVendorRecord): VendorFormValues {
  return {
    name: vendor.name ?? "",
    description: vendor.description ?? "",
    address: vendor.address ?? "",
    city: vendor.city
      ? {
          id: vendor.city.id,
          code: vendor.city.id,
          name: vendor.city.name,
          province: vendor.city.province?.name ?? "",
          provinceId: vendor.city.province?.id
        }
      : null,
    phone: vendor.phone ?? "",
    email: vendor.email ?? "",
    logo: vendor.logo ?? "",
    legalName: vendor.legalName ?? "",
    npwp: vendor.npwp ?? "",
    siup: vendor.siup ?? "",
    taxEnabled: vendor.taxEnabled ?? false,
    taxRate: vendor.taxRate != null ? String(vendor.taxRate) : "",
    taxName: vendor.taxName ?? "",
    acceptCash: vendor.acceptCash ?? false
  };
}

function toPayload(values: VendorFormValues): OwnerVendorUpdatePayload {
  const taxRateNum = values.taxRate.trim() ? Number(values.taxRate) : null;
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    address: values.address.trim() || null,
    cityId: values.city?.id ?? null,
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    logo: values.logo.trim() || null,
    legalName: values.legalName.trim() || null,
    npwp: values.npwp.trim() || null,
    siup: values.siup.trim() || null,
    taxEnabled: values.taxEnabled,
    taxRate: Number.isFinite(taxRateNum as number) ? taxRateNum : null,
    taxName: values.taxName.trim() || null,
    acceptCash: values.acceptCash
  };
}

function InfoRow({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="border-border/60 bg-card/40 flex items-start gap-3 rounded-2xl border p-4">
      <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {label}
        </p>
        <p className="text-foreground mt-1 text-sm wrap-break-word">
          {value?.trim() ? value : <span className="text-muted-foreground/70">Belum diisi</span>}
        </p>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onCheckedChange
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group bg-card flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition",
        checked ? "border-primary/40 bg-primary/5" : "border-border/60 hover:border-border"
      )}
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p>
        )}
      </div>
      <span
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute size-4 rounded-full bg-white shadow transition-all",
            checked ? "left-6" : "left-1"
          )}
        />
      </span>
    </button>
  );
}

export function VendorInfoSection() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const vendorQuery = useQuery({
    queryKey: vendorKeys.detail,
    queryFn: () => readJson<OwnerVendorRecord>("/api/owner/vendor")
  });

  const updateMutation = useMutation({
    mutationFn: (payload: OwnerVendorUpdatePayload) =>
      readJson<OwnerVendorRecord>("/api/owner/vendor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(vendorKeys.detail, data);
      setOpen(false);
    },
    onError: (error: unknown) => {
      setSubmitError(error instanceof Error ? error.message : "Gagal menyimpan");
    }
  });

  const vendor = vendorQuery.data;

  const form = useForm({
    defaultValues: vendor
      ? toFormValues(vendor)
      : ({
          name: "",
          description: "",
          address: "",
          city: null,
          phone: "",
          email: "",
          logo: "",
          legalName: "",
          npwp: "",
          siup: "",
          taxEnabled: false,
          taxRate: "",
          taxName: "",
          acceptCash: false
        } as VendorFormValues),
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      await updateMutation.mutateAsync(toPayload(value));
    }
  });

  const taxEnabled = useStore(form.store, (s) => s.values.taxEnabled);
  const acceptCash = useStore(form.store, (s) => s.values.acceptCash);

  function handleOpenChange(next: boolean) {
    if (next && vendor) form.reset(toFormValues(vendor));
    setSubmitError(null);
    setOpen(next);
  }

  if (vendorQuery.isPending) {
    return (
      <section className="border-border/70 bg-card rounded-[2rem] border p-6 shadow-sm">
        <Skeleton className="h-6 w-44" />
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!vendor) {
    return (
      <section className="border-border/70 bg-card rounded-[2rem] border p-6 shadow-sm">
        <p className="text-muted-foreground text-sm">
          Vendor belum tersedia. Hubungi administrator.
        </p>
      </section>
    );
  }

  return (
    <section className="border-border/70 bg-card rounded-[2rem] border p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="font-heading text-base font-semibold">Profil Perusahaan</h2>
            <p className="text-muted-foreground text-xs">
              Identitas resmi vendor yang ditampilkan ke pelanggan.
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenChange(true)} variant="default">
          <Pencil className="size-4" />
          Ubah informasi
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <InfoRow icon={Building2} label="Nama Bisnis" value={vendor.name} />
        <InfoRow icon={Receipt} label="Nama Legal" value={vendor.legalName} />
        <InfoRow icon={Mail} label="Email" value={vendor.email} />
        <InfoRow icon={Phone} label="Telepon" value={vendor.phone} />
        <InfoRow
          icon={MapPin}
          label="Kota"
          value={vendor.city ? `${vendor.city.name}, ${vendor.city.province?.name ?? ""}` : null}
        />
        <InfoRow icon={MapPin} label="Alamat" value={vendor.address} />
        <InfoRow icon={Receipt} label="NPWP" value={vendor.npwp} />
        <InfoRow icon={Receipt} label="SIUP" value={vendor.siup} />
      </div>

      {vendor.description && (
        <div className="border-border/60 bg-muted/40 mt-4 rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Deskripsi
          </p>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{vendor.description}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border-border/60 bg-card/40 rounded-2xl border p-4">
          <div className="text-muted-foreground flex items-center gap-2 text-xs tracking-wider uppercase">
            <Coins className="size-3.5" />
            Pajak
          </div>
          <p className="mt-1 text-sm font-medium">
            {vendor.taxEnabled
              ? `${vendor.taxName || "Pajak"} ${vendor.taxRate ?? 0}%`
              : "Tidak aktif"}
          </p>
        </div>
        <div className="border-border/60 bg-card/40 rounded-2xl border p-4">
          <div className="text-muted-foreground flex items-center gap-2 text-xs tracking-wider uppercase">
            <Wallet className="size-3.5" />
            Bayar Tunai
          </div>
          <p className="mt-1 text-sm font-medium">
            {vendor.acceptCash ? "Diterima" : "Tidak diterima"}
          </p>
        </div>
        <div className="border-border/60 bg-card/40 rounded-2xl border p-4">
          <div className="text-muted-foreground flex items-center gap-2 text-xs tracking-wider uppercase">
            <CreditCard className="size-3.5" />
            Platform Fee
          </div>
          <p className="mt-1 text-sm font-medium">
            {vendor.platformFeeRate != null ? `${vendor.platformFeeRate}%` : "—"}
          </p>
        </div>
      </div>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl!">
          <SheetHeader className="border-b">
            <SheetTitle>Ubah Informasi Perusahaan</SheetTitle>
            <SheetDescription>
              Perbarui detail vendor agar pelanggan mendapatkan informasi terbaru.
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
                  name="name"
                  validators={{
                    onChange: ({ value }) => (!value.trim() ? "Nama wajib diisi." : undefined)
                  }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Nama Bisnis *</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="PT Travel Nusantara"
                      />
                      <FieldError
                        errors={(field.state.meta.errors ?? []).map((err) =>
                          typeof err === "string" ? { message: err } : undefined
                        )}
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="legalName">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Nama Legal</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="PT Travel Nusantara Tbk"
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="description">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Deskripsi</FieldLabel>
                      <Textarea
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        rows={4}
                        placeholder="Ceritakan tentang vendor kamu, layanan unggulan, atau wilayah operasi."
                      />
                      <FieldDescription>
                        Deskripsi tampil di halaman publik vendor.
                      </FieldDescription>
                    </Field>
                  )}
                </form.Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <form.Field name="email">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          id={field.name}
                          type="email"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="kontak@vendor.com"
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="phone">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Telepon</FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="+62 812..."
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>

                <form.Field name="city">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="vendor-city">Kota</FieldLabel>
                      <ComboboxCitySearch
                        id="vendor-city"
                        value={field.state.value}
                        onChange={(value) => field.handleChange(value)}
                        placeholder="Pilih kota"
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="address">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Alamat</FieldLabel>
                      <Textarea
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        rows={2}
                        placeholder="Jl. Raya No. 123"
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="logo">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>URL Logo</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://..."
                      />
                    </Field>
                  )}
                </form.Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <form.Field name="npwp">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>NPWP</FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="00.000.000.0-000.000"
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="siup">
                    {(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>SIUP</FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="No. SIUP"
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Pengaturan Pembayaran</p>
                  <form.Field name="taxEnabled">
                    {(field) => (
                      <ToggleField
                        label="Aktifkan pajak"
                        description="Pajak akan ditambahkan ke total transaksi pelanggan."
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                      />
                    )}
                  </form.Field>

                  {taxEnabled && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <form.Field name="taxName">
                        {(field) => (
                          <Field>
                            <FieldLabel htmlFor={field.name}>Nama Pajak</FieldLabel>
                            <Input
                              id={field.name}
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="PPN"
                            />
                          </Field>
                        )}
                      </form.Field>
                      <form.Field name="taxRate">
                        {(field) => (
                          <Field>
                            <FieldLabel htmlFor={field.name}>Persentase (%)</FieldLabel>
                            <Input
                              id={field.name}
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="11"
                            />
                          </Field>
                        )}
                      </form.Field>
                    </div>
                  )}

                  <form.Field name="acceptCash">
                    {(field) => (
                      <ToggleField
                        label="Terima pembayaran tunai"
                        description="Izinkan pelanggan membayar tunai langsung ke driver."
                        checked={field.state.value}
                        onCheckedChange={field.handleChange}
                      />
                    )}
                  </form.Field>
                  {acceptCash && (
                    <p className="text-muted-foreground text-xs">
                      Pastikan driver kamu siap menerima dan menyetorkan kas.
                    </p>
                  )}
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
                  onClick={() => handleOpenChange(false)}
                  disabled={updateMutation.isPending}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan perubahan"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </section>
  );
}
