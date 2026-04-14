"use client";

import { useState } from "react";

interface TripFiltersProps {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  onDepartureTimeChange: (time: string | null) => void;
}

const DEPARTURE_TIMES = [
  { label: "Pagi (5am - 12pm)", value: "morning" },
  { label: "Sore (12pm - 5pm)", value: "afternoon" },
  { label: "Malam (5pm - 11pm)", value: "evening" }
];

export function TripFilters({
  minPrice,
  maxPrice,
  onPriceChange,
  onDepartureTimeChange
}: TripFiltersProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const handleTimeChange = (time: string) => {
    const newTime = selectedTime === time ? null : time;
    setSelectedTime(newTime);
    onDepartureTimeChange(newTime);
  };

  const handlePriceChange = () => {
    onPriceChange(localMinPrice, localMaxPrice);
  };

  return (
    <div className="bg-card border-border space-y-6 rounded-lg border p-6">
      <div>
        <h3 className="text-foreground mb-4 text-lg font-semibold">Rentang Harga</h3>
        <div className="space-y-4">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">
              Min: Rp {localMinPrice.toLocaleString("id-ID")}
            </label>
            <input
              type="range"
              min="0"
              max="500000"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(Number(e.target.value))}
              onMouseUp={handlePriceChange}
              onTouchEnd={handlePriceChange}
              className="bg-muted accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
            />
          </div>
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">
              Maks: Rp {localMaxPrice.toLocaleString("id-ID")}
            </label>
            <input
              type="range"
              min="0"
              max="500000"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
              onMouseUp={handlePriceChange}
              onTouchEnd={handlePriceChange}
              className="bg-muted accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="border-border border-t pt-6">
        <h3 className="text-foreground mb-4 text-lg font-semibold">Waktu Keberangkatan</h3>
        <div className="space-y-3">
          {DEPARTURE_TIMES.map((time) => (
            <label key={time.value} className="group flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={selectedTime === time.value}
                onChange={() => handleTimeChange(time.value)}
                className="border-border accent-primary h-4 w-4 cursor-pointer rounded"
              />
              <span className="text-foreground group-hover:text-primary ml-3 text-sm transition-colors">
                {time.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
