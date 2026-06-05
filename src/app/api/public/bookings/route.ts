/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createDuitkuInvoice } from "@/lib/duitku";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tripId, selectedSeats, passengers, contact, paymentMethod } = body;

    if (!tripId || !selectedSeats || selectedSeats.length === 0 || !contact) {
      return NextResponse.json(
        { error: "Data booking tidak lengkap. Trip, kursi, dan kontak wajib diisi." },
        { status: 400 }
      );
    }

    // Process everything in a secure transaction block
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Trip & Vehicle & Vendor
      const trip = await tx.trip.findUnique({
        where: { id: tripId },
        include: {
          vehicle: {
            include: {
              vendor: true
            }
          }
        }
      });

      if (!trip) {
        throw new Error("Perjalanan tidak ditemukan.");
      }

      const vendor = trip.vehicle.vendor;

      // 2. Validate Seat Availability (race conditions check)
      const existingSeats = await tx.tripSeat.findMany({
        where: {
          tripId: tripId,
          seatNo: { in: selectedSeats }
        }
      });

      // If seats don't exist yet, we create them first as dynamic layout
      if (existingSeats.length === 0) {
        throw new Error("Pilihan kursi tidak valid.");
      }

      const unavailableSeats = existingSeats.filter((s) => s.status !== "AVAILABLE");
      if (unavailableSeats.length > 0) {
        const numbers = unavailableSeats.map((s) => s.seatNo).join(", ");
        throw new Error(`Kursi [${numbers}] sudah dipesan oleh orang lain. Silakan pilih kursi lain.`);
      }

      // 3. Compute price details dynamically
      const seatCount = selectedSeats.length;
      const pricePerSeat = new Prisma.Decimal(trip.price);
      const subtotal = pricePerSeat.times(seatCount);

      // Compute dynamic platform fee rate percentage
      const platformFeeRate = vendor.platformFeeRate ? new Prisma.Decimal(vendor.platformFeeRate) : new Prisma.Decimal(2.0); // Default 2%
      const serviceFee = subtotal.times(platformFeeRate.div(100)); // Service fee is platformFeeRate% of subtotal

      // Compute vendor tax if enabled
      let taxAmount = new Prisma.Decimal(0);
      if (vendor.taxEnabled && vendor.taxRate) {
        taxAmount = subtotal.times(new Prisma.Decimal(vendor.taxRate).div(100));
      }

      const totalAmount = subtotal.plus(taxAmount).plus(serviceFee);
      const platformFeeAmount = serviceFee;
      const vendorAmount = subtotal.plus(taxAmount);

      // 4. Map Payment Methods
      let mappedMethod: "CASH" | "EWALLET" | "BANK_TRANSFER" | "QRIS" = "QRIS";
      if (paymentMethod === "cash") {
        mappedMethod = "CASH";
      } else if (paymentMethod === "e-wallet") {
        mappedMethod = "EWALLET";
      } else if (paymentMethod === "virtual-account") {
        mappedMethod = "BANK_TRANSFER";
      }

      // 5. Generate unique short bookingCode (Format: TRV-YYMM-RANDOM)
      const now = new Date();
      const yy = String(now.getFullYear()).substring(2);
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const bookingCode = `TRV-${yy}${mm}-${randomPart}`;

      // 6. Serialize passengers, addresses, and extra comments in notes
      const notesPayload = JSON.stringify({
        pickupAddress: contact.pickupAddress,
        dropoffAddress: contact.dropoffAddress,
        customerNotes: contact.notes,
        passengers: passengers.map((p: any, idx: number) => ({
          fullName: p.fullName || "Penumpang " + (idx + 1),
          phone: p.phone || contact.phone,
          identityNumber: p.identityNumber || "",
          seatNo: selectedSeats[idx]
        }))
      });

      // 7. Create the Booking
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          customerName: contact.name,
          customerPhone: contact.phone,
          customerEmail: contact.email,
          pickupLat: contact.pickupLat ? parseFloat(contact.pickupLat) : null,
          pickupLng: contact.pickupLng ? parseFloat(contact.pickupLng) : null,
          pickupAddress: contact.pickupAddress || null,
          tripId: trip.id,
          seatCount,
          subtotal,
          taxAmount,
          totalAmount,
          platformFeeRate,
          platformFeeAmount,
          vendorAmount,
          paymentMethod: mappedMethod,
          paymentStatus: "UNPAID",
          status: "PENDING",
          notes: notesPayload,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins expiry
        }
      });

      // 8. Update TripSeat records to BOOKED and link to booking
      await tx.tripSeat.updateMany({
        where: {
          tripId: tripId,
          seatNo: { in: selectedSeats }
        },
        data: {
          status: "BOOKED",
          bookingId: booking.id
        }
      });

      // 9. Generate Payment Transaction
      const externalId = `TX-${booking.id}-${Date.now()}`;
      await tx.paymentTransaction.create({
        data: {
          bookingId: booking.id,
          provider: "duitku",
          externalId,
          grossAmount: totalAmount,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
      });

      // 10. Record TripActivity Audit Trail
      await tx.tripActivity.create({
        data: {
          tripId: trip.id,
          action: "BOOKING_CREATED",
          description: `Booking baru dibuat oleh customer ${contact.name} (${bookingCode}) untuk ${seatCount} kursi: ${selectedSeats.join(", ")}.`
        }
      });

      return { booking, trip, totalAmount, mappedMethod };
    });

    let paymentUrl = null;

    // Call Duitku API to generate payment links for all cashless transactions
    if (result.mappedMethod !== "CASH") {
      const parsedAmount = parseFloat(result.totalAmount.toString());
      const itemDetails = selectedSeats.map((seat: string) => ({
        name: `Tiket Kursi ${seat} (${result.trip.origin} -> ${result.trip.destination})`,
        price: parseFloat(result.trip.price.toString()),
        quantity: 1
      }));

      // Add vendor tax if exists
      const parsedTax = parseFloat(result.booking.taxAmount?.toString() || "0");
      if (parsedTax > 0) {
        itemDetails.push({
          name: `${result.trip.vehicle.vendor.taxName || "Pajak"} (${result.trip.vehicle.vendor.taxRate}%)`,
          price: parsedTax,
          quantity: 1
        });
      }

      // Add platform service fee if exists
      const parsedPlatformFee = parseFloat(result.booking.platformFeeAmount?.toString() || "0");
      if (parsedPlatformFee > 0) {
        itemDetails.push({
          name: "Biaya Layanan Jaringan",
          price: parsedPlatformFee,
          quantity: 1
        });
      }

      const requestDetails = {
        merchantOrderId: result.booking.bookingCode, // String bookingCode
        paymentAmount: parsedAmount,
        productDetails: `Perjalanan ${result.trip.origin} ke ${result.trip.destination} (${result.booking.bookingCode})`,
        customerName: contact.name,
        customerEmail: contact.email || "customer@travelku.com",
        customerPhone: contact.phone,
        itemDetails
      };

      const dRes = await createDuitkuInvoice(requestDetails);

      if (dRes.success && dRes.paymentUrl) {
        paymentUrl = dRes.paymentUrl;

        // Update transaction reference with response reference from Duitku
        await prisma.paymentTransaction.updateMany({
          where: { bookingId: result.booking.id, status: "PENDING" },
          data: {
            externalId: dRes.reference || result.booking.bookingCode,
            rawPayload: dRes as any
          }
        });
      } else {
        console.error("[DUITKU] Request payment error:", dRes.statusMessage);
        return NextResponse.json({
          success: true,
          booking: result.booking,
          paymentUrl: null,
          warning: "Gagal menghubungkan ke Duitku. Pembayaran dapat diselesaikan nanti. " + dRes.statusMessage
        });
      }
    }

    return NextResponse.json({ success: true, booking: result.booking, paymentUrl });
  } catch (error: any) {
    console.error("Checkout booking transaction error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat pemesanan." }, { status: 500 });
  }
}
