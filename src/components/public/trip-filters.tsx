"use client";

import { useState } from "react";
import { Wifi, AirVent, Usb, SlidersHorizontal } from "lucide-react";

interface TripFiltersProps {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  onCapacityChange: (capacity: string | null) => void;
  onAmenitiesChange: (amenities: string[]) => void;
  onClearAll: () => void;
}

const CAPACITIES = ["4 Kursi", "6 Kursi", "12+ Kursi"];
const AMENITIES = [
  { label: "WiFi", icon: Wifi },
  { label: "AC", icon: AirVent },
  { label: "Port USB", icon: Usb },
  { label: "Kursi Reclining", icon: SlidersHorizontal },
  { label: "Toilet", icon: SlidersHorizontal } 
];

export function TripFilters({
  minPrice,
  maxPrice,
  onPriceChange,
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
        <h2 className="text-2xl font-bold text-gray-900">Filter</h2>
        <button 
          onClick={() => {
            setSelectedCapacity(null);
            setSelectedAmenities([]);
            setLocalMinPrice(50000);
            setLocalMaxPrice(500000);
            onClearAll();
          }}
          className="text-teal-600 text-sm font-semibold hover:underline"
        >
          Hapus semua
        </button>
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">URUTKAN BERDASARKAN</label>
        <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20">
          <option>Penilaian Terbaik</option>
          <option>Harga: Rendah ke Tinggi</option>
          <option>Harga: Tinggi ke Rendah</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">RENTANG HARGA (Rp)</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(Number(e.target.value))}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <span className="text-gray-400 text-xs font-bold">ke</span>
          <input
            type="number"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">KAPASITAS</label>
        <div className="flex flex-wrap gap-2">
          {CAPACITIES.map((cap) => (
            <button
              key={cap}
              onClick={() => handleCapacityClick(cap)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border-2 ${
                selectedCapacity === cap
                  ? "bg-teal-900 border-teal-900 text-white"
                  : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
              }`}
            >
              {cap}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FASILITAS</label>
        <div className="space-y-3">
          {AMENITIES.map((item) => (
            <label key={item.label} className="flex items-center group cursor-pointer">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(item.label)}
                  onChange={() => toggleAmenity(item.label)}
                  className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-teal-600 checked:border-teal-600 transition-all cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <item.icon className="ml-3 text-gray-400 group-hover:text-teal-600 transition-colors" size={16} />
              <span className="ml-2 text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors">
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
