import { Button } from "@/components/ui/button";
import { Wifi, AirVent, Usb, Road } from "lucide-react";

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
  onSelectTrip
}: TripCardProps) {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(pricePerSeat);

  return (
    <div className="flex flex-col gap-6 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md md:flex-row">
      {/* Image Section */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-xl md:h-auto md:w-64">
        <img src={imageUrl} alt={provider} className="h-full w-full object-cover" />
        <div className="absolute top-3 left-3 rounded bg-teal-600 px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase">
          {vehicleType}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col justify-between py-1">
        <div className="space-y-3">
          {/* Header: Title and Price */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl leading-tight font-bold text-gray-900">{provider}</h3>
              {/* Amenities Icons */}
              <div className="mt-2 flex gap-3 text-gray-500">
                {amenities.includes("AC") && <AirVent size={16} strokeWidth={2.5} />}
                {amenities.includes("WiFi") && <Wifi size={16} strokeWidth={2.5} />}
                {amenities.includes("Port USB") && <Usb size={16} strokeWidth={2.5} />}
                {amenities.includes("Tol") && <Road size={16} strokeWidth={2.5} />}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#0D9488]">{formattedPrice}</p>
              <p className="text-[10px] font-bold tracking-tighter text-gray-400 uppercase">
                PER KURSI
              </p>
            </div>
          </div>
        </div>

        {/* Footer: Seats Available and Action */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#0D9488]" />
            <span className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
              Kursi Tersedia {availableSeats}/{totalSeats}
            </span>
          </div>
          <Button
            onClick={() => onSelectTrip(id)}
            className="rounded-xl bg-[#8B5E02] px-8 py-5 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-amber-900/20 hover:bg-[#744E02]"
          >
            PESAN KURSI
          </Button>
        </div>
      </div>
    </div>
  );
}
