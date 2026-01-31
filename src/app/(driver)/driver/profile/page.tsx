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
import { Star, Edit2, Save, Calendar, AlertCircle } from "lucide-react";

export default function DriverProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Budi Santoso",
    phone: "0812-3456-7890",
    email: "budi.santoso@email.com",
    licenseNumber: "H1234567890",
    licenseExpiry: "2026-12-31",
    yearsExperience: 5,
    city: "Jakarta",
    address: "Jl. Sudirman No. 123, Jakarta",
    bio: "Professional driver with 5 years of experience in intercity transportation.",
    bankName: "Bank BCA",
    bankAccount: "1234567890",
    accountHolder: "Budi Santoso",
  });

  const [formData, setFormData] = useState(profile);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "yearsExperience" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      setProfile(formData);
      setIsEditing(false);
      setIsSaving(false);
    }, 500);
  };

  const handleEditClick = () => {
    setFormData(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const stats = [
    {
      label: "Total Trips",
      value: "156",
    },
    {
      label: "Rating",
      value: "4.8/5",
    },
    {
      label: "Joined",
      value: "2 years ago",
    },
    {
      label: "Status",
      value: "Active",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your driver profile and account settings
          </p>
        </div>
        {!isEditing && (
          <Button onClick={handleEditClick} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-0 bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Alert for License Expiry */}
      <Card className="border-0 border-l-4 border-l-blue-500 bg-blue-50 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">License Information</h4>
            <p className="mt-1 text-sm text-blue-800">
              Your license will expire on {profile.licenseExpiry}. Please renew
              it before the expiry date.
            </p>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
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
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
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
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
              <div>
                <Label
                  htmlFor="yearsExperience"
                  className="text-sm font-medium"
                >
                  Years of Experience
                </Label>
                <Input
                  id="yearsExperience"
                  name="yearsExperience"
                  type="number"
                  value={formData.yearsExperience}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border-t border-border pt-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Address
            </h3>
            <Label htmlFor="address" className="text-sm font-medium">
              Full Address
            </Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Bio */}
          <div className="border-t border-border pt-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Professional Bio
            </h3>
            <Label htmlFor="bio" className="text-sm font-medium">
              Tell passengers about yourself
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-2"
              rows={3}
              placeholder="Share your experience and driving philosophy..."
            />
          </div>
        </div>
      </Card>

      {/* License Information */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">
            Driver License Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="licenseNumber" className="text-sm font-medium">
                License Number
              </Label>
              <Input
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="licenseExpiry" className="text-sm font-medium">
                License Expiry Date
              </Label>
              <Input
                id="licenseExpiry"
                name="licenseExpiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Bank Information */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">
            Bank Information
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="bankName" className="text-sm font-medium">
                Bank Name
              </Label>
              <Input
                id="bankName"
                name="bankName"
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
                value={formData.bankAccount}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="accountHolder" className="text-sm font-medium">
                Account Holder Name
              </Label>
              <Input
                id="accountHolder"
                name="accountHolder"
                value={formData.accountHolder}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      {isEditing && (
        <div className="flex gap-3">
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
  );
}
