/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { TripCard } from "@/components/public/trip-card";
import { TripFilters } from "@/components/public/trip-filters";
import { City, ComboboxCitySearch } from "@/components/public/combobox-city-search";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import InputNumber from "@/components/public/input-number";
import { Button } from "@/components/ui/button";
import { Search, Settings2, Loader2, Compass } from "lucide-react";
import { DatePicker } from "@/components/public/date-picker";
import type { SubmitEvent } from "react";

interface Trip {
  id: string;
  origin: string;
  destination: string;
  provider: string;
  departureTime: string;
  duration: string;
  imageUrl: string;
  features: string[];
  amenities: string[];
  pricePerSeat: number;
  availableSeats: number;
  totalSeats: number;
  vehicleType: string;
  description: string;
}

function TripsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search filter states
  const [cities, setCities] = useState<City[]>([]);
  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [passengers, setPassengers] = useState(1);
  const [minPrice, setMinPrice] = useState(50000);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("price-asc");

  // Dynamic lists and status states
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);

  // 1. Fetch cities from database on mount
  useEffect(() => {
    async function loadCities() {
      try {
        setLoadingCities(true);
        const res = await fetch("/api/cities?limit=100");
        if (res.ok) {
          const data = await res.json();
          // Map backend schema (id, name, code, province) to front-end City format
          const formatted = data.map((c: any) => ({
            code: c.code || c.id,
            name: c.name,
            province: c.province?.name || ""
          }));
          setCities(formatted);
        }
      } catch (err) {
        console.error("Failed to load cities from DB:", err);
      } finally {
        setLoadingCities(false);
      }
    }
    loadCities();
  }, []);

  // 2. Extract and pre-fill search fields from URL search parameters on load/change
  useEffect(() => {
    const urlOrigin = searchParams.get("origin");
    const urlDest = searchParams.get("destination");
    const urlDate = searchParams.get("date");
    const urlPassengers = searchParams.get("passengers");

    if (urlOrigin) {
      const match = cities.find(
        (c) =>
          c.code.toLowerCase() === urlOrigin.toLowerCase() ||
          c.name.toLowerCase() === urlOrigin.toLowerCase()
      );
      if (match) {
        setOrigin(match);
      } else {
        // Fetch city details from API by code/ID
        fetch(`/api/cities?q=${encodeURIComponent(urlOrigin)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data && data.length > 0) {
              const c = data[0];
              setOrigin({
                code: c.code || c.id,
                name: c.name,
                province: c.province?.name || ""
              });
            } else {
              setOrigin({ code: urlOrigin, name: urlOrigin, province: "" });
            }
          })
          .catch(() => {
            setOrigin({ code: urlOrigin, name: urlOrigin, province: "" });
          });
      }
    }
    if (urlDest) {
      const match = cities.find(
        (c) =>
          c.code.toLowerCase() === urlDest.toLowerCase() ||
          c.name.toLowerCase() === urlDest.toLowerCase()
      );
      if (match) {
        setDestination(match);
      } else {
        // Fetch city details from API by code/ID
        fetch(`/api/cities?q=${encodeURIComponent(urlDest)}`)
          .then((r) => r.json())
          .then((data) => {
            if (data && data.length > 0) {
              const c = data[0];
              setDestination({
                code: c.code || c.id,
                name: c.name,
                province: c.province?.name || ""
              });
            } else {
              setDestination({ code: urlDest, name: urlDest, province: "" });
            }
          })
          .catch(() => {
            setDestination({ code: urlDest, name: urlDest, province: "" });
          });
      }
    }
    if (urlDate) {
      try {
        setDepartureDate(parseISO(urlDate));
      } catch (e) {}
    }
    if (urlPassengers) {
      const pCount = Number(urlPassengers);
      if (Number.isFinite(pCount) && pCount > 0) {
        setPassengers(pCount);
      }
    }
  }, [searchParams, cities]);

  // 3. Fetch matching trips whenever URL search parameters change
  useEffect(() => {
    const urlOrigin = searchParams.get("origin");
    const urlDest = searchParams.get("destination");
    const urlDate = searchParams.get("date");
    const urlPassengers = searchParams.get("passengers") || "1";

    if (!urlOrigin || !urlDest || !urlDate) return;

    async function loadTrips() {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          origin: urlOrigin || "",
          destination: urlDest || "",
          date: urlDate || "",
          passengers: urlPassengers
        });
        const res = await fetch(`/api/public/trips?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTrips(data);
        }
      } catch (err) {
        console.error("Error loading trips:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTrips();
  }, [searchParams]);

  // 4. Client-side sorting & filters (price, capacity, amenities)
  const filteredTrips = useMemo(() => {
    const filtered = trips.filter((trip) => {
      const priceMatch = trip.pricePerSeat >= minPrice && trip.pricePerSeat <= maxPrice;
      const capacityMatch = !selectedCapacity
        ? true
        : selectedCapacity === "micro"
          ? trip.totalSeats <= 6
          : selectedCapacity === "medium"
            ? trip.totalSeats > 6 && trip.totalSeats <= 12
            : trip.totalSeats > 12;

      const amenitiesMatch = selectedAmenities.every((amenity) =>
        trip.amenities.some((a) => a.toLowerCase().includes(amenity.toLowerCase()))
      );

      return priceMatch && capacityMatch && amenitiesMatch;
    });

    // Sort the filtered results
    return [...filtered].sort((a, b) => {
      if (sortBy === "price-asc") {
        return a.pricePerSeat - b.pricePerSeat;
      } else if (sortBy === "price-desc") {
        return b.pricePerSeat - a.pricePerSeat;
      }
      return 0;
    });
  }, [trips, minPrice, maxPrice, selectedCapacity, selectedAmenities, sortBy]);

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!origin || !destination || !departureDate) {
      alert("Kota asal, kota tujuan, dan tanggal keberangkatan wajib diisi.");
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

  const handleSelectTrip = (tripId: string) => {
    router.push(`/trips/${tripId}?passengers=${passengers}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-6 pt-28 pb-12">
        <div>
          <form
            onSubmit={handleSearch}
            className="mb-8 flex w-full flex-col items-start justify-center gap-4 rounded-3xl bg-white p-4 pt-6 text-left shadow-xl md:flex-row"
          >
            {/* Origin */}
            <div className="flex w-full flex-col md:w-auto">
              <label
                htmlFor="origin"
                className="mb-1 ml-3 text-xs font-bold tracking-wider text-[#0D9488] uppercase"
              >
                Kota Asal
              </label>
              <ComboboxCitySearch
                id="origin"
                cities={cities}
                value={origin}
                onChange={setOrigin}
                placeholder={loadingCities ? "Loading kota..." : "Pilih kota asal"}
              />
            </div>

            {/* Destination */}
            <div className="flex w-full flex-col md:w-auto">
              <label
                htmlFor="destination"
                className="mb-1 ml-3 text-xs font-bold tracking-wider text-[#0D9488] uppercase"
              >
                Kota Tujuan
              </label>
              <ComboboxCitySearch
                id="destination"
                cities={cities}
                value={destination}
                onChange={setDestination}
                placeholder={loadingCities ? "Loading kota..." : "Pilih kota tujuan"}
              />
            </div>

            {/* Date */}
            <div className="flex flex-col">
              <label className="mb-1 ml-3 text-xs font-bold tracking-wider text-[#0D9488] uppercase">
                Tanggal Perjalanan
              </label>
              <DatePicker date={departureDate} setDate={setDepartureDate} />
            </div>

            {/* Passengers */}
            <div className="flex w-full flex-col md:w-auto">
              <label
                htmlFor="passengers"
                className="mb-1 ml-3 text-xs font-bold tracking-wider text-[#0D9488] uppercase"
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
              disabled={loadingCities}
              className="h-12 w-full cursor-pointer self-end bg-[#8B5E02] font-bold text-white shadow-md transition-all hover:bg-[#744E02] md:h-14 md:w-14 md:rounded-full"
              size="lg"
            >
              <Search className="size-5" />
              <span className="inline font-bold md:hidden">Cari Perjalanan</span>
            </Button>
          </form>

          {/* List Section */}
          <section className="mt-8">
            <div className="md:flex md:items-start md:gap-8">
              {/* Sidebar Filters - Desktop Only */}
              <aside className="hidden w-80 shrink-0 md:block">
                <div className="sticky top-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h3 className="mb-6 text-lg font-bold text-gray-900">Filter</h3>
                  <TripFilters
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onPriceChange={(min, max) => {
                      setMinPrice(min);
                      setMaxPrice(max);
                    }}
                    onCapacityChange={setSelectedCapacity}
                    onAmenitiesChange={setSelectedAmenities}
                    onClearAll={() => {
                      setMinPrice(50000);
                      setMaxPrice(500000);
                      setSelectedCapacity(null);
                      setSelectedAmenities([]);
                    }}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                  />
                </div>
              </aside>

              {/* Main Content Area */}
              <div className="flex-1">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="mb-1 text-3xl font-bold text-gray-900">Armada Tersedia</h2>
                    <p className="text-sm font-medium text-gray-500">
                      {filteredTrips.length} travel ditemukan untuk anda
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsFilterPanelOpen((open) => !open)}
                    variant="outline"
                    className="md:hidden"
                  >
                    <Settings2 />
                    Filter
                  </Button>
                </div>

                {/* Mobile Filters - Mobile Only */}
                <div className="md:hidden">
                  {isFilterPanelOpen && (
                    <div className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                      <TripFilters
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        onPriceChange={(min, max) => {
                          setMinPrice(min);
                          setMaxPrice(max);
                        }}
                        onCapacityChange={setSelectedCapacity}
                        onAmenitiesChange={setSelectedAmenities}
                        onClearAll={() => {
                          setMinPrice(50000);
                          setMaxPrice(500000);
                          setSelectedCapacity(null);
                          setSelectedAmenities([]);
                        }}
                        sortBy={sortBy}
                        onSortByChange={setSortBy}
                      />
                    </div>
                  )}
                </div>

                {/* Live Loading/Trips Render */}
                <div className="space-y-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-24 text-center">
                      <Loader2 className="h-12 w-12 animate-spin text-teal-700" />
                      <p className="mt-4 text-sm font-bold tracking-widest text-gray-500 uppercase">
                        Mencari Jadwal Terbaik...
                      </p>
                    </div>
                  ) : filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => {
                      const originCityMatch = cities.find(c => c.name.toLowerCase() === trip.origin.toLowerCase());
                      const destCityMatch = cities.find(c => c.name.toLowerCase() === trip.destination.toLowerCase());
                      return (
                        <TripCard
                          key={trip.id}
                          {...trip}
                          originProvince={originCityMatch?.province}
                          destinationProvince={destCityMatch?.province}
                          onSelectTrip={handleSelectTrip}
                        />
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white p-20 text-center">
                      <Compass className="h-16 w-16 text-gray-300" />
                      <p className="mt-4 font-bold tracking-widest text-gray-400 uppercase">
                        Tidak ada kendaraan yang cocok
                      </p>
                      <p className="mt-1 text-sm text-gray-400">
                        Coba sesuaikan tanggal, kota asal/tujuan, atau filter pencarian Anda.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-solid border-teal-700 border-t-transparent"></div>
            <p className="mt-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
              Memuat Hasil Pencarian...
            </p>
          </div>
        </div>
      }
    >
      <TripsPageContent />
    </Suspense>
  );
}
