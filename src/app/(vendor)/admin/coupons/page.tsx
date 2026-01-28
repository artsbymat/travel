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
import { Plus, Edit2, Trash2, Ticket, Copy } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  description: string;
  minPurchase: number;
  maxDiscount: number;
  usageLimit: number;
  usageCount: number;
  validFrom: string;
  validTo: string;
  status: string;
  createdDate: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: "1",
      code: "SUMMER50",
      discountType: "Percentage",
      discountValue: 50,
      description: "Summer special discount for all routes",
      minPurchase: 100000,
      maxDiscount: 500000,
      usageLimit: 1000,
      usageCount: 245,
      validFrom: "2024-06-01",
      validTo: "2024-08-31",
      status: "Active",
      createdDate: "2024-05-15",
    },
    {
      id: "2",
      code: "FIRST100",
      discountType: "Fixed",
      discountValue: 100000,
      description: "First-time user discount",
      minPurchase: 200000,
      maxDiscount: 100000,
      usageLimit: 500,
      usageCount: 487,
      validFrom: "2024-01-01",
      validTo: "2024-12-31",
      status: "Active",
      createdDate: "2024-01-01",
    },
    {
      id: "3",
      code: "LAST30",
      discountType: "Percentage",
      discountValue: 30,
      description: "End of month special offer",
      minPurchase: 150000,
      maxDiscount: 300000,
      usageLimit: 600,
      usageCount: 512,
      validFrom: "2024-01-25",
      validTo: "2024-01-31",
      status: "Expired",
      createdDate: "2024-01-20",
    },
  ]);

  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "",
    discountValue: "",
    description: "",
    minPurchase: "",
    maxDiscount: "",
    usageLimit: "",
    validFrom: "",
    validTo: "",
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

  const resetForm = () => {
    setFormData({
      code: "",
      discountType: "",
      discountValue: "",
      description: "",
      minPurchase: "",
      maxDiscount: "",
      usageLimit: "",
      validFrom: "",
      validTo: "",
    });
    setIsAddingCoupon(false);
    setEditingId(null);
  };

  const handleAddCoupon = () => {
    if (
      formData.code &&
      formData.discountType &&
      formData.discountValue &&
      formData.validFrom &&
      formData.validTo
    ) {
      if (editingId) {
        setCoupons(
          coupons.map((coupon) =>
            coupon.id === editingId
              ? {
                  ...coupon,
                  code: formData.code,
                  discountType: formData.discountType,
                  discountValue: Number(formData.discountValue),
                  description: formData.description,
                  minPurchase: Number(formData.minPurchase),
                  maxDiscount: Number(formData.maxDiscount),
                  usageLimit: Number(formData.usageLimit),
                  validFrom: formData.validFrom,
                  validTo: formData.validTo,
                }
              : coupon,
          ),
        );
      } else {
        const newCoupon: Coupon = {
          id: String(coupons.length + 1),
          code: formData.code,
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          description: formData.description,
          minPurchase: Number(formData.minPurchase),
          maxDiscount: Number(formData.maxDiscount),
          usageLimit: Number(formData.usageLimit),
          usageCount: 0,
          validFrom: formData.validFrom,
          validTo: formData.validTo,
          status: "Active",
          createdDate: new Date().toISOString().split("T")[0],
        };
        setCoupons([...coupons, newCoupon]);
      }
      resetForm();
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      description: coupon.description,
      minPurchase: String(coupon.minPurchase),
      maxDiscount: String(coupon.maxDiscount),
      usageLimit: String(coupon.usageLimit),
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
    });
    setEditingId(coupon.id);
    setIsAddingCoupon(true);
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCoupons(coupons.filter((coupon) => coupon.id !== couponId));
  };

  const handleToggleStatus = (couponId: string) => {
    setCoupons(
      coupons.map((coupon) =>
        coupon.id === couponId
          ? {
              ...coupon,
              status: coupon.status === "Active" ? "Inactive" : "Active",
            }
          : coupon,
      ),
    );
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.status === "Active").length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usageCount, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Discount Coupons
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage promotional coupon codes
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAddingCoupon(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Coupons</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {totalCoupons}
              </p>
            </div>
            <Ticket className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Coupons</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {activeCoupons}
              </p>
            </div>
            <Ticket className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Usage</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {totalUsage}
              </p>
            </div>
            <Ticket className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {isAddingCoupon && (
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {editingId ? "Edit Coupon" : "Create New Coupon"}
              </h2>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Coupon Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="code" className="text-sm font-medium">
                    Coupon Code
                  </Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g., SUMMER50"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="mt-2 uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="discountType" className="text-sm font-medium">
                    Discount Type
                  </Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) =>
                      handleSelectChange("discountType", value)
                    }
                  >
                    <SelectTrigger id="discountType" className="mt-2">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percentage">Percentage (%)</SelectItem>
                      <SelectItem value="Fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="discountValue"
                    className="text-sm font-medium"
                  >
                    Discount Value
                  </Label>
                  <Input
                    id="discountValue"
                    name="discountValue"
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="e.g., Summer special offer"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Restrictions
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="minPurchase" className="text-sm font-medium">
                    Minimum Purchase (Rp)
                  </Label>
                  <Input
                    id="minPurchase"
                    name="minPurchase"
                    type="number"
                    placeholder="e.g., 100000"
                    value={formData.minPurchase}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="maxDiscount" className="text-sm font-medium">
                    Maximum Discount (Rp)
                  </Label>
                  <Input
                    id="maxDiscount"
                    name="maxDiscount"
                    type="number"
                    placeholder="e.g., 500000"
                    value={formData.maxDiscount}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="usageLimit" className="text-sm font-medium">
                    Usage Limit
                  </Label>
                  <Input
                    id="usageLimit"
                    name="usageLimit"
                    type="number"
                    placeholder="e.g., 1000"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Validity Period
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="validFrom" className="text-sm font-medium">
                    Valid From
                  </Label>
                  <Input
                    id="validFrom"
                    name="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="validTo" className="text-sm font-medium">
                    Valid Until
                  </Label>
                  <Input
                    id="validTo"
                    name="validTo"
                    type="date"
                    value={formData.validTo}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-border pt-6">
              <Button
                variant="outline"
                onClick={resetForm}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button onClick={handleAddCoupon} className="flex-1">
                {editingId ? "Update Coupon" : "Create Coupon"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-0 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Code
                </TableHead>
                <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                  Description
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Discount
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Usage
                </TableHead>
                <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                  Valid Period
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
              {coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <TableRow
                    key={coupon.id}
                    className="border-b border-border hover:bg-muted/50"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-semibold text-foreground">
                          {coupon.code}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyCode(coupon.code)}
                          className="h-6 w-6 p-0"
                          title="Copy code"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                      {coupon.description}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="font-semibold text-foreground">
                        {coupon.discountType === "Percentage"
                          ? `${coupon.discountValue}%`
                          : `Rp${coupon.discountValue.toLocaleString("id-ID")}`}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="font-medium text-foreground">
                        {coupon.usageCount}/{coupon.usageLimit}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center text-sm text-muted-foreground">
                      {coupon.validFrom} to {coupon.validTo}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <Badge
                        className={
                          coupon.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : coupon.status === "Expired"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }
                        onClick={() => handleToggleStatus(coupon.id)}
                      >
                        {coupon.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCoupon(coupon)}
                          className="h-8 w-8 p-0"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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
                    No coupons found. Create a new coupon to get started.
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
