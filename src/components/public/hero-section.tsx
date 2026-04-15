"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { DatePicker } from "./date-picker";
import { ComboboxCitySearch, City } from "./combobox-city-search";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import InputNumber from "./input-number";
import { Search } from "lucide-react";

export default function HeroSection() {
  const router = useRouter();

  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [passengers, setPassengers] = useState(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin || !destination || !departureDate) {
      // todo: create alert component
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

  const cities: City[] = [
    { code: "JKT", name: "Jakarta", province: "DKI Jakarta" },
    { code: "BDG", name: "Bandung", province: "West Java" },
    { code: "SBY", name: "Surabaya", province: "East Java" },
    { code: "DPS", name: "Denpasar", province: "Bali" },
    { code: "MLG", name: "Malang", province: "East Java" }
  ];

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] items-center bg-[#F5FAF8] md:min-h-[calc(100vh-256px)]">
      <div className="bg-primary absolute top-24 left-16 z-5 hidden h-24 w-[20rem] rounded-4xl blur-3xl md:block" />
      <div className="bg-accent-2 absolute right-16 bottom-24 z-5 hidden h-24 w-64 rounded-4xl blur-3xl md:block" />
      <div className="z-10 mx-auto flex flex-col items-center gap-12 px-4">
        <div className="text-center">
          <h1 className="text-primary mb-6 text-5xl font-extrabold tracking-tighter md:text-6xl">
            Temukan Travel,
          </h1>
          <h2 className="text-accent-2 -mt-4 text-5xl font-extrabold tracking-tighter md:text-6xl">
            Mudah dan Cepat.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-center text-base">
            Temukan perjalanan terbaik dari berbagai penyedia travel terpercaya. Nyaman, fleksibel,
            dan sesuai kebutuhan Anda.
          </p>
        </div>
        <form
          onSubmit={handleSearch}
          className="z-10 mx-auto flex w-full flex-col items-start justify-center gap-4 rounded-3xl bg-white p-4 pt-6 text-left shadow-xl md:max-w-4xl md:flex-row"
        >
          {/* Origin */}
          <div className="flex w-full flex-col md:w-auto">
            <label
              htmlFor="origin"
              className="text-primary mb-1 ml-3 text-xs font-medium uppercase"
            >
              Kota Asal
            </label>
            <ComboboxCitySearch
              id="origin"
              cities={cities}
              value={origin}
              onChange={setOrigin}
              placeholder="Pilih kota asal"
            />
          </div>

          {/* Destination */}
          <div className="flex w-full flex-col md:w-auto">
            <label
              htmlFor="destination"
              className="text-primary mb-1 ml-3 text-xs font-medium uppercase"
            >
              Kota Tujuan
            </label>
            <ComboboxCitySearch
              id="destination"
              cities={cities}
              value={destination}
              onChange={setDestination}
              placeholder="Pilih kota tujuan"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col">
            <label className="text-primary mb-1 ml-3 text-xs font-medium uppercase">
              Tanggal Perjalanan
            </label>
            <DatePicker date={departureDate} setDate={setDepartureDate} />
          </div>

          {/* Passengers */}
          <div className="flex w-full flex-col md:w-auto">
            <label
              htmlFor="passengers"
              className="text-primary mb-1 ml-3 text-xs font-medium uppercase"
            >
              Jumlah Penumpang
            </label>
            <InputNumber
              id="passengers"
              value={passengers}
              onChange={setPassengers}
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            className="bg-accent-2 hover:bg-accent-2/90 h-12 w-full cursor-pointer self-end md:h-14 md:w-14 md:rounded-full"
            size="lg"
          >
            <Search className="size-5" />
            <span className="inline md:hidden">Cari Perjalanan</span>
          </Button>
        </form>
      </div>
    </section>
  );
}
