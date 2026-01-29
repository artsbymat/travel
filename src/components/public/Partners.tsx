"use client";

import { Card } from "@/components/ui/card";
import { Star, Van } from "lucide-react";
import Link from "next/link";

interface Partner {
  id: string;
  name: string;
  city: string;
  rating: number;
  totalTrips: number;
}

export function Partners() {
  const partners: Partner[] = [
    {
      id: "1",
      name: "TravelHub Pro",
      city: "Jakarta",
      rating: 4.8,
      totalTrips: 256,
    },
    {
      id: "2",
      name: "Express Travel",
      city: "Yogyakarta",
      rating: 4.5,
      totalTrips: 189,
    },
    {
      id: "3",
      name: "Comfort Journey",
      city: "Surabaya",
      rating: 4.3,
      totalTrips: 142,
    },
    {
      id: "4",
      name: "Quick Transport",
      city: "Bandung",
      rating: 4.6,
      totalTrips: 198,
    },
    {
      id: "5",
      name: "Premium Ride",
      city: "Bali",
      rating: 4.7,
      totalTrips: 211,
    },
    {
      id: "6",
      name: "Safe Travels",
      city: "Medan",
      rating: 4.4,
      totalTrips: 167,
    },
  ];

  return (
    <section className="px-4 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Partner Kami
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Terpercaya oleh perusahaan transportasi terkemuka di seluruh
            Indonesia
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <Card
              key={partner.id}
              className="border-0 bg-secondary p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                  <Van className="h-6 w-6 dark:text-primary text-chart-3" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {partner.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {partner.city}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-1">
                  <Star className="size-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-foreground">
                    {partner.rating}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {partner.totalTrips} trips
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Bermitra dengan kami dan jangkau ribuan pelancong setiap hari.{" "}
            <Link
              href="/become-a-partner"
              className="font-semibold dark:text-primary text-chart-3 hover:underline"
            >
              Bergabunglah sekarang!
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
