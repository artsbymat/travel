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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface Car {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  color: string;
  status: string;
  lastMaintenance: string;
  features: string[];
}

export default function AdminCarsPage() {
  const [cars, setCars] = useState<Car[]>([
    {
      id: "1",
      licensePlate: "B1234ABC",
      brand: "Mercedes",
      model: "Sprinter",
      year: 2023,
      capacity: 14,
      color: "White",
      status: "Active",
      lastMaintenance: "2024-01-15",
      features: ["AC", "WiFi", "USB Charger"],
    },
    {
      id: "2",
      licensePlate: "B5678XYZ",
      brand: "Toyota",
      model: "Hiace",
      year: 2022,
      capacity: 12,
      color: "Silver",
      status: "Active",
      lastMaintenance: "2024-02-10",
      features: ["AC", "Reclining Seats"],
    },
  ]);

  const [isAddingCar, setIsAddingCar] = useState(false);
  const [formData, setFormData] = useState({
    licensePlate: "",
    brand: "",
    model: "",
    year: "",
    capacity: "",
    color: "",
    lastMaintenance: "",
    selectedFeatures: [] as string[],
  });

  const featureOptions = [
    "AC",
    "WiFi",
    "USB Charger",
    "Reclining Seats",
    "Mini Toilet",
    "Phone Holder",
    "Reading Light",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(feature)
        ? prev.selectedFeatures.filter((f) => f !== feature)
        : [...prev.selectedFeatures, feature],
    }));
  };

  const handleAddCar = () => {
    if (
      formData.licensePlate &&
      formData.brand &&
      formData.model &&
      formData.capacity
    ) {
      const newCar: Car = {
        id: String(cars.length + 1),
        licensePlate: formData.licensePlate,
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        capacity: Number(formData.capacity),
        color: formData.color,
        status: "Active",
        lastMaintenance: formData.lastMaintenance,
        features: formData.selectedFeatures,
      };
      setCars([...cars, newCar]);
      setFormData({
        licensePlate: "",
        brand: "",
        model: "",
        year: "",
        capacity: "",
        color: "",
        lastMaintenance: "",
        selectedFeatures: [],
      });
      setIsAddingCar(false);
    }
  };

  const handleDeleteCar = (id: string) => {
    setCars(cars.filter((car) => car.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Manage Vehicles
          </h1>
          <p className="text-muted-foreground mt-2">
            Add and manage minibus and van fleet
          </p>
        </div>
        <Button onClick={() => setIsAddingCar(!isAddingCar)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Vehicle
        </Button>
      </div>

      {/* Add Car Form */}
      {isAddingCar && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            New Vehicle Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* License Plate */}
            <div>
              <Label htmlFor="licensePlate" className="text-sm font-medium">
                License Plate
              </Label>
              <Input
                type="text"
                name="licensePlate"
                placeholder="B1234ABC"
                value={formData.licensePlate}
                onChange={handleInputChange}
                className="mt-2 uppercase"
              />
            </div>

            {/* Brand */}
            <div>
              <Label htmlFor="brand" className="text-sm font-medium">
                Brand
              </Label>
              <Select
                value={formData.brand}
                onValueChange={(value) => handleSelectChange("brand", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mercedes">Mercedes</SelectItem>
                  <SelectItem value="Toyota">Toyota</SelectItem>
                  <SelectItem value="Isuzu">Isuzu</SelectItem>
                  <SelectItem value="Mitsubishi">Mitsubishi</SelectItem>
                  <SelectItem value="Hino">Hino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div>
              <Label htmlFor="model" className="text-sm font-medium">
                Model
              </Label>
              <Input
                type="text"
                name="model"
                placeholder="Sprinter"
                value={formData.model}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Year */}
            <div>
              <Label htmlFor="year" className="text-sm font-medium">
                Year
              </Label>
              <Input
                type="number"
                name="year"
                placeholder="2023"
                value={formData.year}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Capacity */}
            <div>
              <Label htmlFor="capacity" className="text-sm font-medium">
                Seat Capacity
              </Label>
              <Input
                type="number"
                name="capacity"
                placeholder="14"
                value={formData.capacity}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="color" className="text-sm font-medium">
                Color
              </Label>
              <Select
                value={formData.color}
                onValueChange={(value) => handleSelectChange("color", value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="White">White</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Black">Black</SelectItem>
                  <SelectItem value="Blue">Blue</SelectItem>
                  <SelectItem value="Red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Last Maintenance */}
            <div className="md:col-span-2">
              <Label htmlFor="lastMaintenance" className="text-sm font-medium">
                Last Maintenance Date
              </Label>
              <Input
                type="date"
                name="lastMaintenance"
                value={formData.lastMaintenance}
                onChange={handleInputChange}
                className="mt-2"
              />
            </div>

            {/* Features */}
            <div className="md:col-span-2">
              <Label className="text-sm font-medium mb-3 block">
                Amenities & Features
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featureOptions.map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature}
                      checked={formData.selectedFeatures.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                    />
                    <Label
                      htmlFor={feature}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleAddCar} className="gap-2">
              Save Vehicle
            </Button>
            <Button variant="outline" onClick={() => setIsAddingCar(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Cars Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Vehicle Fleet
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Plate</TableHead>
                <TableHead>Brand & Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell className="font-semibold">
                    {car.licensePlate}
                  </TableCell>
                  <TableCell>
                    {car.brand} {car.model}
                  </TableCell>
                  <TableCell>{car.year}</TableCell>
                  <TableCell>{car.capacity} seats</TableCell>
                  <TableCell>{car.color}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {car.features.slice(0, 2).map((feature) => (
                        <span
                          key={feature}
                          className="inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-700"
                        >
                          {feature}
                        </span>
                      ))}
                      {car.features.length > 2 && (
                        <span className="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                          +{car.features.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {car.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-accent rounded-lg transition">
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteCar(car.id)}
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
