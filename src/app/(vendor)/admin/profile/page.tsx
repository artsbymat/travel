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
import { MapPin, Phone, Globe, Star, Save, Edit2 } from "lucide-react";

interface VendorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  website?: string;
  address: string;
  city: string;
  province: string;
  description: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  rating: number;
  totalTrips: number;
  status: string;
  joinDate: string;
}

export default function VendorProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [vendorProfile, setVendorProfile] = useState<VendorProfile>({
    id: "1",
    name: "TravelHub Pro",
    email: "info@travelhubpro.com",
    phone: "021-1234567",
    website: "www.travelhubpro.com",
    address: "Jl. Sudirman No. 123",
    city: "Jakarta",
    province: "DKI Jakarta",
    description:
      "Premium travel service provider with modern fleet and excellent customer service.",
    bankName: "Bank BCA",
    bankAccount: "1234567890",
    accountHolder: "PT. TravelHub Pro",
    rating: 4.8,
    totalTrips: 256,
    status: "Active",
    joinDate: "2020-01-15",
  });

  const [formData, setFormData] = useState<VendorProfile>(vendorProfile);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      setVendorProfile(formData);
      setIsEditing(false);
      setIsSaving(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 500);
  };

  const handleEditClick = () => {
    setFormData(vendorProfile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(vendorProfile);
    setIsEditing(false);
  };

  const provinces = [
    "DKI Jakarta",
    "Jawa Barat",
    "Jawa Tengah",
    "DI Yogyakarta",
    "Jawa Timur",
    "Bali",
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vendor Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your business profile and information
          </p>
        </div>
        {!isEditing && (
          <Button onClick={handleEditClick} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800 border border-green-200">
          {successMessage}
        </div>
      )}

      {/* Profile Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-0 bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Trips</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {vendorProfile.totalTrips}
          </p>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Rating</p>
          <div className="mt-2 flex items-center gap-2">
            <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
            <span className="text-3xl font-bold text-foreground">
              {vendorProfile.rating}
            </span>
          </div>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="mt-2 text-xl font-bold text-green-600">
            {vendorProfile.status}
          </p>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Member Since</p>
          <p className="mt-2 text-lg font-bold text-foreground">
            {vendorProfile.joinDate}
          </p>
        </Card>
      </div>

      {/* Profile Form */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Vendor Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your vendor name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vendor@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="0812-3456-7890"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="website" className="text-sm font-medium">
                  Website (Optional)
                </Label>
                <Input
                  id="website"
                  name="website"
                  placeholder="www.vendor.com"
                  value={formData.website || ""}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="border-t border-border pt-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Address Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="address" className="text-sm font-medium">
                  Street Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Jl. Example No. 123"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-sm font-medium">
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Jakarta"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="province" className="text-sm font-medium">
                  Province
                </Label>
                {isEditing ? (
                  <Select
                    value={formData.province}
                    onValueChange={(value) =>
                      handleSelectChange("province", value)
                    }
                  >
                    <SelectTrigger id="province" className="mt-2">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="province"
                    value={formData.province}
                    disabled
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="border-t border-border pt-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Business Information
            </h3>
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Business Description
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your business..."
                value={formData.description}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          {/* Bank Information */}
          <div className="border-t border-border pt-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Bank Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="bankName" className="text-sm font-medium">
                  Bank Name
                </Label>
                <Input
                  id="bankName"
                  name="bankName"
                  placeholder="e.g., Bank BCA"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="bankAccount" className="text-sm font-medium">
                  Account Number
                </Label>
                <Input
                  id="bankAccount"
                  name="bankAccount"
                  placeholder="1234567890"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="accountHolder" className="text-sm font-medium">
                  Account Holder Name
                </Label>
                <Input
                  id="accountHolder"
                  name="accountHolder"
                  placeholder="PT. Company Name"
                  value={formData.accountHolder}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {isEditing && (
            <div className="flex gap-3 border-t border-border pt-6">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
