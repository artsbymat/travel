"use client";

import { useState, useMemo } from "react";
import { TripCard } from "@/components/public/trip-card";
import { TripFilters } from "@/components/public/trip-filters";

interface Trip {
  id: string;
  origin: string;
  destination: string;
  provider: string;
  departureTime: string;
  duration: string;
  imageUrl: string;
  features: string[];
  pricePerSeat: number;
  availableSeats: number;
  departureTimeCategory: "morning" | "afternoon" | "evening";
}

const SAMPLE_TRIPS: Trip[] = [
  {
    id: "1",
    origin: "Pekanbaru",
    destination: "Padang",
    provider: "Express Travel",
    departureTime: "08:00 AM",
    duration: "6 hours",
    imageUrl: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&h=300&fit=crop",
    features: ["AC", "Reclining Seat", "6 Passengers"],
    pricePerSeat: 150000,
    availableSeats: 3,
    departureTimeCategory: "morning"
  },
  {
    id: "2",
    origin: "Pekanbaru",
    destination: "Padang",
    provider: "Comfort Bus",
    departureTime: "02:00 PM",
    duration: "5.5 hours",
    imageUrl: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&h=300&fit=crop",
    features: ["AC", "WiFi", "USB Charging", "8 Passengers"],
    pricePerSeat: 175000,
    availableSeats: 5,
    departureTimeCategory: "afternoon"
  },
  {
    id: "3",
    origin: "Pekanbaru",
    destination: "Padang",
    provider: "Prime Journey",
    departureTime: "06:30 PM",
    duration: "6 hours",
    imageUrl: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&h=300&fit=crop",
    features: ["AC", "Premium Seats", "Snacks Included", "6 Passengers"],
    pricePerSeat: 200000,
    availableSeats: 2,
    departureTimeCategory: "evening"
  },
  {
    id: "4",
    origin: "Jakarta",
    destination: "Bandung",
    provider: "Elite Transport",
    departureTime: "07:00 AM",
    duration: "3 hours",
    imageUrl: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&h=300&fit=crop",
    features: ["AC", "Reclining Seat", "Luggage Space", "8 Passengers"],
    pricePerSeat: 120000,
    availableSeats: 6,
    departureTimeCategory: "morning"
  },
  {
    id: "5",
    origin: "Jakarta",
    destination: "Bandung",
    provider: "Express Travel",
    departureTime: "01:00 PM",
    duration: "3.5 hours",
    imageUrl: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&h=300&fit=crop",
    features: ["AC", "WiFi", "Power Outlet", "6 Passengers"],
    pricePerSeat: 135000,
    availableSeats: 4,
    departureTimeCategory: "afternoon"
  },
  {
    id: "6",
    origin: "Surabaya",
    destination: "Malang",
    provider: "Prime Journey",
    departureTime: "10:00 AM",
    duration: "2.5 hours",
    imageUrl: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?w=600&h=300&fit=crop",
    features: ["AC", "Comfortable Seats", "Bottled Water", "8 Passengers"],
    pricePerSeat: 95000,
    availableSeats: 7,
    departureTimeCategory: "morning"
  }
];

export default function TripsPage() {
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "duration">("price-low");

  const filteredAndSortedTrips = useMemo(() => {
    let trips = SAMPLE_TRIPS.filter((trip) => {
      const priceMatch = trip.pricePerSeat >= minPrice && trip.pricePerSeat <= maxPrice;
      const timeMatch = !selectedTime || trip.departureTimeCategory === selectedTime;

      return priceMatch && timeMatch;
    });

    // Sort trips
    if (sortBy === "price-low") {
      trips.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
    } else if (sortBy === "price-high") {
      trips.sort((a, b) => b.pricePerSeat - a.pricePerSeat);
    } else if (sortBy === "duration") {
      trips.sort((a, b) => parseFloat(a.duration) - parseFloat(b.duration));
    }

    return trips;
  }, [minPrice, maxPrice, selectedTime, sortBy]);

  const handleSelectTrip = (tripId: string) => {
    console.log("Selected trip:", tripId);
    // Navigate to booking page or show modal
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Page Header */}
      <section className="border-border bg-background border-b py-8">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="mb-2 text-4xl font-light tracking-tight text-pretty">
            Perjalanan Tersedia
          </h1>
          <p className="text-muted-foreground text-pretty">
            Pilih perjalanan yang sesuai dengan kebutuhanmu, dan nikmati perjalanan antar kota
            dengan mudah
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar - Hidden on mobile, shown on lg */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <TripFilters
                minPrice={minPrice}
                maxPrice={maxPrice}
                onPriceChange={(min, max) => {
                  setMinPrice(min);
                  setMaxPrice(max);
                }}
                onDepartureTimeChange={setSelectedTime}
              />
            </div>
          </div>

          {/* Trips List */}
          <div className="lg:col-span-3">
            {/* Sort Control */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Menampilkan {filteredAndSortedTrips.length} perjalanan
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-foreground text-sm font-medium">
                  Urutkan berdasarkan:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "price-low" | "price-high" | "duration")
                  }
                  className="border-input bg-background text-foreground focus:ring-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="price-low">Harga: Rendah ke Tinggi</option>
                  <option value="price-high">Harga: Tinggi ke Rendah</option>
                  <option value="duration">Durasi: Terpendek</option>
                </select>
              </div>
            </div>

            {/* Trips Grid */}
            {filteredAndSortedTrips.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredAndSortedTrips.map((trip) => (
                  <TripCard key={trip.id} {...trip} onSelectTrip={handleSelectTrip} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-center">
                  <h3 className="text-foreground mb-2 text-lg font-semibold">No trips found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to find available trips
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filters - Shown only on mobile */}
        <div className="border-border mt-12 border-t pt-8 lg:hidden">
          <h2 className="text-foreground mb-6 text-lg font-semibold">Filters</h2>
          <TripFilters
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={(min, max) => {
              setMinPrice(min);
              setMaxPrice(max);
            }}
            onDepartureTimeChange={setSelectedTime}
          />
        </div>
      </div>
    </div>
  );
}
