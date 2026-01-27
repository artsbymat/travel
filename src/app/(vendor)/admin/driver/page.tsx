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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Phone, Mail } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  experience: number;
  rating: number;
  status: string;
  city: string;
  joinDate: string;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: "1",
      name: "Budi Santoso",
      phone: "081234567890",
      email: "budi@travelhub.com",
      licenseNumber: "B1234567",
      licenseExpiry: "2025-12-31",
      experience: 8,
      rating: 4.8,
      status: "Active",
      city: "Surabaya",
      joinDate: "2020-06-15",
    },
    {
      id: "2",
      name: "Rahmat Hidayat",
      phone: "082345678901",
      email: "rahmat@travelhub.com",
      licenseNumber: "B7654321",
      licenseExpiry: "2025-08-15",
      experience: 6,
      rating: 4.6,
      status: "Active",
      city: "Jakarta",
      joinDate: "2021-03-20",
    },
  ]);

  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    licenseNumber: "",
    licenseExpiry: "",
    experience: "",
    city: "",
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

  const handleAddDriver = () => {
    if (
      formData.name &&
      formData.phone &&
      formData.licenseNumber &&
      formData.city
    ) {
      const newDriver: Driver = {
        id: String(drivers.length + 1),
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        experience: Number(formData.experience),
        rating: 4.5,
        status: "Active",
        city: formData.city,
        joinDate: new Date().toISOString().split("T")[0],
      };
      setDrivers([...drivers, newDriver]);
      setFormData({
        name: "",
        phone: "",
        email: "",
        licenseNumber: "",
        licenseExpiry: "",
        experience: "",
        city: "",
      });
      setIsAddingDriver(false);
    }
  };

  const handleDeleteDriver = (id: string) => {
    setDrivers(drivers.filter((driver) => driver.id !== id));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.7) return "bg-green-100 text-green-700";
    if (rating >= 4.0) return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Drivers</h1>
          <p className="text-muted-foreground mt-2">
            Register and manage driver profiles
          </p>
        </div>
        <Button
          onClick={() => setIsAddingDriver(!isAddingDriver)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Driver
        </Button>
      </div>

      {/* Add Driver Form */}
      {isAddingDriver && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            New Driver Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name
              </Label>
              <Input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                type="tel"
                name="phone"
                placeholder="081234567890"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                type="email"
                name="email"
                placeholder="driver@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* License Number */}
            <div>
              <Label htmlFor="licenseNumber" className="text-sm font-medium">
                License Number
              </Label>
              <Input
                type="text"
                name="licenseNumber"
                placeholder="B1234567"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                className="mt-2 uppercase"
              />
            </div>

            {/* License Expiry */}
            <div>
              <Label htmlFor="licenseExpiry" className="text-sm font-medium">
                License Expiry Date
              </Label>
              <Input
                type="date"
                name="licenseExpiry"
                value={formData.licenseExpiry}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Experience */}
            <div>
              <Label htmlFor="experience" className="text-sm font-medium">
                Years of Experience
              </Label>
              <Input
                type="number"
                name="experience"
                placeholder="5"
                value={formData.experience}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* City */}
            <div className="md:col-span-2">
              <Label htmlFor="city" className="text-sm font-medium">
                Operating City
              </Label>
              <Select
                value={formData.city}
                onValueChange={(value) => handleSelectChange("city", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Surabaya">Surabaya</SelectItem>
                  <SelectItem value="Jakarta">Jakarta</SelectItem>
                  <SelectItem value="Bandung">Bandung</SelectItem>
                  <SelectItem value="Yogyakarta">Yogyakarta</SelectItem>
                  <SelectItem value="Bali">Bali</SelectItem>
                  <SelectItem value="Medan">Medan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleAddDriver} className="gap-2">
              Save Driver
            </Button>
            <Button variant="outline" onClick={() => setIsAddingDriver(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Drivers Grid & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Total Drivers
          </h3>
          <p className="text-3xl font-bold text-foreground">{drivers.length}</p>
          <p className="text-xs text-green-600 mt-2">All active</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Avg. Rating
          </h3>
          <p className="text-3xl font-bold text-foreground">
            {(
              drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length
            ).toFixed(1)}
          </p>
          <p className="text-xs text-blue-600 mt-2">Out of 5.0</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Avg. Experience
          </h3>
          <p className="text-3xl font-bold text-foreground">
            {Math.round(
              drivers.reduce((sum, d) => sum + d.experience, 0) /
                drivers.length,
            )}{" "}
            yrs
          </p>
          <p className="text-xs text-purple-600 mt-2">Combined knowledge</p>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Driver List
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-semibold">{driver.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {driver.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {driver.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{driver.licenseNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Exp: {driver.licenseExpiry}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{driver.experience} years</TableCell>
                  <TableCell>
                    <Badge className={getRatingColor(driver.rating)}>
                      {driver.rating}
                    </Badge>
                  </TableCell>
                  <TableCell>{driver.city}</TableCell>
                  <TableCell>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {driver.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-accent rounded-lg transition">
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver.id)}
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
