# API Documentation

Dokumentasi ini mencakup endpoint untuk manajemen **Vendor**, **Owner**, **Province**, dan **City**.

## Base URL

`http://localhost:3000/api` (Development)

---

## 1. Vendor Endpoints

Endpoint untuk mengelola data vendor (PO Bus/Travel). **Semua endpoint membutuhkan login sebagai Super Admin.**

> **Auth:** Super Admin Only | **Fitur:** Otomatis buat VendorWallet saat vendor dibuat.

### 1.1 List All Vendors

Mengambil semua daftar vendor beserta data saldo wallet.

- **URL:** `/api/admin/vendors`
- **Method:** `GET`
- **Response Success (200 OK):**

```json
[
  {
    "id": "cm123...",
    "name": "Sinar Jaya",
    "slug": "sinar-jaya",
    "email": "info@sinarjaya.co.id",
    "isActive": true,
    "wallet": {
      "balance": 500000,
      "debt": 10000,
      "pendingIn": 0,
      "totalEarned": 1500000
    },
    "_count": { "users": 5, "vehicles": 12, "billings": 3 }
  }
]
```

### 1.2 Create Vendor

Menambahkan vendor baru ke sistem. **Otomatis membuat VendorWallet** dengan saldo 0.

- **URL:** `/api/admin/vendors`
- **Method:** `POST`
- **Payload (JSON):**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `name` | string | **Yes** | Nama Vendor |
  | `slug` | string | **Yes** | Unique, lowercase, hyphens only |
  | `email` | string | No | Email resmi vendor (format valid) |
  | `phone` | string | No | Nomor telepon (8-20 karakter) |
  | `address` | string | No | Alamat kantor |
  | `cityId` | string | No | ID Kota (harus valid) |
  | `description` | string | No | Deskripsi singkat |
  | `legalName` | string | No | Nama resmi badan usaha |
  | `npwp` | string | No | Nomor NPWP (15 atau 16 digit) |
  | `siup` | string | No | Nomor SIUP |
  | `taxEnabled` | boolean | No | Aktifkan pajak (Default: `false`) |
  | `taxRate` | number | No | Persentase pajak (0-100) |
  | `taxName` | string | No | Nama pajak (Default: `"PPN"`) |
  | `acceptCash` | boolean | No | Terima pembayaran cash (Default: `true`) |
  | `platformFeeRate` | number | No | Persentase fee platform (0-100) |

  > *Data bank tidak di sini. Vendor memasukkan data bank saat request withdraw.*

- **Validasi:** Slug format, email format, NPWP 15-16 digit, rate 0-100, uniqueness check.

- **Example Payload:**

```json
{
  "name": "Pahala Kencana",
  "slug": "pahala-kencana",
  "email": "contact@pahala.com",
  "phone": "021-1234567",
  "cityId": "cm987...",
  "legalName": "PT Pahala Kencana Transport",
  "npwp": "012345678901000",
  "taxEnabled": true,
  "taxRate": 11,
  "acceptCash": true,
  "platformFeeRate": 5
}
```

### 1.3 Get Vendor Detail

Mengambil informasi lengkap vendor: profil, wallet, users, e-wallets, dan statistik.

- **URL:** `/api/admin/vendors/[id]`
- **Method:** `GET`

### 1.4 Update Vendor

Memperbarui data vendor. Validasi yang sama berlaku.

- **URL:** `/api/admin/vendors/[id]`
- **Method:** `PATCH`
- **Payload:** Sama dengan Create Vendor (Partial/Opsional).

### 1.5 Delete Vendor

Menghapus vendor. **Akan gagal jika** vendor masih punya saldo, hutang, dana pending, atau user terkait.

- **URL:** `/api/admin/vendors/[id]`
- **Method:** `DELETE`


---

## 2. Owner Endpoints

Endpoint untuk manajemen akun Owner yang terasosiasi dengan Vendor.

### 2.1 List All Owners

Mengambil semua user dengan role `OWNER`.

- **URL:** `/api/admin/owners`
- **Method:** `GET`
- **Response Success (200 OK):**

```json
[
  {
    "id": "user-id-1",
    "name": "Budi Santoso",
    "email": "budi@sinarjaya.com",
    "phone": "0811223344",
    "role": "OWNER",
    "vendorId": "vendor-id-1",
    "vendor": {
      "id": "vendor-id-1",
      "name": "Sinar Jaya"
    }
  }
]
```

### 2.2 Create Owner

Menambahkan akun Owner baru.

- **URL:** `/api/admin/owners`
- **Method:** `POST`
- **Payload (JSON):**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `name` | string | Yes | Nama lengkap owner |
  | `email` | string | Yes | Email login |
  | `password` | string | Yes | Password (min 6 char) |
  | `vendorId` | string | Yes | ID Vendor yang dikelola |
  | `phone` | string | No | Nomor telepon |

- **Example Payload:**

```json
{
  "name": "Andi Wijaya",
  "email": "andi@pahalencana.com",
  "password": "securepassword123",
  "vendorId": "cm123-vendor-id",
  "phone": "0855667788"
}
```

### 2.3 Update Owner

- **URL:** `/api/admin/owners/[id]`
- **Method:** `PATCH`
- **Payload:** `name`, `email`, `phone`, `password`, `vendorId` (Optional).

### 2.4 Delete Owner

- **URL:** `/api/admin/owners/[id]`
- **Method:** `DELETE`

---

## 3. Province Endpoints

Endpoint untuk mengambil data wilayah tingkat Provinsi.

### 3.1 List All Provinces

- **URL:** `/api/provinces`
- **Method:** `GET`
- **Response Success:**

```json
[
  {
    "id": "prov-1",
    "name": "JAWA BARAT",
    "code": "32"
  },
  {
    "id": "prov-2",
    "name": "JAWA TENGAH",
    "code": "33"
  }
]
```

---

## 4. City Endpoints

Endpoint untuk mengambil data wilayah tingkat Kota/Kabupaten.

### 4.1 List Cities

Mengambil daftar kota. Bisa difilter berdasarkan ID Provinsi.

- **URL:** `/api/cities?provinceId=[id]`
- **Method:** `GET`
- **Query Params:**
  - `provinceId` (Optional): Filter kota berdasarkan provinsi tertentu.
- **Response Success:**

```json
[
  {
    "id": "city-1",
    "name": "BANDUNG",
    "provinceId": "prov-1"
  },
  {
    "id": "city-2",
    "name": "BEKASI",
    "provinceId": "prov-1"
  }
]
```

---

## 5. Driver Endpoints

Endpoint untuk manajemen akun Driver yang terasosiasi dengan Vendor.

### 5.1 List All Drivers

Mengambil semua user dengan role `DRIVER`. Bisa difilter berdasarkan `vendorId`.

- **URL:** `/api/admin/drivers`
- **Method:** `GET`
- **Query Params:**
  - `vendorId` (Optional): Filter driver berdasarkan vendor tertentu.
- **Response Success (200 OK):**

```json
[
  {
    "id": "user-id-driver",
    "name": "Slamet Rahardjo",
    "email": "slamet@travel.com",
    "phone": "0812334455",
    "role": "DRIVER",
    "vendorId": "vendor-id-1",
    "vendor": {
      "id": "vendor-id-1",
      "name": "Sinar Jaya"
    },
    "_count": {
      "driverTrips": 15
    }
  }
]
```

### 5.2 Create Driver

Menambahkan akun Driver baru.

- **URL:** `/api/admin/drivers`
- **Method:** `POST`
- **Payload (JSON):**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `name` | string | Yes | Nama lengkap driver |
  | `vendorId` | string | Yes | ID Vendor tempat driver bekerja |
  | `email` | string | No | Email login |
  | `phone` | string | No | Nomor telepon |
  | `password` | string | No | Password login |

- **Example Payload:**

```json
{
  "name": "Bambang Pamungkas",
  "vendorId": "cm123-vendor-id",
  "phone": "0812998877",
  "email": "bambang@travel.id"
}
```

### 5.3 Update Driver

- **URL:** `/api/admin/drivers/[id]`
- **Method:** `PATCH`
- **Payload:** `name`, `email`, `phone`, `password`, `vendorId` (Optional).

### 5.4 Delete Driver

- **URL:** `/api/admin/drivers/[id]`
- **Method:** `DELETE`
---

## 6. Staff Endpoints

Endpoint untuk manajemen akun Staff oleh Owner.

### 6.1 List Staff (Owner Only)

Mengambil daftar staff yang tergabung dalam vendor Owner yang sedang login.

- **URL:** `/api/admin/staff`
- **Method:** `GET`
- **Response Success (200 OK):**
```json
[
  {
    "id": "staff-id-1",
    "name": "Siti Aminah",
    "email": "siti@sinarjaya.com",
    "phone": "0899887766",
    "role": "STAFF",
    "vendorId": "vendor-id-1",
    "createdAt": "2024-04-28T..."
  }
]
```

### 6.2 Create Staff (Owner Only)

Menambahkan akun Staff baru. `vendorId` otomatis diambil dari session Owner.

- **URL:** `/api/admin/staff`
- **Method:** `POST`
- **Payload (JSON):**
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `name` | string | Yes | Nama lengkap staff |
  | `email` | string | No* | Email login (Wajib jika phone kosong) |
  | `phone` | string | No* | Nomor telepon (Wajib jika email kosong) |
  | `password` | string | No | Password login |

### 6.3 Update Staff (Owner Only)

Memperbarui data staff. Hanya bisa dilakukan oleh Owner dari vendor yang sama.

- **URL:** `/api/admin/staff/[id]`
- **Method:** `PATCH`
- **Payload:** `name`, `email`, `phone`, `password` (Optional).

### 6.4 Delete Staff (Owner Only)

Menghapus akun staff.

- **URL:** `/api/admin/staff/[id]`
- **Method:** `DELETE`
