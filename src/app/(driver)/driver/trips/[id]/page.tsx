"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Car,
  Phone,
} from "lucide-react";
import Link from "next/link";

export default function TripDetailPage({ params }: { params: { id: string } }) {
  const trip = {
    id: params.id,
    route: "Jakarta - Bandung",
    date: "2024-02-05",
    time: "08:00",
    duration: "3 hours",
    distance: "150 km",
    passengers: 28,
    status: "Completed",
    paymentStatus: "Paid",
    vehicle: "Minibus - YX5432B",
    vehicleColor: "White",
    plateNumber: "YX5432B",
    revenue: 1400000,
    fare: 50000,
    vendor: "TravelHub Pro",
    vendorPhone: "021-1234567",
    pickupPoint: "Terminal Blok M, Jakarta",
    dropoffPoint: "Terminal Bandung, Bandung",
    passengers_list: [
      {
        id: "1",
        name: "Ahmad Suryanto",
        seatNumber: "1",
        phone: "0812-3456-7890",
      },
      {
        id: "2",
        name: "Siti Nurhaliza",
        seatNumber: "2",
        phone: "0813-2345-6789",
      },
      {
        id: "3",
        name: "Budi Handoko",
        seatNumber: "3",
        phone: "0814-1234-5678",
      },
      {
        id: "4",
        name: "Rina Wijaya",
        seatNumber: "4",
        phone: "0815-9876-5432",
      },
    ],
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/driver/trips">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trip Details</h1>
          <p className="mt-1 text-muted-foreground">Trip ID: {trip.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Trip Status */}
          <Card className="border-0 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trip Status</p>
                <p className="text-2xl font-bold text-foreground">
                  {trip.route}
                </p>
              </div>
              <div className="text-right">
                <Badge className="mb-2 bg-green-100 text-green-800">
                  {trip.status}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {trip.date} at {trip.time}
                </p>
              </div>
            </div>
          </Card>

          {/* Route Information */}
          <Card className="border-0 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Route Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-100 p-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Point</p>
                  <p className="font-semibold text-foreground">
                    {trip.pickupPoint}
                  </p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-center text-sm text-muted-foreground">
                  {trip.distance} · {trip.duration}
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-100 p-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dropoff Point</p>
                  <p className="font-semibold text-foreground">
                    {trip.dropoffPoint}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Vehicle Information */}
          <Card className="border-0 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Vehicle Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-semibold text-foreground">{trip.vehicle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-semibold text-foreground">
                  {trip.vehicleColor}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plate Number</p>
                <p className="font-semibold text-foreground">
                  {trip.plateNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="font-semibold text-foreground">40 seats</p>
              </div>
            </div>
          </Card>

          {/* Passengers List */}
          <Card className="border-0 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Passengers
            </h3>
            <div className="space-y-3">
              {trip.passengers_list.map((passenger) => (
                <div
                  key={passenger.id}
                  className="flex items-center justify-between border-b border-border pb-3"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {passenger.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Seat {passenger.seatNumber}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {passenger.phone}
                  </p>
                </div>
              ))}
              <div className="pt-3 text-sm">
                <p className="text-muted-foreground">
                  Total Passengers: {trip.passengers}/40
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Revenue Summary */}
          <Card className="border-0 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Revenue Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Fare per passenger
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(trip.fare)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Number of passengers
                </span>
                <span className="font-semibold text-foreground">
                  {trip.passengers}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-foreground">
                    Total Revenue
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(trip.revenue)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Vendor Information */}
          <Card className="border-0 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Vendor Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-semibold text-foreground">{trip.vendor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {trip.vendorPhone}
                </p>
              </div>
            </div>
          </Card>

          {/* Payment Status */}
          <Card className="border-0 bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Payment Status
            </h3>
            <div className="space-y-3">
              <Badge className="w-full justify-center bg-green-100 py-2 text-center text-green-800">
                {trip.paymentStatus}
              </Badge>
              <p className="text-xs text-muted-foreground text-center">
                Payment received on {trip.date}
              </p>
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full">Download Invoice</Button>
            <Button variant="outline" className="w-full bg-transparent">
              Contact Vendor
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
