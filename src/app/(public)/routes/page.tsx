"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchFilters } from "@/components/public/search-filters";
import { TripCard } from "@/components/public/trip-card";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { FormRoute } from "@/components/public/form-route";

const mockTrips = [
  {
    id: "trip-1",
    vendor: "Ramayana Express",
    vehicleType: "HiAce (13 seats)",
    capacity: 13,
    departureTime: "08:00 AM",
    arrivalTime: "11:30 AM",
    pricePerSeat: 45000,
    seatsAvailable: 8,
    rating: 4.8,
    reviews: 324,
    features: ["AC", "WiFi", "USB Charge", "Reclining Seats"],
  },
  {
    id: "trip-2",
    vendor: "Java Express",
    vehicleType: "HiAce (13 seats)",
    capacity: 13,
    departureTime: "10:00 AM",
    arrivalTime: "1:30 PM",
    pricePerSeat: 40000,
    seatsAvailable: 12,
    rating: 4.5,
    reviews: 156,
    features: ["AC", "Reclining Seats", "Luggage Storage"],
  },
  {
    id: "trip-3",
    vendor: "Sinar Jaya",
    vehicleType: "Elf (10 seats)",
    capacity: 10,
    departureTime: "2:00 PM",
    arrivalTime: "5:30 PM",
    pricePerSeat: 35000,
    seatsAvailable: 5,
    rating: 4.3,
    reviews: 89,
    features: ["AC", "WiFi"],
  },
  {
    id: "trip-4",
    vendor: "Pelangi Tours",
    vehicleType: "HiAce (13 seats)",
    capacity: 13,
    departureTime: "4:00 PM",
    arrivalTime: "7:30 PM",
    pricePerSeat: 38000,
    seatsAvailable: 3,
    rating: 4.6,
    reviews: 245,
    features: ["AC", "WiFi", "USB Charge", "Reclining Seats", "Entertainment"],
  },
  {
    id: "trip-5",
    vendor: "Merpati Indah",
    vehicleType: "Van (8 seats)",
    capacity: 8,
    departureTime: "6:00 PM",
    arrivalTime: "9:30 PM",
    pricePerSeat: 42000,
    seatsAvailable: 2,
    rating: 4.7,
    reviews: 178,
    features: ["AC", "Reclining Seats"],
  },
];

function SearchContent() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    date: date ? date.toISOString().split("T")[0] : "",
    passengers: 1,
  });

  const [sortBy, setSortBy] = useState("price");

  const sortedTrips = [...mockTrips].sort((a, b) => {
    if (sortBy === "price") return a.pricePerSeat - b.pricePerSeat;
    if (sortBy === "time")
      return (
        Number.parseInt(a.departureTime) - Number.parseInt(b.departureTime)
      );
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 mx-auto">
        {/* Main Content */}
        <div className="container px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <SearchFilters />
            </div>

            {/* Trip Results */}
            <div className="lg:col-span-3">
              <FormRoute
                formData={formData}
                setFormData={setFormData}
                date={date}
                isDateOpen={isDateOpen}
                setIsDateOpen={setIsDateOpen}
                setDate={setDate}
              />

              {/* Sort Options */}
              <Card className="mb-6 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {mockTrips.length} trips found
                  </p>
                  <div className="flex gap-2">
                    {["price", "time", "rating"].map((option) => (
                      <button
                        key={option}
                        onClick={() => setSortBy(option)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors capitalize ${
                          sortBy === option
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-border"
                        }`}
                      >
                        {option === "price"
                          ? "Cheapest"
                          : option === "time"
                            ? "Earliest"
                            : "Best Rated"}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Trip Cards */}
              <div className="space-y-4">
                {sortedTrips.map((trip) => (
                  <TripCard key={trip.id} {...trip} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Routes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
