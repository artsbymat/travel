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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
} from "lucide-react";

interface BankAccount {
  id: string;
  vendorName: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  accountType: string;
  status: string;
  verifiedDate: string;
}

interface Transaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  referenceNumber: string;
}

interface VendorFinance {
  id: string;
  vendorName: string;
  totalRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  bankAccount: string;
  lastWithdrawal: string;
}

export default function AdminFinancePage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "1",
      vendorName: "TravelHub Pro",
      bankName: "Bank BCA",
      accountNumber: "1234567890",
      accountHolder: "PT. TravelHub Pro",
      accountType: "Business",
      status: "Verified",
      verifiedDate: "2024-01-15",
    },
    {
      id: "2",
      vendorName: "Express Travel",
      bankName: "Bank Mandiri",
      accountNumber: "9876543210",
      accountHolder: "PT. Express Travel",
      accountType: "Business",
      status: "Verified",
      verifiedDate: "2024-02-20",
    },
    {
      id: "3",
      vendorName: "Comfort Journey",
      bankName: "Bank BNI",
      accountNumber: "5555666777",
      accountHolder: "PT. Comfort Journey",
      accountType: "Business",
      status: "Pending",
      verifiedDate: "",
    },
  ]);

  const [vendorFinances, setVendorFinances] = useState<VendorFinance[]>([
    {
      id: "1",
      vendorName: "TravelHub Pro",
      totalRevenue: 50000000,
      pendingAmount: 5000000,
      paidAmount: 45000000,
      bankAccount: "BCA - 1234567890",
      lastWithdrawal: "2024-01-20",
    },
    {
      id: "2",
      vendorName: "Express Travel",
      totalRevenue: 35000000,
      pendingAmount: 2000000,
      paidAmount: 33000000,
      bankAccount: "Mandiri - 9876543210",
      lastWithdrawal: "2024-01-18",
    },
    {
      id: "3",
      vendorName: "Comfort Journey",
      totalRevenue: 28000000,
      pendingAmount: 8000000,
      paidAmount: 20000000,
      bankAccount: "BNI - 5555666777",
      lastWithdrawal: "2024-01-15",
    },
  ]);

  const [transactions] = useState<Transaction[]>([
    {
      id: "1",
      date: "2024-01-20",
      type: "Withdrawal",
      amount: 45000000,
      description: "Monthly payout to TravelHub Pro",
      status: "Completed",
      referenceNumber: "TRF-2024-001",
    },
    {
      id: "2",
      date: "2024-01-18",
      type: "Withdrawal",
      amount: 33000000,
      description: "Monthly payout to Express Travel",
      status: "Completed",
      referenceNumber: "TRF-2024-002",
    },
    {
      id: "3",
      date: "2024-01-15",
      type: "Withdrawal",
      amount: 20000000,
      description: "Monthly payout to Comfort Journey",
      status: "Completed",
      referenceNumber: "TRF-2024-003",
    },
  ]);

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    vendorName: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    accountType: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      vendorName: "",
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      accountType: "",
    });
    setIsAddingAccount(false);
    setEditingId(null);
  };

  const handleAddAccount = () => {
    if (
      formData.vendorName &&
      formData.bankName &&
      formData.accountNumber &&
      formData.accountHolder
    ) {
      if (editingId) {
        setBankAccounts(
          bankAccounts.map((account) =>
            account.id === editingId
              ? {
                  ...account,
                  vendorName: formData.vendorName,
                  bankName: formData.bankName,
                  accountNumber: formData.accountNumber,
                  accountHolder: formData.accountHolder,
                  accountType: formData.accountType,
                }
              : account,
          ),
        );
      } else {
        const newAccount: BankAccount = {
          id: String(bankAccounts.length + 1),
          vendorName: formData.vendorName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolder: formData.accountHolder,
          accountType: formData.accountType,
          status: "Pending",
          verifiedDate: "",
        };
        setBankAccounts([...bankAccounts, newAccount]);
      }
      resetForm();
    }
  };

  const handleEditAccount = (account: BankAccount) => {
    setFormData({
      vendorName: account.vendorName,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      accountType: account.accountType,
    });
    setEditingId(account.id);
    setIsAddingAccount(true);
  };

  const handleDeleteAccount = (accountId: string) => {
    setBankAccounts(bankAccounts.filter((account) => account.id !== accountId));
  };

  const handleVerifyAccount = (accountId: string) => {
    setBankAccounts(
      bankAccounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              status: "Verified",
              verifiedDate: new Date().toISOString().split("T")[0],
            }
          : account,
      ),
    );
  };

  const totalRevenue = vendorFinances.reduce(
    (sum, v) => sum + v.totalRevenue,
    0,
  );
  const totalPending = vendorFinances.reduce(
    (sum, v) => sum + v.pendingAmount,
    0,
  );
  const totalPaid = vendorFinances.reduce((sum, v) => sum + v.paidAmount, 0);
  const verifiedAccounts = bankAccounts.filter(
    (a) => a.status === "Verified",
  ).length;

  const formatCurrency = (value: number) => {
    return `Rp${value.toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Finance Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage vendor bank accounts and financial transactions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="mt-2 text-lg font-bold text-foreground">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Payout</p>
              <p className="mt-2 text-lg font-bold text-orange-600">
                {formatCurrency(totalPending)}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Already Paid</p>
              <p className="mt-2 text-lg font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="border-0 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Verified Accounts</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {verifiedAccounts}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="finances">Vendor Finance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Bank Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          {isAddingAccount && (
            <Card className="border-0 bg-card p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editingId ? "Edit Bank Account" : "Add Bank Account"}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="vendorName" className="text-sm font-medium">
                      Vendor Name
                    </Label>
                    <Input
                      id="vendorName"
                      name="vendorName"
                      placeholder="Select vendor"
                      value={formData.vendorName}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName" className="text-sm font-medium">
                      Bank Name
                    </Label>
                    <Select
                      value={formData.bankName}
                      onValueChange={(value) =>
                        handleSelectChange("bankName", value)
                      }
                    >
                      <SelectTrigger id="bankName" className="mt-2">
                        <SelectValue placeholder="Select bank" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank BCA">Bank BCA</SelectItem>
                        <SelectItem value="Bank Mandiri">
                          Bank Mandiri
                        </SelectItem>
                        <SelectItem value="Bank BNI">Bank BNI</SelectItem>
                        <SelectItem value="Bank BTN">Bank BTN</SelectItem>
                        <SelectItem value="Bank CIMB Niaga">
                          Bank CIMB Niaga
                        </SelectItem>
                        <SelectItem value="Bank Permata">
                          Bank Permata
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      htmlFor="accountNumber"
                      className="text-sm font-medium"
                    >
                      Account Number
                    </Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      placeholder="e.g., 1234567890"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="accountHolder"
                      className="text-sm font-medium"
                    >
                      Account Holder Name
                    </Label>
                    <Input
                      id="accountHolder"
                      name="accountHolder"
                      placeholder="e.g., PT. Company Name"
                      value={formData.accountHolder}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label
                      htmlFor="accountType"
                      className="text-sm font-medium"
                    >
                      Account Type
                    </Label>
                    <Select
                      value={formData.accountType}
                      onValueChange={(value) =>
                        handleSelectChange("accountType", value)
                      }
                    >
                      <SelectTrigger id="accountType" className="mt-2">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Button onClick={handleAddAccount} className="flex-1">
                    {editingId ? "Update Account" : "Add Account"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {!isAddingAccount && (
            <Button
              onClick={() => {
                resetForm();
                setIsAddingAccount(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Bank Account
            </Button>
          )}

          <Card className="border-0 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Vendor Name
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Bank Name
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Account Number
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Account Holder
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
                  {bankAccounts.length > 0 ? (
                    bankAccounts.map((account) => (
                      <TableRow
                        key={account.id}
                        className="border-b border-border hover:bg-muted/50"
                      >
                        <TableCell className="px-6 py-4 font-medium text-foreground">
                          {account.vendorName}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-foreground">
                          {account.bankName}
                        </TableCell>
                        <TableCell className="px-6 py-4 font-mono text-sm text-muted-foreground">
                          {account.accountNumber}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-foreground">
                          {account.accountHolder}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <Badge
                            className={
                              account.status === "Verified"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {account.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {account.status === "Pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleVerifyAccount(account.id)}
                                className="h-8 px-2 text-xs text-green-600 hover:bg-green-50"
                              >
                                Verify
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditAccount(account)}
                              className="h-8 w-8 p-0"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAccount(account.id)}
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
                        colSpan={6}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        No bank accounts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Vendor Finance Tab */}
        <TabsContent value="finances" className="space-y-4">
          <Card className="border-0 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Vendor Name
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-sm font-semibold">
                      Total Revenue
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-sm font-semibold">
                      Pending Payout
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-sm font-semibold">
                      Already Paid
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Bank Account
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Last Withdrawal
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorFinances.map((finance) => (
                    <TableRow
                      key={finance.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <TableCell className="px-6 py-4 font-medium text-foreground">
                        {finance.vendorName}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatCurrency(finance.totalRevenue)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-semibold text-orange-600">
                        {formatCurrency(finance.pendingAmount)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-semibold text-green-600">
                        {formatCurrency(finance.paidAmount)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                        {finance.bankAccount}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-foreground">
                        {finance.lastWithdrawal}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card className="border-0 bg-card shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border">
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Date
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Reference
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Type
                    </TableHead>
                    <TableHead className="px-6 py-3 text-left text-sm font-semibold">
                      Description
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-sm font-semibold">
                      Amount
                    </TableHead>
                    <TableHead className="px-6 py-3 text-center text-sm font-semibold">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="border-b border-border hover:bg-muted/50"
                    >
                      <TableCell className="px-6 py-4 text-sm text-foreground">
                        {transaction.date}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-mono text-sm text-muted-foreground">
                        {transaction.referenceNumber}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-foreground">
                        {transaction.type}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-foreground">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-semibold text-foreground">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center">
                        <Badge className="bg-green-100 text-green-800">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
