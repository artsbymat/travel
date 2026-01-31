"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Search, Calendar, Eye } from "lucide-react";
import Link from "next/link";

interface Trip {
  id: string;
  route: string;
  date: string;
  time: string;
  passengers: number;
  status: string;
  paymentStatus: string;
  vehicle: string;
  revenue: number;
}

export default function DriverTripsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  const [trips] = useState<Trip[]>([
    {
      id: "1",
      route: "Jakarta - Bandung",
      date: "2024-02-05",
      time: "08:00",
      passengers: 28,
      status: "Completed",
      paymentStatus: "Paid",
      vehicle: "Minibus - YX5432B",
      revenue: 1400000,
    },
    {
      id: "2",
      route: "Bandung - Yogyakarta",
      date: "2024-02-04",
      time: "14:00",
      passengers: 32,
      status: "Completed",
      paymentStatus: "Paid",
      vehicle: "Minibus - YX5432B",
      revenue: 1600000,
    },
    {
      id: "3",
      route: "Yogyakarta - Jakarta",
      date: "2024-02-03",
      time: "06:00",
      passengers: 25,
      status: "Completed",
      paymentStatus: "Paid",
      vehicle: "Minibus - YX5432B",
      revenue: 1250000,
    },
    {
      id: "4",
      route: "Jakarta - Bandung",
      date: "2024-02-05",
      time: "18:00",
      passengers: 28,
      status: "Confirmed",
      paymentStatus: "Pending",
      vehicle: "Minibus - YX5432B",
      revenue: 1400000,
    },
    {
      id: "5",
      route: "Bandung - Yogyakarta",
      date: "2024-02-06",
      time: "14:00",
      passengers: 32,
      status: "Confirmed",
      paymentStatus: "Pending",
      vehicle: "Minibus - YX5432B",
      revenue: 1600000,
    },
    {
      id: "6",
      route: "Yogyakarta - Surabaya",
      date: "2024-02-07",
      time: "06:00",
      passengers: 25,
      status: "Pending",
      paymentStatus: "Pending",
      vehicle: "Minibus - YX5432B",
      revenue: 1250000,
    },
  ]);

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = trip.route
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" || trip.status === filterStatus;
    const matchesDate = !filterDate || trip.date === filterDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Trips</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage all your trips
        </p>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Search Route
            </label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              Trip Status
            </label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              Trip Date
            </label>
            <div className="relative mt-2">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("All");
                setFilterDate("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Trips Table */}
      <Card className="border-0 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Route
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Date & Time
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Passengers
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Vehicle
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Trip Status
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Payment
                </TableHead>
                <TableHead className="px-6 py-3 text-right text-sm font-semibold">
                  Revenue
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => (
                  <TableRow
                    key={trip.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <div className="font-semibold text-foreground">
                          {trip.route}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {trip.date} {trip.time}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="font-medium text-foreground">
                        {trip.passengers}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-sm text-foreground">
                        {trip.vehicle}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge
                        className={
                          trip.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : trip.status === "Confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge
                        className={
                          trip.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {trip.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-semibold text-foreground">
                      {formatCurrency(trip.revenue)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Link href={`/driver/trips/${trip.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No trips found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
