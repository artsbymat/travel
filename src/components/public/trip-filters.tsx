"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { Wifi, AirVent, Usb, Road } from "lucide-react";
import InputPrice from "./input-price";

interface TripFiltersProps {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  onCapacityChange: (capacity: string | null) => void;
  onAmenitiesChange: (amenities: string[]) => void;
  onClearAll: () => void;
}

const CAPACITIES = ["4-6 Kursi", "7-11 Kursi", "12+ Kursi"];
const AMENITIES = [
  { label: "WiFi", icon: Wifi },
  { label: "AC", icon: AirVent },
  { label: "Port USB", icon: Usb },
  { label: "Tol", icon: Road }
];

export function TripFilters({
  minPrice,
  maxPrice,
  onCapacityChange,
  onAmenitiesChange,
  onClearAll
}: TripFiltersProps) {
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const toggleAmenity = (amenity: string) => {
    const newAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(newAmenities);
    onAmenitiesChange(newAmenities);
  };

  const handleCapacityClick = (capacity: string) => {
    const newCapacity = selectedCapacity === capacity ? null : capacity;
    setSelectedCapacity(newCapacity);
    onCapacityChange(newCapacity);
  };

  return (
    <div className="space-y-8 bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setSelectedCapacity(null);
            setSelectedAmenities([]);
            setLocalMinPrice(50000);
            setLocalMaxPrice(500000);
            onClearAll();
          }}
          className="text-sm font-semibold text-teal-600 hover:underline"
        >
          Hapus
        </button>
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          URUTKAN BERDASARKAN
        </label>
        <select className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:outline-none">
          <option>Harga: Rendah ke Tinggi</option>
          <option>Harga: Tinggi ke Rendah</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          RENTANG HARGA (Rp)
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-400">dari</span>
          <InputPrice
            id="min-price"
            value={localMinPrice}
            onChange={(value) => {
              setLocalMinPrice(value);
            }}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          />
          <span className="text-xs font-bold text-gray-400">ke</span>
          <InputPrice
            id="max-price"
            value={localMaxPrice}
            onChange={(value) => {
              setLocalMaxPrice(value);
            }}
            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          />
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          KAPASITAS
        </label>
        <div className="flex flex-wrap gap-2">
          {CAPACITIES.map((cap) => (
            <button
              key={cap}
              onClick={() => handleCapacityClick(cap)}
              className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition-all ${
                selectedCapacity === cap
                  ? "border-teal-900 bg-teal-900 text-white"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
              }`}
            >
              {cap}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          FASILITAS
        </label>
        <div className="space-y-3">
          {AMENITIES.map((item) => (
            <label key={item.label} className="group flex cursor-pointer items-center">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(item.label)}
                  onChange={() => toggleAmenity(item.label)}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 transition-all checked:border-teal-600 checked:bg-teal-600"
                />
                <svg
                  className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={4}
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <item.icon
                className="ml-3 text-gray-400 transition-colors group-hover:text-teal-600"
                size={16}
              />
              <span className="ml-2 text-sm font-medium text-gray-600 transition-colors group-hover:text-teal-600">
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SortByFilters() {
  return (
    <Select>
      <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-teal-500/20 focus:outline-none">
        <SelectValue placeholder="Urutkan berdasarkan" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Urutkan Berdasarkan</SelectLabel>
          <SelectItem value="price-asc">Harga: Rendah ke Tinggi</SelectItem>
          <SelectItem value="price-desc">Harga: Tinggi ke Rendah</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
