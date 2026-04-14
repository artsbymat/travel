import { Button } from "@/components/ui/button";

interface TripCardProps {
  id: string;
  origin: string;
  destination: string;
  provider: string;
  departureTime: string;
  duration: string;
  imageUrl: string;
  features: string[];
  pricePerSeat: number;
  availableSeats: number;
  onSelectTrip: (tripId: string) => void;
}

export function TripCard({
  id,
  origin,
  destination,
  provider,
  departureTime,
  duration,
  imageUrl,
  features,
  pricePerSeat,
  availableSeats,
  onSelectTrip
}: TripCardProps) {
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(pricePerSeat);

  return (
    <div className="bg-card border-border overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
      {/* Image Section */}
      <div className="bg-muted h-48 w-full overflow-hidden">
        <img src={imageUrl} alt={`${provider} minibus`} className="h-full w-full object-cover" />
      </div>

      {/* Content Section */}
      <div className="space-y-4 p-6">
        {/* Route and Provider */}
        <div>
          <h3 className="text-foreground mb-1 text-lg font-semibold">
            {origin} → {destination}
          </h3>
          <p className="text-muted-foreground text-sm">{provider}</p>
        </div>

        {/* Time and Duration */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-foreground font-medium">{departureTime}</p>
            <p className="text-muted-foreground text-xs">Keberangkatan</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">~</p>
          </div>
          <div className="text-right">
            <p className="text-foreground font-medium">{duration}</p>
            <p className="text-muted-foreground text-xs">Durasi</p>
          </div>
        </div>

        {/* Features */}
        <div className="border-border border-t pt-2">
          <p className="text-foreground text-sm">{features.join(" • ")}</p>
        </div>

        {/* Available Seats */}
        <div className="text-sm">
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">{availableSeats}</span> kursi tersedia
          </p>
        </div>

        {/* Price and Action */}
        <div className="border-border flex items-center justify-between border-t pt-2">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">Harga per kursi</p>
            <p className="text-primary text-2xl font-semibold">{formattedPrice}</p>
          </div>
          <Button
            onClick={() => onSelectTrip(id)}
            className="bg-primary hover:bg-primary/90 font-medium text-white"
          >
            Pilih
          </Button>
        </div>
      </div>
    </div>
  );
}
