"use client";

import { useState, useMemo } from "react";
import { TripCard } from "@/components/public/trip-card";
import { TripFilters } from "@/components/public/trip-filters";
import { LayoutGrid, List } from "lucide-react";

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
    description: "Pengalaman perjalanan eksekutif terbaik. Menampilkan kursi kapten khusus, ventilasi AC individual, dan arsitektur kabin kedap suara untuk kenyamanan perjalanan jauh."
  },
  {
    id: "2",
    origin: "Jakarta",
    destination: "Bandung",
    provider: "Toyota Innova Zenix",
    departureTime: "10:00 AM",
    duration: "3 jam",
    imageUrl: "https://images.unsplash.com/photo-1559297434-2d8a134e0428?w=800&q=80",
    features: ["AC", "WiFi", "Port USB"],
    amenities: ["AC", "WiFi", "Port USB"],
    pricePerSeat: 120000,
    availableSeats: 2,
    totalSeats: 6,
    vehicleType: "KELAS BISNIS",
    description: "Keseimbangan antara kenyamanan dan efisiensi. Sangat cocok untuk pelancong bisnis yang menghargai privasi dan perjalanan yang mulus dengan kursi ergonomis untuk hingga 6 penumpang."
  },
  {
    id: "3",
    origin: "Jakarta",
    destination: "Bandung",
    provider: "Toyota Avanza",
    departureTime: "01:00 PM",
    duration: "3.5 jam",
    imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
    features: ["AC"],
    amenities: ["AC"],
    pricePerSeat: 80000,
    availableSeats: 7,
    totalSeats: 7,
    vehicleType: "KELAS EKONOMI",
    description: "Perjalanan yang andal dan esensial. Pilihan kami yang paling hemat biaya untuk perjalanan singkat tanpa mengorbankan standar keselamatan dan perawatan armada."
  }
];

export default function TripsPage() {
  const [minPrice, setMinPrice] = useState(50000);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const filteredTrips = useMemo(() => {
    return SAMPLE_TRIPS.filter((trip) => {
      const priceMatch = trip.pricePerSeat >= minPrice && trip.pricePerSeat <= maxPrice;
      return priceMatch;
    });
  }, [minPrice, maxPrice, selectedCapacity, selectedAmenities]);

  const handleSelectTrip = (tripId: string) => {
    console.log("Selected trip:", tripId);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
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
          </aside>

          {/* List Section */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">Armada Tersedia</h2>
                <p className="text-gray-500 text-sm font-medium">
                  {filteredTrips.length} travel ditemukan untuk anda
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => (
                  <TripCard key={trip.id} {...trip} onSelectTrip={handleSelectTrip} />
                ))
              ) : (
                <div className="bg-white rounded-2xl p-20 text-center border border-gray-100">
                   <p className="text-gray-400 font-bold uppercase tracking-widest">Tidak ada kendaraan yang cocok dengan filter</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
