import { Button } from "@/components/ui/button";
import { Wifi, AirVent, Usb, SlidersHorizontal, User } from "lucide-react";

interface TripCardProps {
  id: string;
  origin: string;
  destination: string;
  provider: string;
  departureTime: string;
  duration: string;
  imageUrl: string;
  features: string[];
  amenities: string[];
  pricePerSeat: number;
  availableSeats: number;
  totalSeats: number;
  vehicleType: string;
  description: string;
  onSelectTrip: (tripId: string) => void;
}

export function TripCard({
  id,
  provider,
  imageUrl,
  amenities,
  pricePerSeat,
  availableSeats,
  totalSeats,
  vehicleType,
  description,
  onSelectTrip
}: TripCardProps) {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(pricePerSeat);

  return (
    <div className="bg-white overflow-hidden rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row gap-6 p-4">
      {/* Image Section */}
      <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden rounded-xl shrink-0">
        <img src={imageUrl} alt={provider} className="h-full w-full object-cover" />
        <div className="absolute top-3 left-3 bg-teal-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
          {vehicleType}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-3">
          {/* Header: Title and Price */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-900 text-xl font-bold leading-tight">
                {provider}
              </h3>
              {/* Amenities Icons */}
              <div className="flex gap-3 mt-2 text-gray-500">
                {amenities.includes("AC") && <AirVent size={16} strokeWidth={2.5} />}
                {amenities.includes("WiFi") && <Wifi size={16} strokeWidth={2.5} />}
                {amenities.includes("Port USB") && <Usb size={16} strokeWidth={2.5} />}
                {amenities.includes("Kursi Reclining") && <SlidersHorizontal size={16} strokeWidth={2.5} />}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[#0D9488] text-2xl font-bold">{formattedPrice}</p>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tighter">PER KURSI</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 md:line-clamp-3">
            {description}
          </p>
        </div>

        {/* Footer: Seats Available and Action */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
             <span className="text-gray-600 text-xs font-semibold uppercase tracking-wide">
                Kursi Tersedia {availableSeats}/{totalSeats}
             </span>
          </div>
          <Button
            onClick={() => onSelectTrip(id)}
            className="bg-[#8B5E02] hover:bg-[#744E02] text-white px-8 py-5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-amber-900/20"
          >
            PESAN KURSI
          </Button>
        </div>
      </div>
    </div>
  );
}
