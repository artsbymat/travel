"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Building2,
} from "lucide-react";

interface BookingDetail {
  id: string;
  bookingCode: string;
  passengerName: string;
  phone: string;
  email: string;
  tripRoute: string;
  tripDate: string;
  tripTime: string;
  pickupPoint: string;
  dropoffPoint: string;
  seats: string;
  passengers: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  vendor: string;
  carType: string;
  driverName: string;
  driverPhone: string;
  createdAt: string;
  notes: string;
}

const mockBookings: Record<string, BookingDetail> = {
  "1": {
    id: "1",
    bookingCode: "BK001",
    passengerName: "Ahmad Wijaya",
    phone: "081234567890",
    email: "ahmad@email.com",
    tripRoute: "Jakarta - Bandung",
    tripDate: "2025-02-15",
    tripTime: "08:00",
    pickupPoint: "Stasiun Kota Jakarta",
    dropoffPoint: "Terminal Cicaheum Bandung",
    seats: "5,6,7",
    passengers: 3,
    totalAmount: 450000,
    paymentStatus: "Completed",
    bookingStatus: "Pending",
    vendor: "TravelHub Pro",
    carType: "Mercedes Sprinter (18 Seater)",
    driverName: "Suryanto",
    driverPhone: "087654321098",
    createdAt: "2025-02-10",
    notes: "Customer requested window seats",
  },
  "2": {
    id: "2",
    bookingCode: "BK002",
    passengerName: "Siti Nurhaliza",
    phone: "082345678901",
    email: "siti@email.com",
    tripRoute: "Surabaya - Yogyakarta",
    tripDate: "2025-02-18",
    tripTime: "14:30",
    pickupPoint: "Stasiun Wonokromo Surabaya",
    dropoffPoint: "Terminal Giwangan Yogyakarta",
    seats: "12,13",
    passengers: 2,
    totalAmount: 300000,
    paymentStatus: "Pending",
    bookingStatus: "Pending",
    vendor: "Express Travel",
    carType: "Hino Bus (25 Seater)",
    driverName: "Bambang Irawan",
    driverPhone: "089876543210",
    createdAt: "2025-02-11",
    notes: "",
  },
  "3": {
    id: "3",
    bookingCode: "BK003",
    passengerName: "Budi Santoso",
    phone: "083456789012",
    email: "budi@email.com",
    tripRoute: "Bandung - Jakarta",
    tripDate: "2025-02-20",
    tripTime: "10:00",
    pickupPoint: "Terminal Cicaheum Bandung",
    dropoffPoint: "Stasiun Kota Jakarta",
    seats: "8,9,10,11",
    passengers: 4,
    totalAmount: 600000,
    paymentStatus: "Completed",
    bookingStatus: "Confirmed",
    vendor: "TravelHub Pro",
    carType: "Mercedes Sprinter (18 Seater)",
    driverName: "Suryanto",
    driverPhone: "087654321098",
    createdAt: "2025-02-09",
    notes: "Group booking - corporate event",
  },
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const booking = mockBookings[bookingId] || mockBookings["1"];

  const [bookingData, setBookingData] = useState<BookingDetail>(booking);
  const [newStatus, setNewStatus] = useState(booking.bookingStatus);
  const [adminNotes, setAdminNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleStatusUpdate = (status: string) => {
    setShowConfirmDialog(true);
    setNewStatus(status);
  };

  const confirmStatusUpdate = () => {
    setIsSaving(true);
    setTimeout(() => {
      setBookingData((prev) => ({
        ...prev,
        bookingStatus: newStatus,
      }));
      setShowConfirmDialog(false);
      setIsSaving(false);
      setSuccessMessage(`Booking status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 500);
  };

  const handlePaymentVerification = () => {
    setIsSaving(true);
    setTimeout(() => {
      setBookingData((prev) => ({
        ...prev,
        paymentStatus: "Completed",
      }));
      setIsSaving(false);
      setSuccessMessage("Payment verified successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Confirmed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "Pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "Cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "Completed":
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Booking Details
          </h1>
          <p className="mt-1 text-muted-foreground">
            Booking Code: {bookingData.bookingCode}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800 border border-green-200">
          {successMessage}
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">
                Booking Status
              </Label>
              {getStatusIcon(bookingData.bookingStatus)}
            </div>
            <div>
              <Badge className={getStatusColor(bookingData.bookingStatus)}>
                {bookingData.bookingStatus}
              </Badge>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant={newStatus === "Pending" ? "default" : "outline"}
                onClick={() => handleStatusUpdate("Pending")}
                className="flex-1 text-xs"
              >
                <Clock className="mr-1 h-3 w-3" />
                Pending
              </Button>
              <Button
                size="sm"
                variant={newStatus === "Confirmed" ? "default" : "outline"}
                onClick={() => handleStatusUpdate("Confirmed")}
                className="flex-1 text-xs"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Confirm
              </Button>
              <Button
                size="sm"
                variant={newStatus === "Cancelled" ? "default" : "outline"}
                onClick={() => handleStatusUpdate("Cancelled")}
                className="flex-1 text-xs bg-transparent"
              >
                <XCircle className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>

        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">
                Payment Status
              </Label>
              {bookingData.paymentStatus === "Completed" ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div>
              <Badge
                className={getPaymentStatusColor(bookingData.paymentStatus)}
              >
                {bookingData.paymentStatus}
              </Badge>
            </div>
            {bookingData.paymentStatus !== "Completed" && (
              <Button
                size="sm"
                onClick={handlePaymentVerification}
                disabled={isSaving}
                className="mt-2 w-full"
              >
                Verify Payment
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Passenger Information */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Passenger Information
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Passenger Name</p>
                <p className="font-semibold text-foreground">
                  {bookingData.passengerName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="font-semibold text-foreground">
                  {bookingData.phone}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold text-foreground">
                  {bookingData.email}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Users className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Number of Passengers
                </p>
                <p className="font-semibold text-foreground">
                  {bookingData.passengers}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-semibold text-foreground">
                  Rp {bookingData.totalAmount.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seats Booked</p>
              <p className="font-semibold text-foreground">
                {bookingData.seats}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Trip Information */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Trip Information
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="font-semibold text-foreground">
                  {bookingData.tripRoute}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Pickup Point</p>
              <p className="text-sm font-medium text-foreground">
                {bookingData.pickupPoint}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Dropoff Point</p>
              <p className="text-sm font-medium text-foreground">
                {bookingData.dropoffPoint}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Departure Date & Time
                </p>
                <p className="font-semibold text-foreground">
                  {bookingData.tripDate} at {bookingData.tripTime}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Car Type</p>
                <p className="font-semibold text-foreground">
                  {bookingData.carType}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Driver Information */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Driver Information
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <User className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Driver Name</p>
              <p className="font-semibold text-foreground">
                {bookingData.driverName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Driver Phone</p>
              <p className="font-semibold text-foreground">
                {bookingData.driverPhone}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Vendor Information */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Vendor Information
        </h3>
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Vendor Name</p>
            <p className="font-semibold text-foreground">
              {bookingData.vendor}
            </p>
          </div>
        </div>
      </Card>

      {/* Admin Notes */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Admin Notes
        </h3>
        <div className="space-y-3">
          {bookingData.notes && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-foreground">{bookingData.notes}</p>
            </div>
          )}
          <div>
            <Label htmlFor="adminNotes" className="text-sm font-medium">
              Add New Notes
            </Label>
            <Textarea
              id="adminNotes"
              placeholder="Add any notes or comments about this booking..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <Button className="w-full">Save Notes</Button>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Download Invoice
        </Button>
        <Button variant="outline" className="flex-1 gap-2 bg-transparent">
          Send Email to Passenger
        </Button>
      </div>

      {/* Confirm Status Change Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md border-0 bg-card p-6 shadow-lg">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Confirm Status Change
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Are you sure you want to change booking status from{" "}
                  <strong>{bookingData.bookingStatus}</strong> to{" "}
                  <strong>{newStatus}</strong>?
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isSaving}
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmStatusUpdate}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? "Updating..." : "Confirm"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
