/*
  Warnings:

  - You are about to drop the column `bio` on the `UserProfile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "scheduleId" TEXT,
ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "bio";

-- CreateTable
CREATE TABLE "TripTemplate" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "originDetail" TEXT,
    "destinationDetail" TEXT,
    "originLat" DOUBLE PRECISION,
    "originLng" DOUBLE PRECISION,
    "price" DECIMAL(12,2) NOT NULL,
    "amenities" "Amenity"[] DEFAULT ARRAY[]::"Amenity"[],
    "minBooking" INTEGER NOT NULL DEFAULT 1,
    "bookingDeadlineHours" INTEGER,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripTemplateSchedule" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "departureTime" TEXT NOT NULL,
    "priceOverride" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripTemplateSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripTemplate_vendorId_idx" ON "TripTemplate"("vendorId");

-- CreateIndex
CREATE INDEX "TripTemplate_isActive_idx" ON "TripTemplate"("isActive");

-- CreateIndex
CREATE INDEX "TripTemplate_origin_destination_idx" ON "TripTemplate"("origin", "destination");

-- CreateIndex
CREATE INDEX "TripTemplateSchedule_templateId_idx" ON "TripTemplateSchedule"("templateId");

-- CreateIndex
CREATE INDEX "TripTemplateSchedule_vehicleId_idx" ON "TripTemplateSchedule"("vehicleId");

-- CreateIndex
CREATE INDEX "TripTemplateSchedule_driverId_idx" ON "TripTemplateSchedule"("driverId");

-- CreateIndex
CREATE INDEX "TripTemplateSchedule_dayOfWeek_idx" ON "TripTemplateSchedule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "TripTemplateSchedule_isActive_idx" ON "TripTemplateSchedule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TripTemplateSchedule_templateId_vehicleId_dayOfWeek_departu_key" ON "TripTemplateSchedule"("templateId", "vehicleId", "dayOfWeek", "departureTime");

-- CreateIndex
CREATE INDEX "Trip_templateId_idx" ON "Trip"("templateId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TripTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplate" ADD CONSTRAINT "TripTemplate_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplateSchedule" ADD CONSTRAINT "TripTemplateSchedule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TripTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplateSchedule" ADD CONSTRAINT "TripTemplateSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTemplateSchedule" ADD CONSTRAINT "TripTemplateSchedule_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
