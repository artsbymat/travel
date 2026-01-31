"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Users, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function DriverDashboard() {
  const upcomingTrips = [
    {
      id: "1",
      route: "Jakarta - Bandung",
      date: "2024-02-05",
      time: "08:00",
      passengers: 28,
      status: "Confirmed",
      vehicle: "Minibus - YX5432B",
    },
    {
      id: "2",
      route: "Bandung - Yogyakarta",
      date: "2024-02-06",
      time: "14:00",
      passengers: 32,
      status: "Confirmed",
      vehicle: "Minibus - YX5432B",
    },
    {
      id: "3",
      route: "Yogyakarta - Surabaya",
      date: "2024-02-07",
      time: "06:00",
      passengers: 25,
      status: "Pending",
      vehicle: "Minibus - YX5432B",
    },
  ];

  const stats = [
    {
      label: "Total Trips",
      value: "156",
      icon: MapPin,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "This Month",
      value: "12",
      icon: Calendar,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Avg Rating",
      value: "4.8",
      icon: TrendingUp,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "Earnings",
      value: "Rp 4.2M",
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome Back, Budi
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here's your trip overview for today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-0 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Trips */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="border-0 bg-card shadow-sm">
            <div className="border-b border-border p-6">
              <h2 className="text-xl font-bold text-foreground">
                Upcoming Trips
              </h2>
            </div>
            <div className="divide-y divide-border">
              {upcomingTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between p-6 hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {trip.route}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {trip.vehicle}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{trip.time}</p>
                    <p className="text-sm text-muted-foreground">{trip.date}</p>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-sm font-medium text-foreground">
                      <Users className="inline h-4 w-4 mr-1" />
                      {trip.passengers} passengers
                    </p>
                    <span
                      className={`mt-1 inline-block rounded px-2 py-1 text-xs font-medium ${
                        trip.status === "Confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {trip.status}
                    </span>
                  </div>
                  <Link href={`/driver/trips/${trip.id}`} className="ml-6">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent"
                    >
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-6">
              <Link href="/driver/trips">
                <Button variant="outline" className="w-full bg-transparent">
                  View All Trips
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Stats & Alerts */}
        <div className="space-y-6">
          {/* Performance Card */}
          <Card className="border-0 bg-card shadow-sm">
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Performance
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">On-Time Rate</span>
                    <span className="font-semibold text-foreground">98%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full w-11/12 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      Passenger Rating
                    </span>
                    <span className="font-semibold text-foreground">4.8/5</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full w-11/12 rounded-full bg-blue-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Alerts */}
          <Card className="border-0 border-l-4 border-l-yellow-500 bg-yellow-50 shadow-sm">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-900">
                    Vehicle Maintenance
                  </h4>
                  <p className="mt-1 text-sm text-yellow-800">
                    Schedule vehicle inspection before your next trip
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
