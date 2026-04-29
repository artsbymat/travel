/*
  Warnings:

  - You are about to drop the column `bankAccountName` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccountNo` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `Vendor` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('BOOKING_INCOME', 'CASH_INCOME', 'PLATFORM_FEE', 'REFUND_DEDUCTION', 'WITHDRAW', 'WITHDRAW_REVERSAL', 'SETTLEMENT', 'DEBT_PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('PLATFORM_CASH', 'PLATFORM_REVENUE', 'VENDOR_WALLET', 'VENDOR_CASH', 'VENDOR_DEBT', 'CUSTOMER_REFUND', 'PG_RECEIVABLE');

-- CreateEnum
CREATE TYPE "LedgerSide" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "PgStatus" AS ENUM ('PENDING', 'CHALLENGE', 'SUCCESS', 'SETTLEMENT', 'DENY', 'CANCEL', 'EXPIRE', 'FAILURE', 'REFUND');

-- CreateEnum
CREATE TYPE "WithdrawStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';
ALTER TYPE "PaymentMethod" ADD VALUE 'CREDIT_CARD';
ALTER TYPE "PaymentMethod" ADD VALUE 'QRIS';

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "bankAccountName",
DROP COLUMN "bankAccountNo",
DROP COLUMN "bankName";

-- CreateTable
CREATE TABLE "VendorWallet" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pendingIn" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "debt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balanceAfter" DECIMAL(14,2) NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "account" "LedgerAccount" NOT NULL,
    "side" "LedgerSide" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "vendorId" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'midtrans',
    "externalId" TEXT NOT NULL,
    "transactionId" TEXT,
    "paymentType" TEXT,
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "pgFeeAmount" DECIMAL(14,2),
    "netAmount" DECIMAL(14,2),
    "status" "PgStatus" NOT NULL DEFAULT 'PENDING',
    "rawPayload" JSONB,
    "callbackPayload" JSONB,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawRequest" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "adminFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankAccountNo" TEXT NOT NULL,
    "bankAccountName" TEXT NOT NULL,
    "status" "WithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorWallet_vendorId_key" ON "VendorWallet"("vendorId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "WalletTransaction_referenceId_idx" ON "WalletTransaction"("referenceId");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");

-- CreateIndex
CREATE INDEX "LedgerEntry_account_idx" ON "LedgerEntry"("account");

-- CreateIndex
CREATE INDEX "LedgerEntry_vendorId_idx" ON "LedgerEntry"("vendorId");

-- CreateIndex
CREATE INDEX "LedgerEntry_referenceId_idx" ON "LedgerEntry"("referenceId");

-- CreateIndex
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_externalId_key" ON "PaymentTransaction"("externalId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_bookingId_idx" ON "PaymentTransaction"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_externalId_idx" ON "PaymentTransaction"("externalId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

-- CreateIndex
CREATE INDEX "WithdrawRequest_walletId_idx" ON "WithdrawRequest"("walletId");

-- CreateIndex
CREATE INDEX "WithdrawRequest_vendorId_idx" ON "WithdrawRequest"("vendorId");

-- CreateIndex
CREATE INDEX "WithdrawRequest_status_idx" ON "WithdrawRequest"("status");

-- CreateIndex
CREATE INDEX "WithdrawRequest_requestedAt_idx" ON "WithdrawRequest"("requestedAt");

-- AddForeignKey
ALTER TABLE "VendorWallet" ADD CONSTRAINT "VendorWallet_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "VendorWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawRequest" ADD CONSTRAINT "WithdrawRequest_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "VendorWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
