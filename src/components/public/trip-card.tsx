import Link from "next/link";
import { Star, Users, Wifi as WiFi, Wind, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TripCardProps {
  id: string;
  vendor: string;
  vehicleType: string;
  capacity: number;
  departureTime: string;
  arrivalTime: string;
  pricePerSeat: number;
  seatsAvailable: number;
  rating: number;
  reviews: number;
  features: string[];
}

export function TripCard({
  id,
  vendor,
  vehicleType,
  capacity,
  departureTime,
  arrivalTime,
  pricePerSeat,
  seatsAvailable,
  rating,
  reviews,
  features,
}: TripCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 md:p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-lg">{vendor}</h3>
            <p className="text-sm text-muted-foreground">{vehicleType}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-semibold text-primary">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
              Departure
            </p>
            <p className="text-lg font-bold text-foreground">{departureTime}</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                Duration
              </p>
              <p className="text-sm font-semibold text-muted-foreground mt-1">
                3h 30m
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
              Arrival
            </p>
            <p className="text-lg font-bold text-foreground">{arrivalTime}</p>
          </div>
        </div>

        <div className="mb-6 space-y-3 border-t border-b border-border py-4">
          {/* Amenities */}
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature === "AC" && <Wind className="h-3 w-3 mr-1" />}
                {feature === "WiFi" && <WiFi className="h-3 w-3 mr-1" />}
                {feature === "USB" && <Zap className="h-3 w-3 mr-1" />}
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
                Seats Available
              </p>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-accent" />
                <span className="font-bold text-foreground">
                  {seatsAvailable}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {capacity}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
              Price per Seat
            </p>
            <p className="text-2xl font-bold text-primary">
              Rp {pricePerSeat.toLocaleString()}
            </p>
          </div>
        </div>

        <Link href={`/trip/${id}`}>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            Select Trip
          </Button>
        </Link>
      </div>
    </Card>
  );
}
