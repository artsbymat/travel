"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Star,
  Clock,
  Users,
  Wifi,
  Wind,
  Zap,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleGallery } from "@/components/public/vehicle-gallery";
import { SeatSelector } from "@/components/public/seat-selector";

const mockTripDetails: Record<
  string,
  {
    id: string;
    vendor: string;
    vendorImage: string;
    vehicleType: string;
    vehicleImage: string;
    capacity: number;
    rating: number;
    reviews: number;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    pricePerSeat: number;
    facilities: { name: string; icon: any; description: string }[];
    occupiedSeats: number[];
    description: string;
  }
> = {
  "trip-1": {
    id: "trip-1",
    vendor: "Ramayana Express",
    vendorImage: "/placeholder.svg",
    vehicleType: "HiAce",
    vehicleImage: "/placeholder.svg",
    capacity: 13,
    rating: 4.8,
    reviews: 324,
    from: "Jakarta",
    to: "Bandung",
    departureTime: "08:00 AM",
    arrivalTime: "11:30 AM",
    duration: "3h 30m",
    pricePerSeat: 45000,
    facilities: [
      { name: "AC", icon: Wind, description: "Full air conditioning" },
      { name: "WiFi", icon: Wifi, description: "Free WiFi throughout" },
      {
        name: "USB Charging",
        icon: Zap,
        description: "USB ports for all seats",
      },
      {
        name: "Reclining Seats",
        icon: Users,
        description: "Comfortable reclining seats",
      },
    ],
    occupiedSeats: [2, 5, 7, 9, 11],
    description:
      "Experience comfort and convenience with Ramayana Express. Our fleet of modern HiAce vehicles ensures a smooth journey with experienced drivers and excellent customer service.",
  },
};

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const trip = mockTripDetails[id] || mockTripDetails["trip-1"];

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const handleContinue = () => {
    router.push(`/passenger?tripId=${id}&seats=${selectedSeats.join(",")}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 max-w-7xl mx-auto">
        {/* Content */}
        <div className="container px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Images, Details, Facilities */}
            <div className="lg:col-span-2 space-y-8">
              {/* Vehicle Gallery */}
              <VehicleGallery
                images={[
                  "https://res.cloudinary.com/dlxiuvlm3/image/upload/v1767852561/Other/keunggulan-toyota-hiace.jpg",
                  "https://res.cloudinary.com/dlxiuvlm3/image/upload/v1767853099/Other/WhatsApp-Image-2024-01-25-at-09.29.20-1.jpg",
                  "https://res.cloudinary.com/dlxiuvlm3/image/upload/v1767853177/Other/Isuzu-Elf-Microbus-Muat-10-Orang.webp",
                ]}
              />

              {/* Basic Trip Info */}
              <Card className="p-6">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h1 className="mb-2 text-2xl font-bold text-foreground">
                      {trip.vendor}
                    </h1>
                    <p className="text-muted-foreground">
                      {trip.vehicleType} • {trip.capacity} Seats
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <span className="font-bold text-chart-2 text-lg">
                        {trip.rating}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {trip.reviews} reviews
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {trip.description}
                </p>
                <h2 className="mb-6 text-lg font-semibold text-foreground">
                  Vehicle Facilities
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {trip.facilities.map((facility) => {
                    const Icon = facility.icon;
                    return (
                      <div
                        key={facility.name}
                        className="flex gap-4 rounded-lg bg-secondary/30 p-4"
                      >
                        <div className="flex-shrink-0">
                          <div className="inline-block rounded-lg bg-primary/10 p-3">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {facility.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {facility.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Column - Booking Summary */}
            <div className="lg:col-span-1">
              {/* Journey Details */}
              <Card className="p-6">
                <h2 className="mb-6 text-lg font-semibold text-foreground">
                  Journey Details
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                      From
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {trip.from}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <Clock className="h-5 w-5 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {trip.duration}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                      To
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {trip.to}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-between gap-4 border-t border-border pt-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                      Departure
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {trip.departureTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
                      Arrival
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {trip.arrivalTime}
                    </p>
                  </div>
                </div>
              </Card>
              {/* Seat Selection */}
              <SeatSelector
                totalSeats={trip.capacity}
                occupiedSeats={trip.occupiedSeats}
                onSeatsSelect={setSelectedSeats}
              />

              <Card className="p-6 mt-8">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Booking Summary
                </h3>

                <div className="space-y-4 border-b border-border pb-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Price per Seat
                    </span>
                    <span className="font-semibold text-foreground">
                      Rp {trip.pricePerSeat.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Number of Seats
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedSeats.length}
                    </span>
                  </div>
                </div>

                <div className="mb-6 flex justify-between">
                  <span className="font-semibold text-foreground">
                    Total Price
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    Rp{" "}
                    {(
                      trip.pricePerSeat * selectedSeats.length
                    ).toLocaleString()}
                  </span>
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={selectedSeats.length === 0}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-50"
                >
                  Continue to Passenger Info
                </Button>

                <div className="mt-6 space-y-3 border-t border-border pt-6">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                    <div className="text-sm">
                      <p className="font-semibold text-foreground">
                        Need Help?
                      </p>
                      <p className="text-muted-foreground">
                        Contact vendor support
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
