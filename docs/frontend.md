# Frontend

## Struktur Routing (Next.js App Router)

```
/(app)
  /(public)
    /page.tsx                      -> Homepage
    /trips/page.tsx                -> List Trip
    /trips/[tripId]/page.tsx       -> Detail Trip
    /checkout/page.tsx             -> Checkout
    /status/page.tsx               -> Status tiket (by booking code)

  /(auth)
    /login/page.tsx

  /(dashboard)
    /admin
      /vendors
      /vendors/[id]
      /transactions
      /users
      /reports

    /vendor
      /overview
      /profile
      /vehicles
      /trips
      /drivers
      /staff
      /bookings
      /finance

    /staff
      /bookings
      /profile

    /driver
      /trips
      /profile
```

## HALAMAN PUBLIC (User / Penumpang)

### Homepage

Tujuan: Cari perjalanan

Komponen:

- `Navbar`
- `SearchForm`
  - Select Kota Asal
  - Select Kota Tujuan
  - Date Picker
  - Input Jumlah Penumpang
  - Button "Cari Trip"

- `WhyUs`
- `Footer`

### List Trip (`/trips`)

Tujuan: Menampilkan hasil pencarian

Komponen:

- `FilterSidebar`
  - Range Harga
  - Jam Berangkat (pagi, siang, malam) menggunakan range time
  - Ukuran kendaraan menggunakan range jumlah kursi (1–4, 5–10, 11+)

- `TripCard`
  - Nama Travel
  - Logo Travel
  - Rute (Asal → Tujuan)
  - Jam Berangkat (format 24 jam)
  - Estimasi Perjalanan (jam)
  - Harga
  - Sisa Seat, beserta total seat (misal: 5/10). Tandai warna merah berupa warning jika minimal keberangkatan belum terpenuhi (misal: minimal 3 penumpang)
  - Fasilitas (AC, WiFi, dll)

- `SortDropdown`
  - Harga (termurah → termahal)

### Detail Trip (`/trips/[tripId]`)

Tujuan: Pilih kursi + isi data penumpang

Komponen:

- `TripInfo` (seperti di `TripCard` tapi lebih detail)
- `WarningBox`
  - "Jika minimal penumpang belum terpenuhi keberangkatan akan dijadwalkan ulang atau dibatalkan."
- `SeatLayout`
  - Dynamic grid (row/column dari DB)
  - Status:
    - available
    - booked
    - locked (sementara)

- `PassengerFormList`
  - sesuai jumlah penumpang

- `ContactForm`
- `PriceSummary`
- `PolicyAgreement`
  - "Dengan melanjutkan, Anda setuju dengan syarat dan ketentuan kami."
- Button: "Lanjut ke Checkout"

Catatan penting: Gunakan **seat locking (TTL 5–10 menit)**

### Checkout (`/checkout`)

Tujuan: Pembayaran

Komponen:

- `BookingSummary`
- `PassengerSummary`
- `PaymentMethod`
  - Transfer
  - E-Wallet
  - Cash (opsional)

- `CountdownTimer` (expired payment)
- Button "Bayar"

### Status Tiket (`/ticket`)

Tujuan: Tracking booking tanpa login

- `SearchBooking`
  - kode booking + no HP

- `BookingDetail`
  - status:
    - unpaid
    - paid
    - confirmed
    - on-going
    - completed
    - cancelled

- `TicketView`
- `DownloadTicket`

## Auth

### Login (`/auth/login`)

Tujuan: Login untuk semua role (admin, vendor, staff, driver)
Komponen:

- `LoginForm`
  - email
  - password

### ForgotPassword (`/auth/forgot-password`)

Tujuan: Reset password

Komponen:

- `ForgotPasswordForm`
  - email

## Halaman Bantuan ('/help') optional

tujuan: FAQ + contact support

komponen:

- `FAQList`
- `ContactSupportForm`

## DASHBOARD

### Admin

Halaman:

- `/vendors`
- `/transactions`
- `/reports`
- `/users`

Komponen:

- `VendorTable`
- `VendorApproval`
- `CommissionSettings`
- `TransactionTable`
- `RevenueChart`

Fungsi:

- approve vendor
- set komisi %
- monitoring transaksi global

### Vendor Travel

Halaman:

- `/overview`
- `/profile`
- `/vehicles`
- `/trips`
- `/drivers`
- `/staff`
- `/bookings`
- `/finance`

#### Profile

- `TravelInfoForm`
- `BankAccountForm`
- `LogoUpload`

#### Vehicles

- `VehicleTable`
- `VehicleForm`

Field penting:

- nama mobil
- jumlah kursi
- layout (json)

#### Trips

- `TripTable`
- `TripForm`

Field:

- origin
- destination
- departure time
- price
- vehicle_id
- driver_id

#### Drivers

- `DriverTable`
- `DriverForm`

#### Staff

- `StaffTable`
- `StaffForm`

#### Bookings

##### Komponen:

- `BookingTable`
- `BookingDetailDrawer`
- `StatusUpdater`

Status flow:

```
pending -> paid -> confirmed -> assigned_driver -> on_trip -> completed
```

#### Finance

Komponen:

- `RevenueSummary`
- `TransactionList`
- `WithdrawalRequest`

### Staff Dashboard

Halaman:

- `/bookings`
- `/profile`

Fungsi:

- verifikasi pembayaran manual (jika cash/transfer)
- assign driver

### Driver Dashboard

Halaman:

- `/trips`
- `/profile`

Komponen:

- `AssignedTripList`
- `TripDetail`
- `PassengerList`
- `UpdateStatusButton`

Status:

```
assigned -> on_pickup -> on_trip -> completed
```

# FITUR KRUSIAL TAMBAHAN

Wajib ada:

- Seat locking
- Booking expiration
- Notification (WA / Email)
- Refund handling
- Driver assignment system
