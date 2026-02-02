"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PassengerForm } from "@/components/public/passenger-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPickupSelector } from "@/components/public/map-pickup-selector";
import { MapDropoffSelector } from "@/components/public/map-dropoff-selector";
import { LatLngExpression } from "leaflet";

export default function PassengerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("tripId") || "";
  const seats = searchParams.get("seats") || "";
  const seatCount = seats.split(",").filter(Boolean).length;

  const [step, setStep] = useState<"passengers" | "locations">("passengers");

  const [pickupCoordinate, setPickupCoordinate] = useState<LatLngExpression>([
    0, 0,
  ]);
  const [dropoffCoordinate, setDropoffCoordinate] = useState<LatLngExpression>([
    0, 0,
  ]);

  const handlePassengerSubmit = () => {
    setStep("locations");
  };

  const handleLocationSubmit = () => {
    router.push(
      `/payment?tripId=${tripId}&seats=${seats}&pickup=${pickupCoordinate}&dropoff=${dropoffCoordinate}`,
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <div className="container px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold text-foreground">
                  {step === "passengers"
                    ? "Passenger Information"
                    : "Pickup & Dropoff"}
                </h1>
                <p className="text-muted-foreground">
                  {step === "passengers"
                    ? `Enter details for ${seatCount} passenger${seatCount > 1 ? "s" : ""}`
                    : "Select your preferred pickup and dropoff locations"}
                </p>
              </div>

              {step === "passengers" ? (
                <PassengerForm
                  count={seatCount}
                  onSubmit={handlePassengerSubmit}
                />
              ) : (
                <div className="space-y-4">
                  <MapPickupSelector
                    title="Pilih Lokasi Penjemputan"
                    pickupCoordinate={pickupCoordinate}
                    setPickupCoordinate={setPickupCoordinate}
                  />
                  <MapDropoffSelector
                    title="Pilih Lokasi Pengantaran"
                    dropoffCoordinate={dropoffCoordinate}
                    setDropoffCoordinate={setDropoffCoordinate}
                  />
                  <div className="mt-6 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("passengers")}
                      className="flex-1"
                    >
                      Back to Passengers
                    </Button>
                    <Button onClick={handleLocationSubmit} className="flex-1">
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20 p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Booking Summary
                </h3>

                <div className="space-y-3 border-b border-border pb-4 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trip</span>
                    <span className="font-semibold text-foreground">
                      Jakarta → Bandung
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-semibold text-foreground">
                      Jan 15, 2025
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Departure</span>
                    <span className="font-semibold text-foreground">
                      08:00 AM
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Passengers</span>
                    <span className="font-semibold text-foreground">
                      {seatCount}
                    </span>
                  </div>
                </div>

                <div className="mb-6 flex justify-between">
                  <span className="font-semibold text-foreground">
                    Total Price
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    Rp {(45000 * seatCount).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>✓ Booking protection included</p>
                  <p>✓ Free cancellation up to 24h</p>
                  <p>✓ Instant confirmation</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
