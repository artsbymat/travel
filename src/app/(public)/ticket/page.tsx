"use client";

import { type FormEvent, useState } from "react";

import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Download,
  MapPin,
  Phone,
  QrCode,
  Route,
  Search,
  ShieldCheck,
  Ticket,
  UserRound
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const statuses = [
  {
    key: "unpaid",
    label: "Menunggu Pembayaran",
    tone: "border-amber-200 bg-amber-50 text-amber-700"
  },
  {
    key: "paid",
    label: "Sudah Dibayar",
    tone: "border-sky-200 bg-sky-50 text-sky-700"
  },
  {
    key: "confirmed",
    label: "Terkonfirmasi",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700"
  },
  {
    key: "on-going",
    label: "Dalam Perjalanan",
    tone: "border-teal-200 bg-teal-50 text-teal-700"
  },
  {
    key: "completed",
    label: "Selesai",
    tone: "border-slate-200 bg-slate-50 text-slate-700"
  },
  {
    key: "cancelled",
    label: "Dibatalkan",
    tone: "border-rose-200 bg-rose-50 text-rose-700"
  }
];

const booking = {
  code: "TRV-2408-9321",
  phone: "0812 3456 7890",
  status: "confirmed",
  statusLabel: "Terkonfirmasi",
  route: "Jakarta ke Bandung",
  passenger: "Rahmat Hidayat",
  email: "rahmat@example.com",
  totalPassenger: "2 penumpang",
  seat: "A2, A3",
  pickup: "Pool Travel Cawang, Jakarta Timur",
  dropoff: "Dipatiukur, Bandung",
  vehicle: "Toyota Hiace Super Grandia",
  departureDate: "Selasa, 21 April 2026",
  departureTime: "08:00 WIB",
  arrivalTime: "11:15 WIB",
  ticketNumber: "TKT-9321-0426"
};

const timeline = [
  { label: "Booking dibuat", description: "Kode booking berhasil diterbitkan", done: true },
  { label: "Pembayaran diterima", description: "Transaksi sudah terverifikasi", done: true },
  { label: "Tiket dikonfirmasi", description: "Kursi dan jadwal sudah diamankan", done: true },
  { label: "Dalam perjalanan", description: "Status aktif saat kendaraan berangkat", done: false },
  { label: "Perjalanan selesai", description: "Trip selesai setelah tiba di tujuan", done: false }
];

const tripDetails = [
  { icon: CalendarDays, label: "Tanggal", value: booking.departureDate },
  { icon: Clock3, label: "Jam Berangkat", value: booking.departureTime },
  { icon: MapPin, label: "Titik Jemput", value: booking.pickup },
  { icon: Route, label: "Titik Turun", value: booking.dropoff },
  { icon: Ticket, label: "Nomor Kursi", value: booking.seat },
  { icon: ShieldCheck, label: "Armada", value: booking.vehicle }
];

const paymentRows = [
  { label: "Harga tiket", value: "Rp300.000" },
  { label: "Biaya layanan", value: "Rp5.000" },
  { label: "Total dibayar", value: "Rp305.000", strong: true }
];

export default function SearchTicket() {
  const [hasSearched, setHasSearched] = useState(false);
  const activeStatus = statuses.find((status) => status.key === booking.status);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-primary mb-2 text-xs font-bold tracking-[0.18em] uppercase">
              Status Tiket
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
              Lacak Booking Travel
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 font-medium text-slate-500 md:text-right">
            Masukkan kode booking dan nomor HP untuk melihat status perjalanan, detail tiket, dan
            akses unduhan tiket digital.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                  <Search className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">Cari Booking</h2>
                  <p className="text-sm font-medium text-slate-500">Tracking tanpa login</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSearch}>
                <div>
                  <label className="mb-2 block text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">
                    Kode Booking
                  </label>
                  <Input
                    placeholder="Contoh: TRV-2408-9321"
                    aria-label="Kode Booking"
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 font-semibold text-slate-900"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-accent-2 hover:bg-accent-2/90 h-12 w-full text-base font-bold text-white shadow-lg shadow-amber-900/10"
                >
                  Cek Status
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <p className="mt-5 text-sm leading-6 text-slate-500">
                Kode booking tersedia di email konfirmasi atau pesan WhatsApp setelah pemesanan
                berhasil.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-950">Status Booking</h2>
              <div className="space-y-3">
                {statuses.map((status) => (
                  <div
                    key={status.key}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold ${status.tone}`}
                  >
                    <span>{status.label}</span>
                    <span className="font-mono text-xs">{status.key}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {hasSearched ? (
              <>
                <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-600">
                          {booking.code}
                        </span>
                        {activeStatus && (
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${activeStatus.tone}`}
                          >
                            {booking.statusLabel}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-slate-950 md:text-4xl">
                        Detail Booking
                      </h2>
                      <div className="mt-4 flex flex-wrap items-center gap-3 text-lg font-bold text-slate-900">
                        <span>Jakarta</span>
                        <ArrowRight className="text-primary size-5" />
                        <span>Bandung</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Berangkat {booking.departureDate}, pukul {booking.departureTime}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 p-4 md:min-w-56">
                      <p className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">
                        Estimasi Tiba
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-950">
                        {booking.arrivalTime}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">{booking.route}</p>
                    </div>
                  </div>

                  <Separator className="my-7" />

                  <div className="grid gap-4 md:grid-cols-5">
                    {timeline.map((item) => (
                      <div key={item.label} className="relative rounded-2xl bg-slate-50 p-4">
                        <div
                          className={`mb-3 flex size-9 items-center justify-center rounded-full ${
                            item.done ? "bg-primary text-white" : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {item.done ? <Check className="size-4" /> : <Clock3 className="size-4" />}
                        </div>
                        <h3 className="text-sm font-bold text-slate-950">{item.label}</h3>
                        <p className="mt-1 text-xs leading-5 font-medium text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                  <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                    <h2 className="mb-5 text-xl font-bold text-slate-950">Informasi Perjalanan</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {tripDetails.map((detail) => {
                        const Icon = detail.icon;

                        return (
                          <div
                            key={detail.label}
                            className="rounded-2xl border border-slate-100 p-4"
                          >
                            <div className="mb-3 flex items-center gap-2 text-slate-500">
                              <Icon className="text-primary size-4" />
                              <p className="text-xs font-bold tracking-[0.14em] uppercase">
                                {detail.label}
                              </p>
                            </div>
                            <p className="text-sm leading-6 font-bold text-slate-950">
                              {detail.value}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <Separator className="my-7" />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-slate-500">
                          <UserRound className="text-primary size-4" />
                          <p className="text-xs font-bold tracking-[0.14em] uppercase">
                            Data Penumpang
                          </p>
                        </div>
                        <p className="text-lg font-bold text-slate-950">{booking.passenger}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {booking.totalPassenger} - Kursi {booking.seat}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-slate-500">
                          <Phone className="text-primary size-4" />
                          <p className="text-xs font-bold tracking-[0.14em] uppercase">Kontak</p>
                        </div>
                        <p className="text-lg font-bold text-slate-950">{booking.phone}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{booking.email}</p>
                      </div>
                    </div>
                  </section>

                  <aside className="space-y-6">
                    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-center gap-3">
                        <CreditCard className="text-primary size-5" />
                        <h2 className="text-xl font-bold text-slate-950">Ringkasan Pembayaran</h2>
                      </div>
                      <div className="space-y-3">
                        {paymentRows.map((row) => (
                          <div
                            key={row.label}
                            className={`flex items-center justify-between gap-4 ${
                              row.strong
                                ? "pt-3 text-base font-bold text-slate-950"
                                : "text-sm font-medium text-slate-500"
                            }`}
                          >
                            <span>{row.label}</span>
                            <span>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="mb-5 flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-slate-950">Tiket Digital</h2>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {booking.ticketNumber}
                          </p>
                        </div>
                        <QrCode className="text-primary size-6" />
                      </div>

                      <div className="mx-auto mb-5 grid size-44 grid-cols-5 gap-2 rounded-3xl bg-slate-950 p-4">
                        {Array.from({ length: 25 }).map((_, index) => (
                          <span
                            key={index}
                            className={`rounded-sm ${
                              [0, 1, 3, 5, 6, 8, 11, 12, 14, 16, 18, 19, 21, 23, 24].includes(index)
                                ? "bg-white"
                                : "bg-primary"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 text-center">
                        <p className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">
                          Tunjukkan saat boarding
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-950">
                          {booking.passenger} - {booking.seat}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        className="bg-primary hover:bg-primary/90 mt-5 h-12 w-full text-base font-bold text-white"
                      >
                        <Download className="size-4" />
                        Unduh Tiket
                      </Button>
                    </section>
                  </aside>
                </div>
              </>
            ) : (
              <NotSearchedTicket />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function NotSearchedTicket() {
  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
      <div className="grid min-h-[560px] gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col justify-center">
          <div className="bg-primary/10 text-primary mb-6 flex size-16 items-center justify-center rounded-3xl">
            <Ticket className="size-8" />
          </div>
          <p className="mb-3 text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">
            Belum Dicari
          </p>
          <h2 className="max-w-xl text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Masukkan data booking untuk menampilkan tiket.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-6 font-medium text-slate-500 md:text-base">
            Detail perjalanan, status pembayaran, QR tiket, dan tombol unduh akan muncul di area ini
            setelah kode booking berhasil ditemukan.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { step: "01", title: "Kode Booking", text: "Gunakan kode dari konfirmasi pesanan." },
              { step: "02", title: "Nomor HP", text: "Masukkan nomor yang dipakai saat booking." },
              { step: "03", title: "Cek Status", text: "Tiket digital akan tampil di sini." }
            ].map((item) => (
              <div key={item.step} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-primary mb-3 font-mono text-xs font-bold">{item.step}</p>
                <h3 className="text-sm font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 font-medium text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">
                  Preview Tiket
                </p>
                <p className="mt-2 text-lg font-bold text-slate-300">TRV-XXXX-XXXX</p>
              </div>
              <QrCode className="size-7 text-slate-300" />
            </div>

            <div className="mx-auto mb-5 grid size-40 grid-cols-5 gap-2 rounded-3xl bg-slate-200 p-4">
              {Array.from({ length: 25 }).map((_, index) => (
                <span
                  key={index}
                  className={`rounded-sm ${index % 3 === 0 ? "bg-white" : "bg-slate-300"}`}
                />
              ))}
            </div>

            <div className="space-y-3">
              <div className="h-4 rounded-full bg-slate-200" />
              <div className="h-4 w-3/4 rounded-full bg-slate-200" />
              <div className="h-11 rounded-2xl bg-slate-200" />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary size-5" />
              <div>
                <h3 className="font-bold text-slate-950">Data booking aman</h3>
                <p className="mt-1 text-sm leading-5 font-medium text-slate-500">
                  Hanya kode booking dan nomor HP yang digunakan untuk pencarian.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
