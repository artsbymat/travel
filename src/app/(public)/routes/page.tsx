"use client";

import { useState, Suspense } from "react";
import { SearchFilters } from "@/components/public/search-filters";
import { TripCard } from "@/components/public/trip-card";
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
    imageUrl:
      "https://res.cloudinary.com/dlxiuvlm3/image/upload/v1767852561/Other/keunggulan-toyota-hiace.jpg",
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
    imageUrl:
      "https://res.cloudinary.com/dlxiuvlm3/image/upload/v1767853099/Other/WhatsApp-Image-2024-01-25-at-09.29.20-1.jpg",
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
    imageUrl:
      "https://res.cloudinary.com/dlxiuvlm3/image/upload/v1767853177/Other/Isuzu-Elf-Microbus-Muat-10-Orang.webp",
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
    imageUrl:
      "https://res.cloudinary.com/dlxiuvlm3/image/upload/v1767853243/Other/category_13seater-high-711x533.jpg",
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
    imageUrl:
      "https://res.cloudinary.com/dlxiuvlm3/image/upload/v1767853525/Other/2019-Mercedes-Benz-Metris-passenger-front-three-quarter.jpg",
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 mx-auto max-w-7xl ">
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

              {/* Trip Cards */}
              <div className="space-y-4">
                {mockTrips.map((trip) => (
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
