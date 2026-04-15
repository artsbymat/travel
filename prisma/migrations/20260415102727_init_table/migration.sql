-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'OWNER', 'STAFF', 'DRIVER');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EWalletType" AS ENUM ('GOPAY', 'OVO', 'DANA', 'SHOPEEPAY', 'LINKAJA', 'OTHER');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'BROKEN', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'EWALLET', 'TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED', 'TRANSFERRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'SETTLED', 'HELD');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('ORIGINAL', 'BANK_TRANSFER', 'CASH_PICKUP', 'CREDIT');

-- CreateEnum
CREATE TYPE "Amenity" AS ENUM ('AC', 'TOLL', 'USB', 'BLANKET', 'SNACK', 'DRINK', 'WIFI', 'TV', 'TOILET', 'RECLINING_SEAT', 'LEGROOM', 'LUGGAGE');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('RESCHEDULE', 'CANCELLATION', 'REFUND', 'LUGGAGE', 'DEPARTURE', 'DISCLAIMER', 'OTHER');

-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "provinceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL,
    "vendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "cityId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHeld" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "npwp" TEXT,
    "siup" TEXT,
    "taxEnabled" BOOLEAN NOT NULL DEFAULT false,
    "taxRate" DECIMAL(5,2),
    "taxName" TEXT DEFAULT 'PPN',
    "acceptCash" BOOLEAN NOT NULL DEFAULT true,
    "platformFeeRate" DECIMAL(5,2),
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankAccountName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPolicy" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" "PolicyType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRefundPolicy" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "hoursBeforeDeparture" INTEGER NOT NULL,
    "refundPercentage" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorRefundPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorEWallet" (
    "id" TEXT NOT NULL,
    "type" "EWalletType" NOT NULL,
    "name" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorEWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "name" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "capacity" INTEGER NOT NULL,
    "color" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageUrl" TEXT,
    "seatLayout" JSONB,
    "vendorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "originDetail" TEXT,
    "destinationDetail" TEXT,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "arrivalTime" TIMESTAMP(3),
    "price" DECIMAL(12,2) NOT NULL,
    "amenities" "Amenity"[] DEFAULT ARRAY[]::"Amenity"[],
    "minBooking" INTEGER NOT NULL DEFAULT 1,
    "bookingDeadline" TIMESTAMP(3),
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripSeat" (
    "id" TEXT NOT NULL,
    "seatNo" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,
    "status" "SeatStatus" NOT NULL DEFAULT 'AVAILABLE',
    "tripId" TEXT NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "tripId" TEXT NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2),
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "platformFeeRate" DECIMAL(5,2),
    "platformFeeAmount" DECIMAL(12,2),
    "vendorAmount" DECIMAL(12,2),
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "pgTransactionId" TEXT,
    "pgProvider" TEXT,
    "ewalletType" "EWalletType",
    "ewalletName" TEXT,
    "ewalletNo" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "transferredFromId" TEXT,
    "billingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBilling" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "totalBookings" INTEGER NOT NULL,
    "totalGrossAmount" DECIMAL(14,2) NOT NULL,
    "totalFeeAmount" DECIMAL(14,2) NOT NULL,
    "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "BillingStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBillingPayment" (
    "id" TEXT NOT NULL,
    "billingId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorBillingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSettlement" (
    "id" TEXT NOT NULL,
    "settlementNo" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalBookings" INTEGER NOT NULL,
    "totalGrossAmount" DECIMAL(14,2) NOT NULL,
    "totalFeeAmount" DECIMAL(14,2) NOT NULL,
    "totalPgFeeAmount" DECIMAL(14,2) NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "settledAt" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "refundCode" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "originalAmount" DECIMAL(12,2) NOT NULL,
    "refundPercentage" DECIMAL(5,2) NOT NULL,
    "refundAmount" DECIMAL(12,2) NOT NULL,
    "adminFee" DECIMAL(12,2),
    "finalAmount" DECIMAL(12,2) NOT NULL,
    "hoursBeforeDeparture" INTEGER NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundMethod" "RefundMethod" NOT NULL,
    "customerBankName" TEXT,
    "customerBankAccount" TEXT,
    "customerBankAccountName" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processedById" TEXT,
    "deductedFromBillingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Province_name_key" ON "Province"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Province_code_key" ON "Province"("code");

-- CreateIndex
CREATE UNIQUE INDEX "City_code_key" ON "City"("code");

-- CreateIndex
CREATE INDEX "City_provinceId_idx" ON "City"("provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "City_provinceId_name_key" ON "City"("provinceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_vendorId_idx" ON "User"("vendorId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_slug_key" ON "Vendor"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_email_key" ON "Vendor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_npwp_key" ON "Vendor"("npwp");

-- CreateIndex
CREATE INDEX "Vendor_cityId_idx" ON "Vendor"("cityId");

-- CreateIndex
CREATE INDEX "Vendor_isActive_idx" ON "Vendor"("isActive");

-- CreateIndex
CREATE INDEX "Vendor_isHeld_idx" ON "Vendor"("isHeld");

-- CreateIndex
CREATE INDEX "VendorPolicy_vendorId_idx" ON "VendorPolicy"("vendorId");

-- CreateIndex
CREATE INDEX "VendorPolicy_type_idx" ON "VendorPolicy"("type");

-- CreateIndex
CREATE INDEX "VendorPolicy_isActive_idx" ON "VendorPolicy"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPolicy_vendorId_type_key" ON "VendorPolicy"("vendorId", "type");

-- CreateIndex
CREATE INDEX "VendorRefundPolicy_vendorId_idx" ON "VendorRefundPolicy"("vendorId");

-- CreateIndex
CREATE INDEX "VendorRefundPolicy_isActive_idx" ON "VendorRefundPolicy"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRefundPolicy_vendorId_hoursBeforeDeparture_key" ON "VendorRefundPolicy"("vendorId", "hoursBeforeDeparture");

-- CreateIndex
CREATE INDEX "VendorEWallet_vendorId_idx" ON "VendorEWallet"("vendorId");

-- CreateIndex
CREATE INDEX "VendorEWallet_isActive_idx" ON "VendorEWallet"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VendorEWallet_vendorId_type_accountNo_key" ON "VendorEWallet"("vendorId", "type", "accountNo");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_licensePlate_key" ON "Vehicle"("licensePlate");

-- CreateIndex
CREATE INDEX "Vehicle_vendorId_idx" ON "Vehicle"("vendorId");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Trip_vehicleId_idx" ON "Trip"("vehicleId");

-- CreateIndex
CREATE INDEX "Trip_origin_destination_idx" ON "Trip"("origin", "destination");

-- CreateIndex
CREATE INDEX "Trip_departureTime_idx" ON "Trip"("departureTime");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "TripSeat_tripId_idx" ON "TripSeat"("tripId");

-- CreateIndex
CREATE INDEX "TripSeat_status_idx" ON "TripSeat"("status");

-- CreateIndex
CREATE INDEX "TripSeat_bookingId_idx" ON "TripSeat"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "TripSeat_tripId_seatNo_key" ON "TripSeat"("tripId", "seatNo");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_transferredFromId_key" ON "Booking"("transferredFromId");

-- CreateIndex
CREATE INDEX "Booking_tripId_idx" ON "Booking"("tripId");

-- CreateIndex
CREATE INDEX "Booking_customerPhone_idx" ON "Booking"("customerPhone");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

-- CreateIndex
CREATE INDEX "Booking_paymentMethod_idx" ON "Booking"("paymentMethod");

-- CreateIndex
CREATE INDEX "Booking_billingId_idx" ON "Booking"("billingId");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBilling_invoiceNo_key" ON "VendorBilling"("invoiceNo");

-- CreateIndex
CREATE INDEX "VendorBilling_vendorId_idx" ON "VendorBilling"("vendorId");

-- CreateIndex
CREATE INDEX "VendorBilling_status_idx" ON "VendorBilling"("status");

-- CreateIndex
CREATE INDEX "VendorBilling_dueDate_idx" ON "VendorBilling"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBilling_vendorId_periodStart_periodEnd_key" ON "VendorBilling"("vendorId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "VendorBillingPayment_billingId_idx" ON "VendorBillingPayment"("billingId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSettlement_settlementNo_key" ON "VendorSettlement"("settlementNo");

-- CreateIndex
CREATE INDEX "VendorSettlement_vendorId_idx" ON "VendorSettlement"("vendorId");

-- CreateIndex
CREATE INDEX "VendorSettlement_status_idx" ON "VendorSettlement"("status");

-- CreateIndex
CREATE INDEX "VendorSettlement_settledAt_idx" ON "VendorSettlement"("settledAt");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundCode_key" ON "Refund"("refundCode");

-- CreateIndex
CREATE INDEX "Refund_bookingId_idx" ON "Refund"("bookingId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE INDEX "Refund_requestedAt_idx" ON "Refund"("requestedAt");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPolicy" ADD CONSTRAINT "VendorPolicy_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRefundPolicy" ADD CONSTRAINT "VendorRefundPolicy_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorEWallet" ADD CONSTRAINT "VendorEWallet_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSeat" ADD CONSTRAINT "TripSeat_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripSeat" ADD CONSTRAINT "TripSeat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_transferredFromId_fkey" FOREIGN KEY ("transferredFromId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "VendorBilling"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBilling" ADD CONSTRAINT "VendorBilling_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBillingPayment" ADD CONSTRAINT "VendorBillingPayment_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "VendorBilling"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBillingPayment" ADD CONSTRAINT "VendorBillingPayment_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorSettlement" ADD CONSTRAINT "VendorSettlement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_deductedFromBillingId_fkey" FOREIGN KEY ("deductedFromBillingId") REFERENCES "VendorBilling"("id") ON DELETE SET NULL ON UPDATE CASCADE;
