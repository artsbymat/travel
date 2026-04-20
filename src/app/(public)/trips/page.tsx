"use client";

import { useState, useMemo } from "react";
import { TripCard } from "@/components/public/trip-card";
import { TripFilters } from "@/components/public/trip-filters";
import { City, ComboboxCitySearch } from "@/components/public/combobox-city-search";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import InputNumber from "@/components/public/input-number";
import { Button } from "@/components/ui/button";
import { Search, Settings2 } from "lucide-react";
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

const cities: City[] = [
  { code: "JKT", name: "Jakarta", province: "DKI Jakarta" },
  { code: "BDG", name: "Bandung", province: "West Java" },
  { code: "SBY", name: "Surabaya", province: "East Java" },
  { code: "DPS", name: "Denpasar", province: "Bali" },
  { code: "MLG", name: "Malang", province: "East Java" }
];

const SAMPLE_TRIPS: Trip[] = [
  {
    id: "1",
    origin: "Jakarta",
    destination: "Bandung",
    provider: "Toyota Hiace Super Grandia",
    departureTime: "08:00 AM",
    duration: "3 jam",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
    features: ["AC", "WiFi", "Port USB", "Kursi Reclining"],
    amenities: ["AC", "WiFi", "Port USB", "Kursi Reclining"],
    pricePerSeat: 150000,
    availableSeats: 4,
    totalSeats: 12,
    vehicleType: "KELAS PREMIUM",
    description:
      "Pengalaman perjalanan eksekutif terbaik. Menampilkan kursi kapten khusus, ventilasi AC individual, dan arsitektur kabin kedap suara untuk kenyamanan perjalanan jauh."
  },
  {
    id: "2",
    origin: "Jakarta",
    destination: "Bandung",
    provider: "Toyota Innova Zenix",
    departureTime: "10:00 AM",
    duration: "3 jam",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
    features: ["AC", "WiFi", "Port USB"],
    amenities: ["AC", "WiFi", "Port USB"],
    pricePerSeat: 120000,
    availableSeats: 2,
    totalSeats: 6,
    vehicleType: "KELAS BISNIS",
    description:
      "Keseimbangan antara kenyamanan dan efisiensi. Sangat cocok untuk pelancong bisnis yang menghargai privasi dan perjalanan yang mulus dengan kursi ergonomis untuk hingga 6 penumpang."
  },
  {
    id: "3",
    origin: "Jakarta",
    destination: "Bandung",
    provider: "Toyota Avanza",
    departureTime: "01:00 PM",
    duration: "3.5 jam",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
    features: ["AC", "Tol"],
    amenities: ["AC", "Tol"],
    pricePerSeat: 80000,
    availableSeats: 7,
    totalSeats: 7,
    vehicleType: "KELAS EKONOMI",
    description:
      "Perjalanan yang andal dan esensial. Pilihan kami yang paling hemat biaya untuk perjalanan singkat tanpa mengorbankan standar keselamatan dan perawatan armada."
  }
];

export default function TripsPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date());
  const [passengers, setPassengers] = useState(1);
  const [minPrice, setMinPrice] = useState(50000);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  const filteredTrips = useMemo(() => {
    return SAMPLE_TRIPS.filter((trip) => {
      const priceMatch = trip.pricePerSeat >= minPrice && trip.pricePerSeat <= maxPrice;
      return priceMatch;
    });
  }, [minPrice, maxPrice, selectedCapacity, selectedAmenities]);

  const handleSearch = (e: SubmitEvent<HTMLFormElement>) => {
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

  const handleSelectTrip = (tripId: string) => {
    console.log("Selected trip:", tripId);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div>
          <form
            onSubmit={handleSearch}
            className="mb-8 flex w-full flex-col items-start justify-center gap-4 rounded-3xl bg-white p-4 pt-6 text-left shadow-xl md:flex-row"
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
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {filteredTrips.length > 0 ? (
                    filteredTrips.map((trip) => (
                      <TripCard key={trip.id} {...trip} onSelectTrip={handleSelectTrip} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-gray-100 bg-white p-20 text-center">
                      <p className="font-bold tracking-widest text-gray-400 uppercase">
                        Tidak ada kendaraan yang cocok dengan filter
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
