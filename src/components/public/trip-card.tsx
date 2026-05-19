import { Button } from "@/components/ui/button";
import { Wifi, AirVent, Usb, Road, Clock, MapPin } from "lucide-react";
import { formatLocalTime } from "@/lib/timezone";

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
  originProvince?: string | null;
  destinationProvince?: string | null;
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
  onSelectTrip,
  origin,
  destination,
  departureTime,
  duration,
  originProvince
}: TripCardProps) {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(pricePerSeat);

  return (
    <div className="flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md md:flex-row">
      {/* Image Section */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-2xl md:h-auto md:w-60">
        <img src={imageUrl} alt={provider} className="h-full w-full object-cover" />
        <div className="absolute top-3 left-3 rounded-lg bg-teal-600/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-black tracking-wider text-white uppercase">
          {vehicleType}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col justify-between py-1">
        <div className="space-y-4">
          {/* Header: Provider Name and Price */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">{provider}</h3>
              {/* Amenities Icons */}
              <div className="mt-2 flex gap-3 text-slate-400">
                {amenities.includes("AC") && <AirVent size={16} strokeWidth={2.5} className="text-teal-600" />}
                {amenities.includes("WiFi") && <Wifi size={16} strokeWidth={2.5} className="text-teal-600" />}
                {amenities.includes("Port USB") && <Usb size={16} strokeWidth={2.5} className="text-teal-600" />}
                {amenities.includes("Tol") && <Road size={16} strokeWidth={2.5} className="text-teal-600" />}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-teal-700 leading-none">{formattedPrice}</p>
              <p className="mt-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                PER KURSI
              </p>
            </div>
          </div>

          {/* Route & Time Timeline (WIB/WITA/WIT aware) */}
          <div className="rounded-2xl bg-slate-50/50 p-4 border border-slate-100/30">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Local departure time with badge */}
              <div className="flex items-center gap-2.5">
                <Clock className="h-4.5 w-4.5 text-teal-600 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">BERANGKAT</p>
                  <p className="text-sm font-black text-slate-800">
                    {formatLocalTime(departureTime, originProvince)}
                  </p>
                </div>
              </div>

              {/* Graphical Route Segment */}
              <div className="flex flex-1 items-center gap-3 sm:px-4">
                <span className="text-xs font-bold text-slate-700">{origin}</span>
                <div className="relative flex flex-1 items-center justify-center">
                  <div className="h-[2px] w-full bg-slate-200" />
                  <div className="absolute rounded-full bg-white px-2 py-0.5 border border-slate-150 text-[9px] font-bold text-slate-500 flex items-center gap-1 shadow-sm">
                    <MapPin className="h-3 w-3 text-amber-600" />
                    {duration}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700">{destination}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Seat indicator & booking button */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${availableSeats > 2 ? 'bg-teal-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-xs font-bold tracking-wide text-slate-600 uppercase">
              Kursi Tersedia {availableSeats}/{totalSeats}
            </span>
          </div>
          <Button
            onClick={() => onSelectTrip(id)}
            className="rounded-2xl bg-amber-600 px-8 py-5 text-xs font-bold tracking-widest text-white uppercase shadow-lg shadow-amber-900/10 hover:bg-amber-700 transition-all active:scale-[0.98]"
          >
            PESAN KURSI
          </Button>
        </div>
      </div>
    </div>
  );
}
