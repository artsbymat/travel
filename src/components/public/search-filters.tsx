"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

interface SearchFiltersProps {
  onFilterChange?: (filters: any) => void;
}

export function SearchFilters({}: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    time: true,
    vehicle: true,
    price: true,
    rating: true,
  });

  const [filters, setFilters] = useState({
    timeSlots: [] as string[],
    vehicleTypes: [] as string[],
    priceRange: [0, 150000],
    minRating: 0,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (
    type: "timeSlots" | "vehicleTypes",
    value: string,
  ) => {
    setFilters((prev) => {
      const array = prev[type];
      const newArray = array.includes(value)
        ? array.filter((v) => v !== value)
        : [...array, value];
      return { ...prev, [type]: newArray };
    });
  };

  return (
    <div className="space-y-4 h-screen sticky top-4">
      {/* Departure Time Filter */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection("time")}
          className="flex w-full items-center justify-between font-semibold text-foreground"
        >
          Departure Time
          <ChevronDown
            className={`h-5 w-5 transition-transform ${expandedSections.time ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.time && (
          <div className="mt-4 space-y-3">
            {[
              "Morning (6AM-12PM)",
              "Afternoon (12PM-6PM)",
              "Evening (6PM-11PM)",
              "Night (11PM-5AM)",
            ].map((time) => (
              <label
                key={time}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={filters.timeSlots.includes(time)}
                  onCheckedChange={() =>
                    handleCheckboxChange("timeSlots", time)
                  }
                />
                <span className="text-sm text-muted-foreground">{time}</span>
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Vehicle Type Filter */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection("vehicle")}
          className="flex w-full items-center justify-between font-semibold text-foreground"
        >
          Vehicle Type
          <ChevronDown
            className={`h-5 w-5 transition-transform ${expandedSections.vehicle ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.vehicle && (
          <div className="mt-4 space-y-3">
            {["HiAce (10-15 seats)", "Elf (5-10 seats)", "Van (6-8 seats)"].map(
              (type) => (
                <label
                  key={type}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.vehicleTypes.includes(type)}
                    onCheckedChange={() =>
                      handleCheckboxChange("vehicleTypes", type)
                    }
                  />
                  <span className="text-sm text-muted-foreground">{type}</span>
                </label>
              ),
            )}
          </div>
        )}
      </Card>

      {/* Price Range Filter */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between font-semibold text-foreground"
        >
          Price Range
          <ChevronDown
            className={`h-5 w-5 transition-transform ${expandedSections.price ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.price && (
          <div className="mt-4 space-y-4">
            <Slider
              defaultValue={[0, 150000]}
              max={150000}
              step={5000}
              className="w-full"
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  priceRange: value as [number, number],
                }))
              }
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Rp {filters.priceRange[0].toLocaleString()}</span>
              <span>Rp {filters.priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Vendor Rating Filter */}
      <Card className="p-4">
        <button
          onClick={() => toggleSection("rating")}
          className="flex w-full items-center justify-between font-semibold text-foreground"
        >
          Vendor Rating
          <ChevronDown
            className={`h-5 w-5 transition-transform ${expandedSections.rating ? "rotate-180" : ""}`}
          />
        </button>
        {expandedSections.rating && (
          <div className="mt-4 space-y-3">
            {[
              { label: "4.5+ stars", value: 4.5 },
              { label: "4.0+ stars", value: 4 },
              { label: "3.5+ stars", value: 3.5 },
              { label: "Any rating", value: 0 },
            ].map(({ label, value }) => (
              <label
                key={label}
                className="flex items-center gap-3 cursor-pointer"
              >
                <Checkbox
                  checked={filters.minRating === value}
                  onCheckedChange={() =>
                    setFilters((prev) => ({ ...prev, minRating: value }))
                  }
                />
                <span className="text-sm text-muted-foreground">{label}</span>
              </label>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
