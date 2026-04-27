# API Documentation

Dokumentasi ini mencakup endpoint untuk manajemen **Vendor**, **Owner**, **Province**, dan **City**.

## Base URL
`http://localhost:3000/api` (Development)

---

## 1. Vendor Endpoints
Endpoint untuk mengelola data vendor (PO Bus/Travel).

### 1.1 List All Vendors
Mengambil semua daftar vendor yang terdaftar.

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
    "phone": "08123456789",
    "cityId": "city-id-123",
    "isActive": true,
    "city": { "id": "city-id-123", "name": "Jakarta" },
    "_count": {
      "users": 5,
      "vehicles": 12
    }
  }
]
```

### 1.2 Create Vendor
Menambahkan vendor baru ke sistem.

- **URL:** `/api/admin/vendors`
- **Method:** `POST`
- **Payload (JSON):**
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Nama Vendor |
| `slug` | string | Yes | Unique identifier (URL friendly) |
| `email` | string | No | Email resmi vendor |
| `phone` | string | No | Nomor telepon vendor |
| `address` | string | No | Alamat kantor |
| `cityId` | string | No | ID Kota (relasi ke City) |
| `description` | string | No | Deskripsi singkat |
| `legalName` | string | No | Nama resmi badan usaha |
| `npwp` | string | No | Nomor NPWP |
| `siup` | string | No | Nomor SIUP |
| `taxEnabled` | boolean | No | Status pengaktifan pajak (Default: false) |
| `taxRate` | number | No | Persentase pajak |
| `platformFeeRate` | number | No | Persentase biaya platform |
| `bankName` | string | No | Nama Bank untuk pencairan |
| `bankAccountNo` | string | No | Nomor Rekening |
| `bankAccountName` | string | No | Nama Pemilik Rekening |

- **Example Payload:**
```json
{
  "name": "Pahala Kencana",
  "slug": "pahala-kencana",
  "email": "contact@pahala.com",
  "phone": "021-1234567",
  "cityId": "cm987...",
  "legalName": "PT Pahala Kencana Transport",
  "npwp": "01.234.567.8-901.000",
  "taxEnabled": true,
  "taxRate": 11,
  "bankName": "BCA",
  "bankAccountNo": "1234567890",
  "bankAccountName": "PT Pahala Kencana"
}
```

### 1.3 Get Vendor Detail
Mengambil informasi detail satu vendor berdasarkan ID.

- **URL:** `/api/admin/vendors/[id]`
- **Method:** `GET`

### 1.4 Update Vendor
Memperbarui data vendor yang sudah ada.

- **URL:** `/api/admin/vendors/[id]`
- **Method:** `PATCH`
- **Payload:** Sama dengan Create Vendor (Partial/Opsional).

### 1.5 Delete Vendor
Menghapus vendor dari sistem.

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
