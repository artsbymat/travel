"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Passenger {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface PassengerFormProps {
  count: number;
  onSubmit?: (passengers: Passenger[]) => void;
}

export function PassengerForm({ count, onSubmit }: PassengerFormProps) {
  const [passengers, setPassengers] = useState<Passenger[]>(
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: "",
      phone: "",
      email: "",
    })),
  );

  const [activeTab, setActiveTab] = useState(1);

  const handleInputChange = (
    passengerId: number,
    field: keyof Passenger,
    value: string,
  ) => {
    setPassengers((prev) =>
      prev.map((p) => (p.id === passengerId ? { ...p, [field]: value } : p)),
    );
  };

  const isPassengerComplete = (passenger: Passenger) => {
    return (
      passenger.name.trim() !== "" &&
      passenger.phone.trim() !== "" &&
      passenger.email.trim() !== ""
    );
  };

  const allPassengersComplete = passengers.every(isPassengerComplete);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        {passengers.map((passenger, idx) => (
          <button
            key={passenger.id}
            onClick={() => setActiveTab(passenger.id)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === passenger.id
                ? "border-primary text-primary"
                : isPassengerComplete(passenger)
                  ? "border-transparent text-foreground hover:text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="hidden md:inline">Passenger {idx + 1}</span>
            <span className="md:hidden">P{idx + 1}</span>
            {isPassengerComplete(passenger) && (
              <span className="ml-2 text-primary">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Form for Active Tab */}
      {passengers.map(
        (passenger) =>
          activeTab === passenger.id && (
            <Card key={passenger.id} className="p-6">
              <h3 className="mb-6 text-lg font-semibold text-foreground">
                Passenger {passenger.id} Information
              </h3>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={passenger.name}
                    onChange={(e) =>
                      handleInputChange(passenger.id, "name", e.target.value)
                    }
                    className="w-full"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    placeholder="+62 812 3456 7890"
                    value={passenger.phone}
                    onChange={(e) =>
                      handleInputChange(passenger.id, "phone", e.target.value)
                    }
                    className="w-full"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={passenger.email}
                    onChange={(e) =>
                      handleInputChange(passenger.id, "email", e.target.value)
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              {passengers.length > 1 && (
                <div className="mt-8 flex gap-3 justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab(Math.max(1, activeTab - 1))}
                    disabled={activeTab === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      setActiveTab(Math.min(passengers.length, activeTab + 1))
                    }
                    disabled={activeTab === passengers.length}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card>
          ),
      )}

      {/* Submit Button */}
      <Button
        onClick={() => onSubmit?.(passengers)}
        disabled={!allPassengersComplete}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base disabled:opacity-50"
      >
        Continue to Pickup & Dropoff
      </Button>
    </div>
  );
}
