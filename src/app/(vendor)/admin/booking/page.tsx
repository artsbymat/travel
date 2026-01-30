"use client";

import { useState } from "react";
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
import {
  Eye,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Plus,
  X,
} from "lucide-react";
import { BookOpen } from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  bookingCode: string;
  passengerName: string;
  phone: string;
  email: string;
  tripRoute: string;
  tripDate: string;
  tripTime: string;
  seats: string;
  passengers: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  vendor: string;
  createdAt: string;
}

export default function AdminBookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: "1",
      bookingCode: "BK001",
      passengerName: "Ahmad Wijaya",
      phone: "081234567890",
      email: "ahmad@email.com",
      tripRoute: "Jakarta - Bandung",
      tripDate: "2025-02-15",
      tripTime: "08:00",
      seats: "5,6,7",
      passengers: 3,
      totalAmount: 450000,
      paymentStatus: "Completed",
      bookingStatus: "Confirmed",
      vendor: "TravelHub Pro",
      createdAt: "2025-02-10",
    },
    {
      id: "2",
      bookingCode: "BK002",
      passengerName: "Siti Nurhaliza",
      phone: "082345678901",
      email: "siti@email.com",
      tripRoute: "Surabaya - Yogyakarta",
      tripDate: "2025-02-18",
      tripTime: "14:30",
      seats: "12,13",
      passengers: 2,
      totalAmount: 300000,
      paymentStatus: "Pending",
      bookingStatus: "Pending",
      vendor: "Express Travel",
      createdAt: "2025-02-11",
    },
    {
      id: "3",
      bookingCode: "BK003",
      passengerName: "Budi Santoso",
      phone: "083456789012",
      email: "budi@email.com",
      tripRoute: "Bandung - Jakarta",
      tripDate: "2025-02-20",
      tripTime: "10:00",
      seats: "8,9,10,11",
      passengers: 4,
      totalAmount: 600000,
      paymentStatus: "Completed",
      bookingStatus: "Completed",
      vendor: "TravelHub Pro",
      createdAt: "2025-02-09",
    },
    {
      id: "4",
      bookingCode: "BK004",
      passengerName: "Rina Kusuma",
      phone: "084567890123",
      email: "rina@email.com",
      tripRoute: "Jakarta - Surabaya",
      tripDate: "2025-02-22",
      tripTime: "06:00",
      seats: "3,4",
      passengers: 2,
      totalAmount: 350000,
      paymentStatus: "Failed",
      bookingStatus: "Cancelled",
      vendor: "Comfort Journey",
      createdAt: "2025-02-12",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPayment, setFilterPayment] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [showManualForm, setShowManualForm] = useState(false);
  const [formData, setFormData] = useState({
    passengerName: "",
    phone: "",
    email: "",
    tripRoute: "",
    tripDate: "",
    tripTime: "",
    seats: "",
    passengers: 1,
    totalAmount: 0,
    paymentStatus: "Pending",
    bookingStatus: "Pending",
    vendor: "TravelHub Pro",
  });

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || booking.bookingStatus === filterStatus;
    const matchesPayment =
      filterPayment === "All" || booking.paymentStatus === filterPayment;

    return matchesSearch && matchesStatus && matchesPayment;
  });

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

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4" />;
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const handleDownloadInvoice = (booking: Booking) => {
    console.log("[v0] Downloading invoice for booking:", booking.bookingCode);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "passengers" || name === "totalAmount" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookings(
      bookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, bookingStatus: "Cancelled" }
          : booking,
      ),
    );
  };

  const handleAddManualBooking = () => {
    if (
      formData.passengerName &&
      formData.phone &&
      formData.email &&
      formData.tripRoute &&
      formData.tripDate &&
      formData.seats &&
      formData.totalAmount > 0
    ) {
      const newBooking: Booking = {
        id: String(bookings.length + 1),
        bookingCode: `BK${String(bookings.length + 1).padStart(3, "0")}`,
        ...formData,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setBookings([newBooking, ...bookings]);
      setFormData({
        passengerName: "",
        phone: "",
        email: "",
        tripRoute: "",
        tripDate: "",
        tripTime: "",
        seats: "",
        passengers: 1,
        totalAmount: 0,
        paymentStatus: "Pending",
        bookingStatus: "Pending",
        vendor: "TravelHub Pro",
      });
      setShowManualForm(false);
    }
  };

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(
    (b) => b.bookingStatus === "Confirmed",
  ).length;
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === "Completed")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Booking Management
        </h1>
        <p className="mt-2 text-muted-foreground">
          View and manage all customer bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {totalBookings}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Confirmed Bookings
              </p>
              <p className="mt-2 text-3xl font-bold text-primary">
                {confirmedBookings}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                Rp {(totalRevenue / 1000000).toFixed(2)}M
              </p>
            </div>
            <Clock className="h-8 w-8 text-accent" />
          </div>
        </Card>
      </div>

      {/* Manual Booking Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowManualForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Manual Booking
        </Button>
      </div>

      {/* Manual Booking Form Modal */}
      {showManualForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-h-screen w-full max-w-2xl overflow-y-auto bg-card p-6 shadow-lg">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  Add Manual Booking
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowManualForm(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Passenger Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Passenger Information
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="passengerName"
                      className="text-sm font-medium"
                    >
                      Passenger Name
                    </Label>
                    <Input
                      id="passengerName"
                      name="passengerName"
                      placeholder="Full name"
                      value={formData.passengerName}
                      onChange={handleInputChange}
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
                      placeholder="passenger@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Trip Information */}
              <div className="border-t border-border pt-4">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Trip Information
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="tripRoute" className="text-sm font-medium">
                      Trip Route
                    </Label>
                    <Input
                      id="tripRoute"
                      name="tripRoute"
                      placeholder="e.g., Jakarta - Bandung"
                      value={formData.tripRoute}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor" className="text-sm font-medium">
                      Vendor
                    </Label>
                    <Select
                      value={formData.vendor}
                      onValueChange={(value) =>
                        handleSelectChange("vendor", value)
                      }
                    >
                      <SelectTrigger id="vendor" className="mt-2">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TravelHub Pro">
                          TravelHub Pro
                        </SelectItem>
                        <SelectItem value="Express Travel">
                          Express Travel
                        </SelectItem>
                        <SelectItem value="Comfort Journey">
                          Comfort Journey
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tripDate" className="text-sm font-medium">
                      Trip Date
                    </Label>
                    <Input
                      id="tripDate"
                      name="tripDate"
                      type="date"
                      value={formData.tripDate}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tripTime" className="text-sm font-medium">
                      Trip Time
                    </Label>
                    <Input
                      id="tripTime"
                      name="tripTime"
                      type="time"
                      value={formData.tripTime}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="border-t border-border pt-4">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Booking Details
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="seats" className="text-sm font-medium">
                      Seat Numbers
                    </Label>
                    <Input
                      id="seats"
                      name="seats"
                      placeholder="e.g., 5,6,7"
                      value={formData.seats}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passengers" className="text-sm font-medium">
                      Number of Passengers
                    </Label>
                    <Input
                      id="passengers"
                      name="passengers"
                      type="number"
                      min="1"
                      value={formData.passengers}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="totalAmount"
                      className="text-sm font-medium"
                    >
                      Total Amount (Rp)
                    </Label>
                    <Input
                      id="totalAmount"
                      name="totalAmount"
                      type="number"
                      placeholder="0"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="border-t border-border pt-4">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Status
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label
                      htmlFor="paymentStatus"
                      className="text-sm font-medium"
                    >
                      Payment Status
                    </Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value) =>
                        handleSelectChange("paymentStatus", value)
                      }
                    >
                      <SelectTrigger id="paymentStatus" className="mt-2">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      htmlFor="bookingStatus"
                      className="text-sm font-medium"
                    >
                      Booking Status
                    </Label>
                    <Select
                      value={formData.bookingStatus}
                      onValueChange={(value) =>
                        handleSelectChange("bookingStatus", value)
                      }
                    >
                      <SelectTrigger id="bookingStatus" className="mt-2">
                        <SelectValue placeholder="Select booking status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="border-t border-border pt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowManualForm(false)}
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddManualBooking} className="flex-1">
                  Create Booking
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">
                Search Booking
              </Label>
              <Input
                id="search"
                placeholder="Booking code, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Booking Status
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status-filter" className="mt-2">
                  <SelectValue placeholder="Filter by status" />
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
              <Label htmlFor="payment-filter" className="text-sm font-medium">
                Payment Status
              </Label>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger id="payment-filter" className="mt-2">
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Payments</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Bookings Table */}
      <Card className="border-0 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Booking Code
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Passenger
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Trip Route
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Date & Time
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Amount
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Payment
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Status
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      {booking.bookingCode}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {booking.passengerName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {booking.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-foreground">
                      {booking.tripRoute}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {booking.tripDate}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {booking.tripTime}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 font-medium text-foreground">
                      Rp {booking.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        className={getPaymentStatusColor(booking.paymentStatus)}
                      >
                        {booking.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        className={getBookingStatusColor(booking.bookingStatus)}
                      >
                        <span className="mr-2">
                          {getStatusIcon(booking.bookingStatus)}
                        </span>
                        {booking.bookingStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin/booking/${booking.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="View Details"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="View Details"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No bookings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-h-screen w-full max-w-2xl overflow-y-auto bg-card p-6 shadow-lg">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  Booking Details
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowDetails(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Code</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.bookingCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.vendor}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Passenger Name
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.passengerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Passengers
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.passengers}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.phone}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Trip Route</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.tripRoute}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trip Date</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.tripDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trip Time</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.tripTime}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Seats</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.seats}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="mt-1 font-semibold text-foreground">
                    Rp {selectedBooking.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {selectedBooking.createdAt}
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Status Information
                </p>
                <div className="flex gap-4">
                  <div>
                    <Badge
                      className={getPaymentStatusColor(
                        selectedBooking.paymentStatus,
                      )}
                    >
                      Payment: {selectedBooking.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <Badge
                      className={getBookingStatusColor(
                        selectedBooking.bookingStatus,
                      )}
                    >
                      Booking: {selectedBooking.bookingStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetails(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleDownloadInvoice(selectedBooking)}
                    className="flex-1"
                  >
                    Download Invoice
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
