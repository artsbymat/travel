"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface SeatSelectorProps {
  totalSeats: number;
  occupiedSeats: number[];
  onSeatsSelect?: (selectedSeats: number[]) => void;
}

export function SeatSelector({
  totalSeats,
  occupiedSeats = [],
  onSeatsSelect,
}: SeatSelectorProps) {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const handleSeatClick = (seatNumber: number) => {
    if (occupiedSeats.includes(seatNumber)) return;
    setSelectedSeats((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber],
    );
    onSeatsSelect?.(selectedSeats);
  };

  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1);
  const seatsPerRow = 4;
  const rows = Math.ceil(totalSeats / seatsPerRow);

  return (
    <Card className="p-6 mt-8">
      <div className="mb-6">
        <h3 className="mb-4 font-semibold text-foreground">
          Select Your Seats
        </h3>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded border border-border bg-background" />
            <span className="text-xs text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="text-xs text-muted-foreground">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-muted" />
            <span className="text-xs text-muted-foreground">Occupied</span>
          </div>
        </div>
      </div>

      {/* Seat Layout */}
      <div className="inline-block space-y-2">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-2">
            {seats
              .slice(rowIdx * seatsPerRow, (rowIdx + 1) * seatsPerRow)
              .map((seatNumber) => (
                <button
                  key={seatNumber}
                  onClick={() => handleSeatClick(seatNumber)}
                  disabled={occupiedSeats.includes(seatNumber)}
                  className={`h-8 w-8 rounded border text-xs font-medium transition-colors ${
                    selectedSeats.includes(seatNumber)
                      ? "bg-primary border-primary text-primary-foreground"
                      : occupiedSeats.includes(seatNumber)
                        ? "bg-muted border-border text-muted-foreground cursor-not-allowed"
                        : "border-border bg-background hover:bg-secondary"
                  }`}
                >
                  {seatNumber}
                </button>
              ))}
          </div>
        ))}
      </div>

      {selectedSeats.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm font-medium text-foreground">
            Selected Seats: {selectedSeats.join(", ")}
          </p>
        </div>
      )}
    </Card>
  );
}
