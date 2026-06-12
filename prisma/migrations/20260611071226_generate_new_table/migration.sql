/*
  Warnings:

  - A unique constraint covering the columns `[rescheduledFromId]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "PayrollSlipStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID');

-- CreateEnum
CREATE TYPE "PayrollItemType" AS ENUM ('BASE_SALARY', 'COMMISSION', 'BONUS', 'DEDUCTION');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TripStatus" ADD VALUE 'DELAYED';
ALTER TYPE "TripStatus" ADD VALUE 'WAITING_DRIVER';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "pickupAddress" TEXT;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "rescheduledFromId" TEXT,
ADD COLUMN     "rescheduledReason" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "images" JSONB;

-- CreateTable
CREATE TABLE "TripActivity" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseSalary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "commissionType" "CommissionType",
    "commissionValue" DECIMAL(14,2),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPeriod" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSlip" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "baseSalary" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalCommission" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalBonus" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalDeduction" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "PayrollSlipStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollSlip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSlipItem" (
    "id" TEXT NOT NULL,
    "slipId" TEXT NOT NULL,
    "type" "PayrollItemType" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollSlipItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollTripCommission" (
    "id" TEXT NOT NULL,
    "slipId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "tripDate" TIMESTAMP(3) NOT NULL,
    "tripRoute" TEXT NOT NULL,
    "tripPrice" DECIMAL(12,2) NOT NULL,
    "commissionType" "CommissionType" NOT NULL,
    "commissionValue" DECIMAL(14,2) NOT NULL,
    "commissionAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollTripCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripActivity_tripId_idx" ON "TripActivity"("tripId");

-- CreateIndex
CREATE INDEX "TripActivity_userId_idx" ON "TripActivity"("userId");

-- CreateIndex
CREATE INDEX "TripActivity_action_idx" ON "TripActivity"("action");

-- CreateIndex
CREATE INDEX "TripActivity_createdAt_idx" ON "TripActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollConfig_userId_key" ON "PayrollConfig"("userId");

-- CreateIndex
CREATE INDEX "PayrollConfig_userId_idx" ON "PayrollConfig"("userId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_vendorId_idx" ON "PayrollPeriod"("vendorId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_status_idx" ON "PayrollPeriod"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPeriod_vendorId_month_year_key" ON "PayrollPeriod"("vendorId", "month", "year");

-- CreateIndex
CREATE INDEX "PayrollSlip_periodId_idx" ON "PayrollSlip"("periodId");

-- CreateIndex
CREATE INDEX "PayrollSlip_userId_idx" ON "PayrollSlip"("userId");

-- CreateIndex
CREATE INDEX "PayrollSlip_status_idx" ON "PayrollSlip"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollSlip_periodId_userId_key" ON "PayrollSlip"("periodId", "userId");

-- CreateIndex
CREATE INDEX "PayrollSlipItem_slipId_idx" ON "PayrollSlipItem"("slipId");

-- CreateIndex
CREATE INDEX "PayrollSlipItem_type_idx" ON "PayrollSlipItem"("type");

-- CreateIndex
CREATE INDEX "PayrollTripCommission_slipId_idx" ON "PayrollTripCommission"("slipId");

-- CreateIndex
CREATE INDEX "PayrollTripCommission_tripId_idx" ON "PayrollTripCommission"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollTripCommission_slipId_tripId_key" ON "PayrollTripCommission"("slipId", "tripId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_rescheduledFromId_key" ON "Trip"("rescheduledFromId");

-- CreateIndex
CREATE INDEX "Trip_rescheduledFromId_idx" ON "Trip"("rescheduledFromId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_rescheduledFromId_fkey" FOREIGN KEY ("rescheduledFromId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripActivity" ADD CONSTRAINT "TripActivity_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollConfig" ADD CONSTRAINT "PayrollConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPeriod" ADD CONSTRAINT "PayrollPeriod_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSlip" ADD CONSTRAINT "PayrollSlip_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "PayrollPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSlip" ADD CONSTRAINT "PayrollSlip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSlipItem" ADD CONSTRAINT "PayrollSlipItem_slipId_fkey" FOREIGN KEY ("slipId") REFERENCES "PayrollSlip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollTripCommission" ADD CONSTRAINT "PayrollTripCommission_slipId_fkey" FOREIGN KEY ("slipId") REFERENCES "PayrollSlip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollTripCommission" ADD CONSTRAINT "PayrollTripCommission_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
