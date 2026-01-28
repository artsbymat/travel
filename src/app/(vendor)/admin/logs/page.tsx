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
import {
  Search,
  Download,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  Edit2,
  Plus,
  Trash2,
  LogIn,
  LogOut,
  Clock,
} from "lucide-react";

interface ActivityLog {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  vendor: string;
  action: string;
  category: string;
  module: string;
  details: string;
  status: string;
  ipAddress: string;
  userAgent: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: "1",
      timestamp: "2025-02-15T14:30:00",
      date: "2025-02-15",
      time: "14:30:00",
      vendor: "TravelHub Pro",
      action: "Create Trip",
      category: "Trip Management",
      module: "Trip",
      details: "Created new trip: Jakarta - Bandung (Trip ID: TRP001)",
      status: "Success",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    {
      id: "2",
      timestamp: "2025-02-15T13:45:00",
      date: "2025-02-15",
      time: "13:45:00",
      vendor: "Express Travel",
      action: "Update Driver",
      category: "Driver Management",
      module: "Driver",
      details:
        "Updated driver profile: Budi Santoso (Status changed to Active)",
      status: "Success",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
    },
    {
      id: "3",
      timestamp: "2025-02-15T12:20:00",
      date: "2025-02-15",
      time: "12:20:00",
      vendor: "Comfort Journey",
      action: "Delete Car",
      category: "Fleet Management",
      module: "Car",
      details: "Deleted vehicle from fleet: Toyota Hiace (License: B-1234-ABC)",
      status: "Success",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
    {
      id: "4",
      timestamp: "2025-02-15T11:00:00",
      date: "2025-02-15",
      time: "11:00:00",
      vendor: "TravelHub Pro",
      action: "Create Coupon",
      category: "Discount Management",
      module: "Coupon",
      details:
        "Created discount coupon: SAVE50 (50% off, valid until 2025-02-28)",
      status: "Success",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    {
      id: "5",
      timestamp: "2025-02-15T10:15:00",
      date: "2025-02-15",
      time: "10:15:00",
      vendor: "Express Travel",
      action: "Update Bank Account",
      category: "Finance",
      module: "Finance",
      details: "Updated bank account information (Bank: Bank Mandiri)",
      status: "Success",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
    },
    {
      id: "6",
      timestamp: "2025-02-14T16:45:00",
      date: "2025-02-14",
      time: "16:45:00",
      vendor: "TravelHub Pro",
      action: "Login",
      category: "Authentication",
      module: "Auth",
      details: "Vendor admin logged in successfully",
      status: "Success",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    {
      id: "7",
      timestamp: "2025-02-14T15:20:00",
      date: "2025-02-14",
      time: "15:20:00",
      vendor: "Comfort Journey",
      action: "Failed Login Attempt",
      category: "Authentication",
      module: "Auth",
      details: "Failed login attempt - Invalid credentials",
      status: "Failed",
      ipAddress: "192.168.1.103",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    {
      id: "8",
      timestamp: "2025-02-14T14:00:00",
      date: "2025-02-14",
      time: "14:00:00",
      vendor: "Express Travel",
      action: "Create Trip",
      category: "Trip Management",
      module: "Trip",
      details: "Created new trip: Surabaya - Yogyakarta (Trip ID: TRP002)",
      status: "Success",
      ipAddress: "192.168.1.101",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
    },
    {
      id: "9",
      timestamp: "2025-02-13T13:30:00",
      date: "2025-02-13",
      time: "13:30:00",
      vendor: "TravelHub Pro",
      action: "Update Trip",
      category: "Trip Management",
      module: "Trip",
      details:
        "Updated trip details: Jakarta - Bandung (Changed departure time)",
      status: "Success",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
    {
      id: "10",
      timestamp: "2025-02-13T11:45:00",
      date: "2025-02-13",
      time: "11:45:00",
      vendor: "Comfort Journey",
      action: "Create Car",
      category: "Fleet Management",
      module: "Car",
      details:
        "Added new vehicle to fleet: Mercedes-Benz Sprinter (License: B-5678-DEF)",
      status: "Success",
      ipAddress: "192.168.1.102",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterVendor, setFilterVendor] = useState("All Vendors");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getActionIcon = (action: string) => {
    if (action.includes("Create")) return <Plus className="h-4 w-4" />;
    if (action.includes("Update")) return <Edit2 className="h-4 w-4" />;
    if (action.includes("Delete")) return <Trash2 className="h-4 w-4" />;
    if (action.includes("Login")) return <LogIn className="h-4 w-4" />;
    if (action.includes("Logout")) return <LogOut className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      searchTerm === "" ||
      log.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchVendor =
      filterVendor === "All Vendors" || log.vendor === filterVendor;
    const matchCategory =
      filterCategory === "All Categories" || log.category === filterCategory;
    const matchStatus =
      filterStatus === "All Status" || log.status === filterStatus;

    return matchSearch && matchVendor && matchCategory && matchStatus;
  });

  const uniqueVendors = Array.from(new Set(logs.map((log) => log.vendor)));
  const uniqueCategories = Array.from(new Set(logs.map((log) => log.category)));
  const uniqueStatuses = Array.from(new Set(logs.map((log) => log.status)));

  const handleExport = () => {
    const csv = [
      [
        "Timestamp",
        "Vendor",
        "Action",
        "Category",
        "Details",
        "Status",
        "IP Address",
      ],
      ...filteredLogs.map((log) => [
        log.timestamp,
        log.vendor,
        log.action,
        log.category,
        log.details,
        log.status,
        log.ipAddress,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `activity-logs-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.click();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor vendor activities and system events
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-0 bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Logs</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {logs.length}
          </p>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Success Activities</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {logs.filter((l) => l.status === "Success").length}
          </p>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Failed Activities</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {logs.filter((l) => l.status === "Failed").length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Filters</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="search" className="text-sm font-medium">
                Search
              </Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search vendor, action, details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="vendor" className="text-sm font-medium">
                Vendor
              </Label>
              <Select value={filterVendor} onValueChange={setFilterVendor}>
                <SelectTrigger id="vendor" className="mt-2">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Vendors">All Vendors</SelectItem>
                  {uniqueVendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="category" className="mt-2">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="status" className="mt-2">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="border-0 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Timestamp
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Vendor
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Action
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Category
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Details
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Status
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <TableCell className="px-6 py-4 text-sm text-foreground">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{log.date}</span>
                        <span className="text-xs text-muted-foreground">
                          {log.time}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {log.vendor}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-medium text-foreground">
                          {log.action}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="secondary" className="text-xs">
                        {log.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <p className="max-w-xs truncate text-sm text-foreground">
                        {log.details}
                      </p>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {log.status === "Success" ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <Badge className="bg-green-100 text-green-800">
                              Success
                            </Badge>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <Badge className="bg-red-100 text-red-800">
                              Failed
                            </Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetails(true);
                          }}
                          className="h-8 w-8 p-0"
                          title="View Details"
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
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No logs found matching your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl border-0 bg-card p-6 shadow-lg">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Activity Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Timestamp
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedLog.timestamp}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Vendor
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedLog.vendor}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Action
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedLog.action}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Category
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedLog.category}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Module
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedLog.module}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-1">
                    <Badge
                      className={
                        selectedLog.status === "Success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground">
                  Details
                </p>
                <p className="mt-2 rounded-lg bg-muted p-3 text-sm text-foreground">
                  {selectedLog.details}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-border pt-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    IP Address
                  </p>
                  <p className="mt-1 font-mono text-sm text-foreground">
                    {selectedLog.ipAddress}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    User Agent
                  </p>
                  <p className="mt-1 max-h-24 overflow-y-auto font-mono text-xs text-muted-foreground">
                    {selectedLog.userAgent}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="bg-transparent"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
