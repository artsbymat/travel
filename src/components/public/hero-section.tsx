"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { DatePicker } from "./date-picker";
import { ComboboxCitySearch, City } from "./combobox-city-search";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import InputNumber from "./input-number";
import { Search, Sparkles, MapPin, Calendar, Users, Compass } from "lucide-react";

export default function HeroSection() {
  const router = useRouter();

  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [passengers, setPassengers] = useState(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin || !destination || !departureDate) {
      console.error("Origin, destination, and date are required.");
      return;
    }

    const query = new URLSearchParams({
      origin: origin.code,
      destination: destination.code,
      date: format(departureDate, "yyyy-MM-dd"),
      passengers: passengers.toString()
    });

    router.push(`/trips?${query.toString()}`);
  };

  return (
    <section id="fitur-b2c" className="relative flex min-h-[102vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-50 via-teal-50/20 to-white pt-24 pb-16 dark:from-zinc-950 dark:via-zinc-900/40 dark:to-zinc-950">
      {/* Background Ornaments */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      
      <div className="bg-primary/20 absolute top-24 left-1/4 -z-10 h-72 w-72 rounded-full blur-3xl md:h-96 md:w-96" />
      <div className="bg-accent-2/15 absolute right-1/4 bottom-1/4 -z-10 h-64 w-64 rounded-full blur-3xl md:h-80 md:w-80" />

      <div className="z-10 mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-6 text-center">
        {/* Floating Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-sm animate-fade-in">
          <Sparkles className="size-4 animate-pulse" />
          <span>Solusi Perjalanan & Manajemen Travel Terintegrasi</span>
        </div>

        {/* Hero Copy */}
        <div className="max-w-4xl space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block text-zinc-900 dark:text-white leading-none">
              Jelajahi Rute Terbaik
            </span>
            <span className="mt-2 block bg-gradient-to-r from-primary via-emerald-600 to-accent-2 bg-clip-text pb-2 text-transparent leading-none">
              Mudah, Cepat & Terpercaya
            </span>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg md:text-xl">
            AyoTrip menghubungkan Anda dengan jaringan travel berkualitas. Pesan tiket perjalanan secara instan, atau kelola armada travel Anda dengan software SaaS terbaik.
          </p>
        </div>

        {/* Search Ticket Card */}
        <div className="w-full max-w-5xl rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-2xl shadow-zinc-200/50 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:shadow-none">
          <div className="mb-4 flex items-center gap-2 border-b border-zinc-100 pb-3 text-left dark:border-zinc-800">
            <div className="bg-primary/10 rounded-lg p-1.5 text-primary">
              <Compass className="size-4" />
            </div>
            <h3 className="font-bold text-zinc-800 dark:text-zinc-200">Cari Tiket Perjalanan</h3>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex flex-col items-stretch justify-between gap-4 text-left lg:flex-row"
          >
            {/* Origin */}
            <div className="flex flex-1 flex-col">
              <label
                htmlFor="origin"
                className="mb-1.5 ml-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                <MapPin className="size-3 text-primary" />
                Kota Asal
              </label>
              <ComboboxCitySearch
                id="origin"
                value={origin}
                onChange={setOrigin}
                placeholder="Pilih kota asal..."
              />
            </div>

            {/* Divider Line */}
            <div className="hidden h-12 w-px bg-zinc-200 self-end mb-1 dark:bg-zinc-800 lg:block" />

            {/* Destination */}
            <div className="flex flex-1 flex-col">
              <label
                htmlFor="destination"
                className="mb-1.5 ml-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                <MapPin className="size-3 text-accent-2" />
                Kota Tujuan
              </label>
              <ComboboxCitySearch
                id="destination"
                value={destination}
                onChange={setDestination}
                placeholder="Pilih kota tujuan..."
              />
            </div>

            {/* Divider Line */}
            <div className="hidden h-12 w-px bg-zinc-200 self-end mb-1 dark:bg-zinc-800 lg:block" />

            {/* Date */}
            <div className="flex flex-col min-w-[160px]">
              <label className="mb-1.5 ml-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Calendar className="size-3 text-primary" />
                Keberangkatan
              </label>
              <DatePicker date={departureDate} setDate={setDepartureDate} />
            </div>

            {/* Divider Line */}
            <div className="hidden h-12 w-px bg-zinc-200 self-end mb-1 dark:bg-zinc-800 lg:block" />

            {/* Passengers */}
            <div className="flex flex-col min-w-[120px]">
              <label
                htmlFor="passengers"
                className="mb-1.5 ml-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
              >
                <Users className="size-3 text-primary" />
                Penumpang
              </label>
              <InputNumber
                id="passengers"
                value={passengers}
                onChange={setPassengers}
                className="h-10 rounded-xl"
              />
            </div>

            {/* Search Submit Button */}
            <Button
              type="submit"
              className="bg-accent-2 hover:bg-accent-2/95 text-white h-10 px-6 self-end rounded-xl font-bold shadow-lg shadow-accent-2/20 cursor-pointer w-full lg:w-auto lg:h-10"
              size="lg"
            >
              <Search className="size-4 mr-2" />
              Cari Perjalanan
            </Button>
          </form>
        </div>

        {/* Small Trust Snippet */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            🛡️ Pembayaran Aman 100%
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700 md:inline" />
          <span className="flex items-center gap-1.5">
            ⚡ Tiket Terbit Seketika
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700 md:inline" />
          <span className="flex items-center gap-1.5">
            💬 CS Handal 24/7
          </span>
        </div>
      </div>
    </section>
  );
}

