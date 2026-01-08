import Link from "next/link";
import { Star, Users, Wifi as WiFi, Wind, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

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
  imageUrl: string;
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
  imageUrl,
}: TripCardProps) {
  return (
    <Card className="px-2">
      <div className="flex gap-4 md:flex-row flex-col">
        <Image
          src={imageUrl}
          width={300}
          height={150}
          alt={vehicleType}
          className="rounded-md object-cover md:w-[400px] flex-shrink-0 mx-auto"
        />
        <div className="flex flex-col py-4 w-full px-2 gap-y-4">
          <div className="flex justify-between w-full">
            <div>
              <h3 className="font-semibold text-foreground text-lg">
                {vendor}
              </h3>
              <p className="text-sm text-muted-foreground">{vehicleType}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 h-fit">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold text-chart-2">
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
              <p className="text-lg font-bold text-foreground">
                {departureTime}
              </p>
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
              <p className="text-2xl font-bold text-chart-2 font-jetbrains-mono">
                Rp {pricePerSeat.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Link href={`/routes/${id}`}>
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
          Select Trip
        </Button>
      </Link>
    </Card>
  );
}
