"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface Trip {
  id: string;
  departure: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  vehicle: string;
  driver: string;
  seats: number;
  status: string;
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([
    {
      id: "1",
      departure: "Surabaya",
      destination: "Jakarta",
      departureTime: "08:00",
      arrivalTime: "14:30",
      price: 250000,
      vehicle: "Mercedes Sprinter",
      driver: "Budi Santoso",
      seats: 14,
      status: "Active",
    },
    {
      id: "2",
      departure: "Bandung",
      destination: "Jakarta",
      departureTime: "06:00",
      arrivalTime: "09:30",
      price: 180000,
      vehicle: "Toyota Hiace",
      driver: "Rahmat Hidayat",
      seats: 12,
      status: "Active",
    },
  ]);

  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [formData, setFormData] = useState({
    departure: "",
    destination: "",
    departureTime: "",
    arrivalTime: "",
    price: "",
    vehicle: "",
    driver: "",
    seats: "",
    description: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTrip = () => {
    if (
      formData.departure &&
      formData.destination &&
      formData.departureTime &&
      formData.price
    ) {
      const newTrip: Trip = {
        id: String(trips.length + 1),
        departure: formData.departure,
        destination: formData.destination,
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        price: Number(formData.price),
        vehicle: formData.vehicle,
        driver: formData.driver,
        seats: Number(formData.seats),
        status: "Active",
      };
      setTrips([...trips, newTrip]);
      setFormData({
        departure: "",
        destination: "",
        departureTime: "",
        arrivalTime: "",
        price: "",
        vehicle: "",
        driver: "",
        seats: "",
        description: "",
      });
      setIsAddingTrip(false);
    }
  };

  const handleDeleteTrip = (id: string) => {
    setTrips(trips.filter((trip) => trip.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Trips</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage minibus trips
          </p>
        </div>
        <Button
          onClick={() => setIsAddingTrip(!isAddingTrip)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Trip
        </Button>
      </div>

      {/* Add Trip Form */}
      {isAddingTrip && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            New Trip Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departure */}
            <div>
              <Label htmlFor="departure" className="text-sm font-medium">
                Departure City
              </Label>
              <Select
                value={formData.departure}
                onValueChange={(value) =>
                  handleSelectChange("departure", value)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select departure city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Surabaya">Surabaya</SelectItem>
                  <SelectItem value="Jakarta">Jakarta</SelectItem>
                  <SelectItem value="Bandung">Bandung</SelectItem>
                  <SelectItem value="Yogyakarta">Yogyakarta</SelectItem>
                  <SelectItem value="Bali">Bali</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Destination */}
            <div>
              <Label htmlFor="destination" className="text-sm font-medium">
                Destination City
              </Label>
              <Select
                value={formData.destination}
                onValueChange={(value) =>
                  handleSelectChange("destination", value)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select destination city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Surabaya">Surabaya</SelectItem>
                  <SelectItem value="Jakarta">Jakarta</SelectItem>
                  <SelectItem value="Bandung">Bandung</SelectItem>
                  <SelectItem value="Yogyakarta">Yogyakarta</SelectItem>
                  <SelectItem value="Bali">Bali</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Departure Time */}
            <div>
              <Label htmlFor="departureTime" className="text-sm font-medium">
                Departure Time
              </Label>
              <Input
                type="time"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Arrival Time */}
            <div>
              <Label htmlFor="arrivalTime" className="text-sm font-medium">
                Arrival Time
              </Label>
              <Input
                type="time"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price" className="text-sm font-medium">
                Price per Seat (IDR)
              </Label>
              <Input
                type="number"
                name="price"
                placeholder="250000"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Seats */}
            <div>
              <Label htmlFor="seats" className="text-sm font-medium">
                Total Seats
              </Label>
              <Input
                type="number"
                name="seats"
                placeholder="14"
                value={formData.seats}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Vehicle */}
            <div>
              <Label htmlFor="vehicle" className="text-sm font-medium">
                Vehicle
              </Label>
              <Select
                value={formData.vehicle}
                onValueChange={(value) => handleSelectChange("vehicle", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mercedes Sprinter">
                    Mercedes Sprinter (14 seats)
                  </SelectItem>
                  <SelectItem value="Toyota Hiace">
                    Toyota Hiace (12 seats)
                  </SelectItem>
                  <SelectItem value="Isuzu Elf">
                    Isuzu Elf (20 seats)
                  </SelectItem>
                  <SelectItem value="Mitsubishi Fuso">
                    Mitsubishi Fuso (18 seats)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Driver */}
            <div>
              <Label htmlFor="driver" className="text-sm font-medium">
                Driver
              </Label>
              <Select
                value={formData.driver}
                onValueChange={(value) => handleSelectChange("driver", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Budi Santoso">Budi Santoso</SelectItem>
                  <SelectItem value="Rahmat Hidayat">Rahmat Hidayat</SelectItem>
                  <SelectItem value="Ahmad Dwi">Ahmad Dwi Kusuma</SelectItem>
                  <SelectItem value="Hendra Wijaya">Hendra Wijaya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                name="description"
                placeholder="Add trip details, notes, or special requirements..."
                value={formData.description}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleAddTrip} className="gap-2">
              Save Trip
            </Button>
            <Button variant="outline" onClick={() => setIsAddingTrip(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Trips Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Trip List
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Departure Time</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">
                    {trip.departure} → {trip.destination}
                  </TableCell>
                  <TableCell>{trip.departureTime}</TableCell>
                  <TableCell className="font-semibold">
                    IDR {trip.price.toLocaleString()}
                  </TableCell>
                  <TableCell>{trip.vehicle}</TableCell>
                  <TableCell>{trip.driver}</TableCell>
                  <TableCell>{trip.seats}</TableCell>
                  <TableCell>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {trip.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-accent rounded-lg transition">
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
