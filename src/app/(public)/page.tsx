"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Header from "@/components/public/Header";

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search:", { origin, destination, date, passengers });
  };

  const cities = [
    "Jakarta",
    "Bandung",
    "Surabaya",
    "Yogyakarta",
    "Medan",
    "Semarang",
    "Palembang",
    "Makassar",
    "Denpasar",
    "Balikpapan"
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Header />
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="text-foreground mb-6 text-4xl font-light tracking-tight text-pretty md:text-5xl">
            Temukan Perjalanan Travel
          </h1>
          <p className="text-muted-foreground mb-12 text-lg text-pretty">
            Antar kota dengan mudah dan cepat
          </p>

          {/* Search Form Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg md:p-10">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Origin City */}
              <div className="text-left">
                <label className="text-foreground mb-3 block text-sm font-medium">Kota Asal</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  required
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                >
                  <option value="">Pilih Kota Asal</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination City */}
              <div className="text-left">
                <label className="text-foreground mb-3 block text-sm font-medium">
                  Kota Tujuan
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  required
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                >
                  <option value="">Pilih Kota Tujuan</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure Date */}
              <div className="text-left">
                <label className="text-foreground mb-3 block text-sm font-medium">
                  Tanggal Keberangkatan
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Passengers */}
              <div className="text-left">
                <label className="text-foreground mb-3 block text-sm font-medium">
                  Jumlah Penumpang
                </label>
                <input
                  type="number"
                  value={passengers}
                  onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value)))}
                  min="1"
                  required
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-3 transition-all focus:border-transparent focus:ring-2 focus:outline-none"
                />
              </div>

              {/* Search Button */}
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 w-full rounded-lg py-3 font-medium text-white transition-all"
              >
                Cari Perjalanan
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
