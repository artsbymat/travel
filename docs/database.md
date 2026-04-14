# Design database

## ENUMS

```prisma
enum Role {
  ADMIN
  VENDOR_OWNER
  STAFF
  DRIVER
}

enum BookingStatus {
  PENDING
  UNPAID
  PAID
  CONFIRMED
  ASSIGNED_DRIVER
  ON_TRIP
  COMPLETED
  CANCELLED
  EXPIRED
}

enum PaymentMethod {
  TRANSFER
  QRIS
  CASH
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  EXPIRED
}

enum SeatStatus {
  AVAILABLE
  LOCKED
  BOOKED
  BROKEN
}

enum VoucherType {
  PERCENTAGE
  FIXED
}

enum VoucherScope {
  GLOBAL
  VENDOR
  ROUTE
}

```

## USER & AUTH

```prisma
model User {
  id          String   @id @default(cuid())
  name        String
  email       String?  @unique
  phone       String?  @unique
  password    String?
  role        Role
  vendorId    String?

  vendor      Vendor?  @relation(fields: [vendorId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## VENDOR (TRAVEL)

```prisma
model Vendor {
  id          String   @id @default(cuid())
  name        String
  logoUrl     String?
  address     String?
  phone       String?
  isActive    Boolean  @default(false)

  users       User[]
  vehicles    Vehicle[]
  trips       Trip[]
  drivers     Driver[]
  staffs      Staff[]

  createdAt   DateTime @default(now())
}
```

## VEHICLE & SEAT LAYOUT

```prisma
model Vehicle {
  id          String   @id @default(cuid())
  vendorId    String
  name        String
  plateNumber String
  totalSeats  Int

  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  seats       Seat[]

  createdAt   DateTime @default(now())
}

model Seat {
  id          String     @id @default(cuid())
  vehicleId   String
  seatNumber  String     // contoh: A1, B2
  row         Int
  column      Int
  status      SeatStatus @default(AVAILABLE)

  vehicle     Vehicle    @relation(fields: [vehicleId], references: [id])
}
```

## DRIVER & STAFF

```prisma
model Driver {
  id        String   @id @default(cuid())
  vendorId  String
  name      String
  phone     String

  vendor    Vendor   @relation(fields: [vendorId], references: [id])
  trips     Trip[]

  createdAt DateTime @default(now())
}

model Staff {
  id        String   @id @default(cuid())
  vendorId  String
  name      String
  phone     String

  vendor    Vendor   @relation(fields: [vendorId], references: [id])
}
```

## City

```prisma
model City {
  id        String   @id @default(cuid())
  name      String
  code      String?  @unique   // contoh: PKU, JKT
  province  String?
  isActive  Boolean  @default(true)

  // relasi
  originTrips      Trip[] @relation("OriginCity")
  destinationTrips Trip[] @relation("DestinationCity")

  createdAt DateTime @default(now())
}
```

## TRIP

```prisma
model Trip {
  id            String   @id @default(cuid())
  vendorId      String
  vehicleId     String
  driverId      String?

  originCityId      String
  destinationCityId String

  departureTime DateTime
  arrivalTime   DateTime?

  price         Int
  totalSeats    Int

  vendor        Vendor   @relation(fields: [vendorId], references: [id])
  vehicle       Vehicle  @relation(fields: [vehicleId], references: [id])
  driver        Driver?  @relation(fields: [driverId], references: [id])

  originCity      City @relation("OriginCity", fields: [originCityId], references: [id])
  destinationCity City @relation("DestinationCity", fields: [destinationCityId], references: [id])

  bookings      Booking[]

  createdAt     DateTime @default(now())

  @@index([originCityId, destinationCityId])
}
```

## BOOKING (CORE)

```prisma
model Booking {
  id            String         @id @default(cuid())
  bookingCode   String         @unique

  tripId        String
  contactName   String
  contactPhone  String

  totalPrice    Int
  discount      Int            @default(0)
  finalPrice    Int

  voucherId     String?

  status        BookingStatus  @default(PENDING)
  expiredAt     DateTime

  trip          Trip           @relation(fields: [tripId], references: [id])
  passengers    Passenger[]
  seats         BookingSeat[]
  payment       Payment?

  voucher       Voucher?       @relation(fields: [voucherId], references: [id])

  createdAt     DateTime @default(now())

  @@index([voucherId])
}
```

## PASSENGER

```prisma
model Passenger {
  id          String   @id @default(cuid())
  bookingId   String

  name        String
  phone       String?

  booking     Booking  @relation(fields: [bookingId], references: [id])
}
```

## BOOKING SEAT (IMPORTANT)

```prisma
model BookingSeat {
  id          String   @id @default(cuid())
  bookingId   String
  seatId      String

  booking     Booking  @relation(fields: [bookingId], references: [id])
  seat        Seat     @relation(fields: [seatId], references: [id])

  @@unique([bookingId, seatId])
}
```

## PAYMENT

```prisma
model Payment {
  id            String        @id @default(cuid())
  bookingId     String        @unique

  method        PaymentMethod
  status        PaymentStatus @default(PENDING)

  amount        Int
  paidAt        DateTime?

  booking       Booking       @relation(fields: [bookingId], references: [id])
}
```

## TRANSACTION (KOMISI PLATFORM)

```prisma
model Transaction {
  id            String   @id @default(cuid())
  bookingId     String

  totalAmount   Int
  commission    Int
  netAmount     Int

  createdAt     DateTime @default(now())
}
```

## OPTIONAL (RECOMMENDED)

### Seat Lock (untuk race condition)

```prisma
model SeatLock {
  id          String   @id @default(cuid())
  seatId      String
  tripId      String

  lockedAt    DateTime @default(now())
  expiredAt   DateTime

  @@index([seatId, tripId])
}
```

## Voucher & Promo

```prisma
model Voucher {
  id            String   @id @default(cuid())
  code          String   @unique

  name          String
  description   String?

  type          VoucherType
  value         Int      // persen atau nominal

  maxDiscount   Int?     // batas max diskon (untuk persen)

  minPurchase   Int?     // minimal transaksi

  quota         Int?     // total kuota
  usedCount     Int      @default(0)

  startDate     DateTime
  endDate       DateTime

  isActive      Boolean  @default(true)

  scope         VoucherScope @default(GLOBAL)

  // relasi opsional
  vendorId      String?
  originCityId  String?
  destinationCityId String?

  vendor        Vendor? @relation(fields: [vendorId], references: [id])
  originCity    City?   @relation("VoucherOriginCity", fields: [originCityId], references: [id])
  destinationCity City? @relation("VoucherDestinationCity", fields: [destinationCityId], references: [id])

  bookings      Booking[]

  createdAt     DateTime @default(now())

  @@index([code])
}
```
