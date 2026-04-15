# Travel Booking Platform - Documentation

> Platform pemesanan travel/shuttle antar kota dengan multi-vendor

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Entity Relationship](#entity-relationship)
4. [Business Flow](#business-flow)
5. [Vendor Management](#vendor-management)
6. [Vehicle & Seat Management](#vehicle--seat-management)
7. [Trip Management](#trip-management)
8. [Booking Flow](#booking-flow)
9. [Payment System](#payment-system)
10. [Billing & Settlement](#billing--settlement)
11. [Refund System](#refund-system)
12. [Enums Reference](#enums-reference)

---

## Overview

Platform ini menghubungkan **vendor travel** dengan **penumpang** untuk pemesanan perjalanan antar kota. Platform mengambil **platform fee** dari setiap transaksi.

### Key Features

- ✅ Multi-vendor support
- ✅ Dynamic seat layout per kendaraan
- ✅ Multiple payment methods (Cash, E-Wallet, Transfer)
- ✅ Dynamic refund policy per vendor
- ✅ Minimum booking requirement per trip
- ✅ Monthly billing for cash payments
- ✅ Settlement tracking for online payments
- ✅ Trip amenities (AC, Toll, USB, dll)

---

## User Roles

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ROLES                              │
├─────────────────┬───────────────────────────────────────────────┤
│ SUPER_ADMIN     │ Admin platform, akses penuh                   │
│                 │ - Manage semua vendor                         │
│                 │ - Approve/reject vendor                       │
│                 │ - Manage billing & settlement                 │
│                 │ - Process refunds                             │
├─────────────────┼───────────────────────────────────────────────┤
│ OWNER           │ Pemilik vendor, terikat ke 1 vendor           │
│                 │ - Manage kendaraan & trip                     │
│                 │ - Manage staff & driver                       │
│                 │ - Lihat laporan keuangan                      │
│                 │ - Set kebijakan refund                        │
├─────────────────┼───────────────────────────────────────────────┤
│ STAFF           │ Staff operasional vendor                      │
│                 │ - Input trip harian                           │
│                 │ - Manage booking                              │
│                 │ - Terima pembayaran cash                      │
├─────────────────┼───────────────────────────────────────────────┤
│ DRIVER          │ Driver kendaraan                              │
│                 │ - Lihat trip yang di-assign                   │
│                 │ - Update status trip                          │
│                 │ - Terima pembayaran cash                      │
└─────────────────┴───────────────────────────────────────────────┘
```

---

## Entity Relationship

```
┌──────────────┐
│   Province   │
└──────┬───────┘
       │ 1:*
┌──────▼───────┐
│     City     │
└──────┬───────┘
       │ 1:*
┌──────▼───────┐      1:*     ┌─────────────────────┐
│    Vendor    │──────────────│ VendorRefundPolicy  │
└──────┬───────┘              └─────────────────────┘
       │
       ├──── 1:* ──── User
       │
       ├──── 1:* ──── VendorEWallet
       │
       ├──── 1:* ──── VendorBilling ──── 1:* ──── VendorBillingPayment
       │
       ├──── 1:* ──── VendorSettlement
       │
       └──── 1:* ──── Vehicle
                         │
                         └──── 1:* ──── Trip
                                          │
                                          ├──── 1:* ──── TripSeat
                                          │                  │
                                          │                  │ *:1
                                          │                  ▼
                                          └──── 1:* ──── Booking
                                                            │
                                                            └──── 1:* ──── Refund
```

---

## Business Flow

### High-Level Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Vendor    │    │    Trip     │    │   Booking   │    │  Settlement │
│  Onboarding │ -> │   Created   │ -> │   Created   │ -> │  / Billing  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
   - Register         - Set route       - Select seat      - Online: Settlement
   - Add vehicles     - Set price       - Payment          - Cash: Monthly billing
   - Add e-wallets    - Set seats       - Confirmation
   - Set refund       - Set amenities
     policy
```

---

## Vendor Management

### Vendor Registration

```typescript
// Struktur Vendor
{
  name: "Jaya Trans",
  slug: "jaya-trans",           // Unique URL slug
  description: "Travel Jakarta-Bandung",

  // Lokasi
  cityId: "city-bandung",
  address: "Jl. Asia Afrika No. 123",

  // Kontak
  phone: "022-1234567",
  email: "info@jayatrans.com",
  logo: "https://...",

  // Status
  isActive: true,
  isHeld: false,                // True jika belum bayar tagihan

  // Business Info
  legalName: "PT Jaya Trans Indonesia",
  npwp: "12.345.678.9-012.000",
  siup: "SIUP-123/2026",

  // Tax Settings
  taxEnabled: true,
  taxRate: 11.00,               // PPN 11%
  taxName: "PPN",

  // Payment Settings
  acceptCash: true,
  platformFeeRate: 10.00,       // 10% fee

  // Bank untuk settlement
  bankName: "BCA",
  bankAccountNo: "1234567890",
  bankAccountName: "PT Jaya Trans Indonesia"
}
```

### Vendor E-Wallet Setup

```typescript
// E-Wallet yang bisa diterima vendor
[
  { type: "GOPAY", accountName: "PT Jaya Trans", accountNo: "081234567890" },
  { type: "OVO", accountName: "PT Jaya Trans", accountNo: "081234567890" },
  { type: "DANA", accountName: "PT Jaya Trans", accountNo: "081234567890" }
];
```

### Refund Policy Setup (Dynamic)

```typescript
// Kebijakan refund per vendor
[
  { hoursBeforeDeparture: 24, refundPercentage: 100.0, description: "Full refund" },
  { hoursBeforeDeparture: 12, refundPercentage: 75.0, description: "Refund 75%" },
  { hoursBeforeDeparture: 6, refundPercentage: 50.0, description: "Refund 50%" },
  { hoursBeforeDeparture: 1, refundPercentage: 10.0, description: "Refund 10%" },
  { hoursBeforeDeparture: 0, refundPercentage: 0.0, description: "Tidak bisa refund" }
];

// Logic: Jika cancel 8 jam sebelum berangkat -> dapat refund 50%
```

---

## Vehicle & Seat Management

### Vehicle Structure

```typescript
{
  licensePlate: "D 1234 ABC",
  name: "Hiace Premium",
  brand: "Toyota",
  model: "Hiace",
  year: 2024,
  capacity: 9,
  color: "Putih",
  status: "ACTIVE",           // ACTIVE | MAINTENANCE | INACTIVE
  imageUrl: "https://...",

  // Seat Layout Template (JSON)
  seatLayout: [
    { seatNo: "01", row: 1, column: 1 },  // Driver side
    { seatNo: "02", row: 1, column: 2 },
    { seatNo: "03", row: 2, column: 1 },
    { seatNo: "04", row: 2, column: 2 },
    { seatNo: "05", row: 3, column: 1 },
    { seatNo: "06", row: 3, column: 2 },
    { seatNo: "07", row: 4, column: 1 },
    { seatNo: "08", row: 4, column: 2 },
    { seatNo: "09", row: 4, column: 3 }   // Back seat
  ]
}
```

### Seat Layout Visual

```
Front (Driver)
┌─────────────────────────┐
│  🚗  │  [01]  │  [02]  │
├──────┼────────┼────────┤
│      │  [03]  │  [04]  │
├──────┼────────┼────────┤
│      │  [05]  │  [06]  │
├──────┼────────┴────────┤
│ [07] │  [08]  │  [09]  │
└──────┴────────┴────────┘
Back
```

### Seat Status

| Status      | Deskripsi                    |
| ----------- | ---------------------------- |
| `AVAILABLE` | Kursi tersedia untuk dipesan |
| `BOOKED`    | Sudah dipesan                |
| `BROKEN`    | Rusak, tidak bisa dipesan    |
| `BLOCKED`   | Diblokir sementara           |

---

## Trip Management

### Trip Structure

```typescript
{
  // Rute
  origin: "Jakarta",
  destination: "Bandung",
  originDetail: "Pool Cawang, Jl. MT Haryono",
  destinationDetail: "Pool Pasteur, Jl. Dr. Djunjunan",

  // Waktu
  departureTime: "2026-04-20T08:00:00",
  arrivalTime: "2026-04-20T11:00:00",

  // Harga
  price: 150000.00,

  // Fasilitas
  amenities: ["AC", "TOLL", "USB", "SNACK", "DRINK", "BLANKET"],

  // Minimal Booking
  minBooking: 3,                                    // Minimal 3 penumpang
  bookingDeadline: "2026-04-19T20:00:00",          // H-1 jam 20:00

  status: "SCHEDULED",
  vehicleId: "vehicle-123"
}
```

### Trip Status Flow

```
SCHEDULED ──┬──> ONGOING ──> COMPLETED
            │
            ├──> CANCELLED (dibatalkan)
            │
            └──> RESCHEDULED (dijadwalkan ulang karena min booking tidak terpenuhi)
```

### Min Booking Logic

```typescript
// Cron job: Cek H-1 jam 20:00
async function checkMinBooking(tripId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });

  const confirmedSeats = await prisma.tripSeat.count({
    where: { tripId, status: "BOOKED" }
  });

  if (confirmedSeats < trip.minBooking) {
    // Opsi 1: Cancel trip
    // Opsi 2: Reschedule
    // Opsi 3: Transfer penumpang ke trip lain
  }
}
```

### Available Amenities

| Enum             | Deskripsi           |
| ---------------- | ------------------- |
| `AC`             | Air Conditioner     |
| `TOLL`           | Lewat jalan tol     |
| `USB`            | Port USB charging   |
| `BLANKET`        | Selimut             |
| `SNACK`          | Snack               |
| `DRINK`          | Minuman             |
| `WIFI`           | WiFi                |
| `TV`             | TV/Entertainment    |
| `TOILET`         | Toilet di kendaraan |
| `RECLINING_SEAT` | Kursi bisa rebahan  |
| `LEGROOM`        | Legroom luas        |
| `LUGGAGE`        | Bagasi besar        |

---

## Booking Flow

### Customer Booking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      BOOKING FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SEARCH TRIP                                                 │
│     └─> Filter: origin, destination, date, amenities           │
│                                                                 │
│  2. SELECT TRIP                                                 │
│     └─> Lihat detail: harga, fasilitas, kursi tersedia         │
│                                                                 │
│  3. SELECT SEAT                                                 │
│     └─> Pilih kursi dari layout (lihat status: available/broken)│
│                                                                 │
│  4. INPUT DATA                                                  │
│     └─> customerName, customerPhone, customerEmail             │
│                                                                 │
│  5. SELECT PAYMENT METHOD                                       │
│     ├─> CASH: Bayar langsung ke driver/pool                    │
│     ├─> EWALLET: GoPay, OVO, DANA, dll                         │
│     └─> TRANSFER: Bank transfer                                │
│                                                                 │
│  6. PAYMENT                                                     │
│     ├─> Online: Redirect ke payment gateway                    │
│     └─> Cash: Status CONFIRMED setelah dibayar                 │
│                                                                 │
│  7. CONFIRMATION                                                │
│     └─> Dapat booking code: TRV-20260415-0001                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Booking Status Flow

```
                    ┌──> EXPIRED (tidak bayar)
                    │
PENDING ──> CONFIRMED ──┬──> COMPLETED (trip selesai)
                        │
                        ├──> CANCELLED (dibatalkan)
                        │
                        ├──> TRANSFERRED (pindah trip)
                        │
                        └──> REFUNDED (di-refund)
```

### Booking Structure

```typescript
{
  bookingCode: "TRV-20260415-0001",

  // Customer Info
  customerName: "John Doe",
  customerPhone: "081234567890",
  customerEmail: "john@email.com",

  tripId: "trip-123",

  // Pricing
  seatCount: 2,
  subtotal: 300000.00,        // 2 x 150000
  taxAmount: 33000.00,        // 11% PPN
  totalAmount: 333000.00,

  // Platform Fee
  platformFeeRate: 10.00,
  platformFeeAmount: 33300.00,
  vendorAmount: 299700.00,

  // Payment
  paymentMethod: "EWALLET",
  paymentStatus: "PAID",
  paidAt: "2026-04-15T10:30:00",
  pgTransactionId: "TXN-MIDTRANS-123",
  pgProvider: "midtrans",
  ewalletType: "GOPAY",

  status: "CONFIRMED",
  expiresAt: "2026-04-15T11:00:00"
}
```

---

## Payment System

### Payment Methods

| Method     | Deskripsi             | Platform Fee        | Settlement           |
| ---------- | --------------------- | ------------------- | -------------------- |
| `CASH`     | Bayar langsung        | Ditagih akhir bulan | Via VendorBilling    |
| `EWALLET`  | GoPay, OVO, DANA, dll | Dipotong langsung   | Via VendorSettlement |
| `TRANSFER` | Bank transfer         | Dipotong langsung   | Via VendorSettlement |

### Payment Flow - Online (E-Wallet/Transfer)

```
┌─────────────────────────────────────────────────────────────────┐
│                   PEMBAYARAN ONLINE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Customer bayar Rp 333.000 via GoPay                           │
│                         │                                       │
│                         ▼                                       │
│  ┌─────────────────────────────────────┐                       │
│  │        PAYMENT GATEWAY              │                       │
│  │       (Midtrans/Faspay)             │                       │
│  └─────────────────────────────────────┘                       │
│                         │                                       │
│                         ▼                                       │
│  ┌─────────────────────────────────────┐                       │
│  │  PG Fee (2.9%)     = Rp   9.657     │                       │
│  │  Platform Fee (10%) = Rp  33.300    │                       │
│  │  ─────────────────────────────────  │                       │
│  │  Vendor Amount      = Rp 290.043    │                       │
│  └─────────────────────────────────────┘                       │
│                         │                                       │
│                         ▼                                       │
│        VendorSettlement (Daily/Weekly)                         │
│                         │                                       │
│                         ▼                                       │
│           Transfer ke rekening vendor                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Payment Flow - Cash

```
┌─────────────────────────────────────────────────────────────────┐
│                    PEMBAYARAN CASH                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Customer bayar Rp 333.000 (cash ke driver/pool)               │
│                         │                                       │
│                         ▼                                       │
│  ┌─────────────────────────────────────┐                       │
│  │  Vendor terima penuh = Rp 333.000   │                       │
│  │                                     │                       │
│  │  Platform Fee (10%) = Rp  33.300    │                       │
│  │  (Dicatat untuk tagihan bulanan)    │                       │
│  └─────────────────────────────────────┘                       │
│                         │                                       │
│                         ▼                                       │
│           Booking masuk VendorBilling                          │
│                         │                                       │
│                         ▼                                       │
│        Akhir bulan: Invoice dikirim ke vendor                  │
│                         │                                       │
│                         ▼                                       │
│        Vendor bayar platform fee ke platform                   │
│                                                                 │
│  ⚠️  Tidak bayar? → isHeld = true (akun di-hold)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Billing & Settlement

### VendorBilling (Untuk Cash)

Tagihan bulanan platform fee dari pembayaran cash.

```typescript
{
  invoiceNo: "INV-2026-04-001",
  vendorId: "vendor-123",

  periodStart: "2026-04-01",
  periodEnd: "2026-04-30",
  dueDate: "2026-05-10",          // Jatuh tempo 10 hari setelah akhir bulan

  totalBookings: 150,             // 150 booking cash bulan ini
  totalGrossAmount: 45000000.00,  // Total Rp 45 juta
  totalFeeAmount: 4500000.00,     // 10% = Rp 4.5 juta
  paidAmount: 0.00,

  status: "UNPAID"                // UNPAID → PARTIAL → PAID
}
```

### Billing Status & Hold Logic

```typescript
// Cron job: Cek jatuh tempo
async function checkOverdueBillings() {
  const overdue = await prisma.vendorBilling.findMany({
    where: { status: "UNPAID", dueDate: { lt: new Date() } }
  });

  for (const billing of overdue) {
    await prisma.$transaction([
      // Update status
      prisma.vendorBilling.update({
        where: { id: billing.id },
        data: { status: "OVERDUE" }
      }),
      // HOLD vendor account!
      prisma.vendor.update({
        where: { id: billing.vendorId },
        data: { isHeld: true }
      })
    ]);
  }
}
```

### VendorSettlement (Untuk Online)

Settlement dana dari pembayaran online ke vendor.

```typescript
{
  settlementNo: "STL-2026-04-15-001",
  vendorId: "vendor-123",

  periodStart: "2026-04-08",
  periodEnd: "2026-04-14",

  totalBookings: 50,
  totalGrossAmount: 15000000.00,  // Rp 15 juta gross
  totalFeeAmount: 1500000.00,     // Platform fee 10%
  totalPgFeeAmount: 435000.00,    // PG fee 2.9%
  netAmount: 13065000.00,         // Yang ditransfer

  status: "PENDING",              // PENDING → SETTLED | HELD
  settledAt: null,
  reference: null
}
```

### Settlement Hold Logic

```typescript
// Vendor yang di-hold tidak bisa terima settlement
async function processSettlement(settlementId: string) {
  const settlement = await prisma.vendorSettlement.findUnique({
    where: { id: settlementId },
    include: { vendor: true }
  });

  if (settlement.vendor.isHeld) {
    // Hold settlement sampai vendor bayar tagihan
    await prisma.vendorSettlement.update({
      where: { id: settlementId },
      data: { status: "HELD" }
    });
    return;
  }

  // Process transfer...
}
```

---

## Refund System

### Refund Policy (Dynamic per Vendor)

```
┌────────────────────────────────────────────────────────────────┐
│                    REFUND POLICY EXAMPLE                       │
├────────────────┬───────────────────────────────────────────────┤
│ Hours Before   │ Refund Percentage                             │
├────────────────┼───────────────────────────────────────────────┤
│ >= 24 jam      │ 100% (Full refund)                           │
│ >= 12 jam      │ 75%                                          │
│ >= 6 jam       │ 50%                                          │
│ >= 1 jam       │ 10%                                          │
│ < 1 jam        │ 0% (Tidak bisa refund)                       │
└────────────────┴───────────────────────────────────────────────┘
```

### Refund Calculation

```typescript
async function calculateRefund(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: { include: { vehicle: { include: { vendor: true } } } } }
  });

  const vendorId = booking.trip.vehicle.vendorId;
  const departureTime = booking.trip.departureTime;
  const now = new Date();

  // Hitung jam sebelum keberangkatan
  const hoursBeforeDeparture = Math.floor(
    (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  );

  // Sudah lewat waktu = tidak bisa refund
  if (hoursBeforeDeparture < 0) {
    return { canRefund: false, reason: "Sudah lewat waktu keberangkatan" };
  }

  // Cari policy yang berlaku
  const policy = await prisma.vendorRefundPolicy.findFirst({
    where: {
      vendorId,
      hoursBeforeDeparture: { lte: hoursBeforeDeparture },
      isActive: true
    },
    orderBy: { hoursBeforeDeparture: "desc" }
  });

  if (!policy || policy.refundPercentage === 0) {
    return { canRefund: false, reason: "Tidak ada kebijakan refund" };
  }

  const originalAmount = Number(booking.totalAmount);
  const refundPercentage = Number(policy.refundPercentage);
  const refundAmount = (originalAmount * refundPercentage) / 100;
  const adminFee = 5000; // Optional
  const finalAmount = Math.max(0, refundAmount - adminFee);

  return {
    canRefund: true,
    hoursBeforeDeparture,
    refundPercentage,
    originalAmount,
    refundAmount,
    adminFee,
    finalAmount
  };
}
```

### Refund Flow - Online Payment

```
┌─────────────────────────────────────────────────────────────────┐
│                REFUND - PEMBAYARAN ONLINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Customer request refund                                     │
│                         │                                       │
│  2. System hitung persentase berdasarkan kebijakan             │
│                         │                                       │
│  3. Admin approve (status = APPROVED)                          │
│                         │                                       │
│  4. Proses refund via payment gateway                          │
│     └─> refundMethod = ORIGINAL                                │
│                         │                                       │
│  5. Dana kembali ke e-wallet/rekening customer                 │
│     └─> status = COMPLETED                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Refund Flow - Cash Payment

```
┌─────────────────────────────────────────────────────────────────┐
│                  REFUND - PEMBAYARAN CASH                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Customer request refund                                     │
│                         │                                       │
│  2. System hitung persentase berdasarkan kebijakan             │
│                         │                                       │
│  3. Admin approve (status = APPROVED)                          │
│                         │                                       │
│  4. Pilih metode refund:                                       │
│                         │                                       │
│     ├─> BANK_TRANSFER                                          │
│     │   └─> Platform transfer ke rekening customer             │
│     │   └─> Dikurangi dari billing vendor berikutnya           │
│     │                                                           │
│     ├─> CASH_PICKUP                                            │
│     │   └─> Customer ambil cash di pool vendor                 │
│     │   └─> Vendor bayar, dikurangi dari billing               │
│     │                                                           │
│     └─> CREDIT                                                 │
│         └─> Jadi kredit untuk booking berikutnya               │
│                                                                 │
│  5. status = COMPLETED                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Refund Structure

```typescript
{
  refundCode: "RFD-2026-04-15-001",
  bookingId: "booking-123",

  // Amounts
  originalAmount: 333000.00,
  refundPercentage: 75.00,
  refundAmount: 249750.00,
  adminFee: 5000.00,
  finalAmount: 244750.00,

  // Timing
  hoursBeforeDeparture: 10,
  departureTime: "2026-04-20T08:00:00",
  requestedAt: "2026-04-19T22:00:00",

  // Method
  refundMethod: "BANK_TRANSFER",
  customerBankName: "BCA",
  customerBankAccount: "1234567890",
  customerBankAccountName: "John Doe",

  // Status
  status: "COMPLETED",
  reason: "Batal karena ada urusan mendadak",

  // Tracking
  approvedAt: "2026-04-19T22:30:00",
  processedAt: "2026-04-19T23:00:00",
  completedAt: "2026-04-20T10:00:00",
  processedById: "admin-123",

  // For cash refund
  deductedFromBillingId: "billing-april-2026"
}
```

---

## Enums Reference

### Role

| Value         | Deskripsi         |
| ------------- | ----------------- |
| `SUPER_ADMIN` | Admin platform    |
| `OWNER`       | Pemilik vendor    |
| `STAFF`       | Staff operasional |
| `DRIVER`      | Driver kendaraan  |

### TripStatus

| Value         | Deskripsi         |
| ------------- | ----------------- |
| `SCHEDULED`   | Dijadwalkan       |
| `ONGOING`     | Sedang berjalan   |
| `COMPLETED`   | Selesai           |
| `CANCELLED`   | Dibatalkan        |
| `RESCHEDULED` | Dijadwalkan ulang |

### VehicleStatus

| Value         | Deskripsi        |
| ------------- | ---------------- |
| `ACTIVE`      | Aktif            |
| `MAINTENANCE` | Sedang perawatan |
| `INACTIVE`    | Tidak aktif      |

### SeatStatus

| Value       | Deskripsi          |
| ----------- | ------------------ |
| `AVAILABLE` | Tersedia           |
| `BOOKED`    | Sudah dipesan      |
| `BROKEN`    | Rusak              |
| `BLOCKED`   | Diblokir sementara |

### PaymentMethod

| Value      | Deskripsi                  |
| ---------- | -------------------------- |
| `CASH`     | Tunai                      |
| `EWALLET`  | E-Wallet (GoPay, OVO, dll) |
| `TRANSFER` | Bank transfer              |

### PaymentStatus

| Value      | Deskripsi           |
| ---------- | ------------------- |
| `UNPAID`   | Belum bayar         |
| `PENDING`  | Menunggu konfirmasi |
| `PAID`     | Sudah bayar         |
| `REFUNDED` | Sudah di-refund     |

### BookingStatus

| Value         | Deskripsi                |
| ------------- | ------------------------ |
| `PENDING`     | Menunggu pembayaran      |
| `CONFIRMED`   | Sudah konfirmasi         |
| `CANCELLED`   | Dibatalkan               |
| `COMPLETED`   | Selesai                  |
| `EXPIRED`     | Kadaluarsa               |
| `TRANSFERRED` | Dipindahkan ke trip lain |
| `REFUNDED`    | Sudah di-refund          |

### EWalletType

| Value       | Deskripsi |
| ----------- | --------- |
| `GOPAY`     | GoPay     |
| `OVO`       | OVO       |
| `DANA`      | DANA      |
| `SHOPEEPAY` | ShopeePay |
| `LINKAJA`   | LinkAja   |
| `OTHER`     | Lainnya   |

### Amenity

| Value            | Deskripsi        |
| ---------------- | ---------------- |
| `AC`             | AC               |
| `TOLL`           | Lewat tol        |
| `USB`            | USB charging     |
| `BLANKET`        | Selimut          |
| `SNACK`          | Snack            |
| `DRINK`          | Minuman          |
| `WIFI`           | WiFi             |
| `TV`             | TV/Entertainment |
| `TOILET`         | Toilet           |
| `RECLINING_SEAT` | Kursi rebahan    |
| `LEGROOM`        | Legroom luas     |
| `LUGGAGE`        | Bagasi besar     |

### BillingStatus

| Value     | Deskripsi         |
| --------- | ----------------- |
| `UNPAID`  | Belum bayar       |
| `PARTIAL` | Bayar sebagian    |
| `PAID`    | Lunas             |
| `OVERDUE` | Lewat jatuh tempo |

### SettlementStatus

| Value     | Deskripsi      |
| --------- | -------------- |
| `PENDING` | Menunggu       |
| `SETTLED` | Sudah transfer |
| `HELD`    | Ditahan        |

### RefundStatus

| Value        | Deskripsi            |
| ------------ | -------------------- |
| `PENDING`    | Menunggu persetujuan |
| `APPROVED`   | Disetujui            |
| `PROCESSING` | Sedang diproses      |
| `COMPLETED`  | Selesai              |
| `REJECTED`   | Ditolak              |

### RefundMethod

| Value           | Deskripsi                       |
| --------------- | ------------------------------- |
| `ORIGINAL`      | Kembali ke metode asal          |
| `BANK_TRANSFER` | Transfer ke rekening            |
| `CASH_PICKUP`   | Ambil cash di vendor            |
| `CREDIT`        | Kredit untuk booking berikutnya |

---

## Database Schema

Untuk detail lengkap schema database, lihat file:

- [prisma/schema.prisma](../prisma/schema.prisma)

---

_Last updated: 15 April 2026_
