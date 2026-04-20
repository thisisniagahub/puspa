# API — Rujukan API Lengkap

## PUSPA + OpenClaw Integrated Platform

> **Versi**: 1.0.0
> **Base URL**: `/api`
> **Format**: JSON
> **Authentication**: ❌ Tidak dilaksanakan (semua route terbuka)

---

## 1. Overview

| Kategori | Routes | Kaedah |
|---|---|---|
| Dashboard | `/api/stats` | GET |
| Ahli | `/api/members`, `/api/members/[id]` | GET, POST, PUT, DELETE |
| Program | `/api/programmes`, `/api/programmes/[id]` | GET, POST, PUT, DELETE |
| Donasi | `/api/donations`, `/api/donations/[id]` | GET, POST, PUT, DELETE |
| Aktiviti | `/api/activities` | GET |
| AI | `/api/chat`, `/api/report` | POST |
| Member Tools | `/api/members/tools/*` | GET, POST |
| Seed | `/api/seed` | POST |

---

## 2. Dashboard Statistics

### `GET /api/stats`

Mengembalikan statistik overview untuk dashboard.

**Response** `200 OK`:
```json
{
  "data": {
    "totalMembers": 45,
    "membersByCategory": {
      "asnaf": 20,
      "volunteer": 15,
      "donor": 8,
      "staff": 2
    },
    "totalProgrammes": 8,
    "programmesByStatus": {
      "active": 5,
      "completed": 2,
      "upcoming": 1
    },
    "totalDonations": 45678.90,
    "totalBeneficiaries": 320,
    "recentActivities": [
      {
        "id": "clxxx",
        "title": "Program Bantuan Makanan",
        "type": "programme",
        "date": "2025-07-10T10:00:00.000Z"
      }
    ],
    "donationTrend": [
      { "month": "Ogo 2024", "amount": 5200.00 },
      { "month": "Sep 2024", "amount": 3800.00 }
    ]
  }
}
```

---

## 3. Members (Ahli)

### `GET /api/members`

Senarai ahli dengan search, filter, pagination, dan sort.

**Query Parameters**:

| Parameter | Type | Default | Penerangan |
|---|---|---|---|
| `search` | string | — | Carian mengikut nama |
| `category` | string | — | Filter: `asnaf`, `volunteer`, `donor`, `staff` |
| `status` | string | — | Filter: `active`, `inactive`, `suspended` |
| `page` | number | `1` | Halaman (1-indexed) |
| `limit` | number | `10` | Item per halaman (max 100) |
| `sortBy` | string | `joinDate` | Susun: `joinDate`, `name`, `createdAt`, `monthlyIncome`, `familyMembers`, `category` |
| `sortOrder` | string | `desc` | Susun: `asc`, `desc` |

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "clxxx1",
      "name": "Ahmad bin Abdullah",
      "icNumber": "900101-01-1234",
      "phone": "012-3456789",
      "email": "ahmad@email.com",
      "category": "asnaf",
      "status": "active",
      "joinDate": "2024-01-15T00:00:00.000Z",
      "familyMembers": 5,
      "monthlyIncome": 1500,
      "_count": {
        "donations": 2,
        "programmeMembers": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### `POST /api/members`

Tambah ahli baru.

**Request Body**:
```json
{
  "name": "Ahmad bin Abdullah",
  "icNumber": "900101-01-1234",
  "phone": "012-3456789",
  "email": "ahmad@email.com",
  "address": "123 Jalan Utama, 50000 KL",
  "category": "asnaf",
  "status": "active",
  "joinDate": "2024-01-15",
  "familyMembers": 5,
  "monthlyIncome": 1500,
  "notes": "Perlu bantuan segera"
}
```

**Required fields**: `name`, `icNumber`, `phone`

**Responses**:
| Status | Penerangan |
|---|---|
| `201` | Ahli berjaya ditambah |
| `400` | Fields required missing |
| `409` | IC number sudah wujud |

---

### `GET /api/members/[id]`

Maklumat terperinci ahli.

**Response** `200 OK`:
```json
{
  "data": {
    "id": "clxxx1",
    "name": "Ahmad bin Abdullah",
    "icNumber": "900101-01-1234",
    "phone": "012-3456789",
    "email": "ahmad@email.com",
    "address": "123 Jalan Utama, 50000 KL",
    "category": "asnaf",
    "status": "active",
    "joinDate": "2024-01-15T00:00:00.000Z",
    "familyMembers": 5,
    "monthlyIncome": 1500,
    "notes": "Perlu bantuan segera",
    "donations": [...],
    "programmeMembers": [
      {
        "programme": { "id": "clp1", "name": "Program Makanan" }
      }
    ]
  }
}
```

| Status | Penerangan |
|---|---|
| `200` | Berjaya |
| `404` | Ahli tidak dijumpai |

---

### `PUT /api/members/[id]`

Kemaskini maklumat ahli (partial update).

**Request Body**: Sama dengan POST, semua fields optional.

**Responses**:
| Status | Penerangan |
|---|---|
| `200` | Berjaya dikemaskini |
| `404` | Ahli tidak dijumpai |
| `409` | IC number duplikat |

---

### `DELETE /api/members/[id]`

Padam ahli (cascade delete pada related records).

**Responses**:
| Status | Penerangan |
|---|---|
| `200` | `{ "message": "Member deleted successfully" }` |
| `404` | Ahli tidak dijumpai |

---

## 4. Programmes

### `GET /api/programmes`

**Query Parameters**:

| Parameter | Type | Default | Penerangan |
|---|---|---|---|
| `search` | string | — | Carian mengikut nama |
| `category` | string | — | `food-aid`, `education`, `skills`, `healthcare`, `financial`, `community` |
| `status` | string | — | `active`, `completed`, `upcoming`, `cancelled` |
| `page` | number | `1` | Halaman |
| `limit` | number | `10` | Item per halaman |

**Response** `200 OK`:
```json
{
  "programmes": [
    {
      "id": "clp1",
      "name": "Program Bantuan Makanan",
      "description": "Agihan makanan bulanan",
      "category": "food-aid",
      "status": "active",
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "location": "Kuala Lumpur",
      "beneficiaryCount": 120,
      "volunteerCount": 15,
      "budget": 50000,
      "actualCost": 35000,
      "partners": ["NGO A", "Kedai Runcit B"],
      "notes": null,
      "createdAt": "2024-01-01",
      "updatedAt": "2025-07-10",
      "_count": {
        "donations": 5,
        "programmeMembers": 30,
        "activities": 8
      }
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### `POST /api/programmes`

**Request Body**:
```json
{
  "name": "Program Bantuan Makanan",
  "description": "Agihan makanan bulanan",
  "category": "food-aid",
  "status": "active",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "location": "Kuala Lumpur",
  "beneficiaryCount": 120,
  "volunteerCount": 15,
  "budget": 50000,
  "actualCost": 35000,
  "partners": ["NGO A", "Kedai Runcit B"],
  "notes": null
}
```

**Required fields**: `name`

> Note: `partners` dikirim sebagai array JSON dan disimpan sebagai string.

### `GET/PUT/DELETE /api/programmes/[id]`

Sama pattern dengan Members. `partners` diparsed dari JSON string semasa GET dan di-stringify semasa POST/PUT.

---

## 5. Donations (Sumbangan)

### `GET /api/donations`

**Query Parameters**:

| Parameter | Type | Default | Penerangan |
|---|---|---|---|
| `search` | string | — | Carian mengikut `donorName` |
| `status` | string | — | `confirmed`, `pending`, `rejected` |
| `method` | string | — | `bank-transfer`, `cash`, `online`, `cheque` |
| `page` | number | `1` | Halaman |
| `limit` | number | `10` | Item per halaman |

**Response** `200 OK`:
```json
{
  "donations": [
    {
      "id": "cld1",
      "donorName": "Haji Ismail",
      "amount": 500.00,
      "method": "bank-transfer",
      "status": "confirmed",
      "receiptNumber": "RCP-001",
      "date": "2025-07-01",
      "programmeId": "clp1",
      "programme": { "id": "clp1", "name": "Program Makanan" }
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "summary": {
    "totalDonations": 45678.90,
    "thisMonthDonations": 3500.00,
    "totalDonors": 25
  }
}
```

### `POST /api/donations`

**Request Body**:
```json
{
  "donorName": "Haji Ismail",
  "amount": 500.00,
  "donorEmail": "ismail@email.com",
  "donorPhone": "013-9876543",
  "method": "bank-transfer",
  "status": "confirmed",
  "receiptNumber": "RCP-001",
  "date": "2025-07-01",
  "programmeId": "clp1",
  "memberId": null,
  "notes": "Zakat fitrah"
}
```

**Required fields**: `donorName`, `amount` (> 0)

**Validation**: `programmeId` dan `memberId` mesti wujud jika diberikan.

### `GET/PUT/DELETE /api/donations/[id]`

Sama pattern dengan Members.

---

## 6. Activities (Aktiviti)

### `GET /api/activities`

Read-only. Tiada POST/PUT/DELETE.

**Query Parameters**:

| Parameter | Type | Default | Penerangan |
|---|---|---|---|
| `search` | string | — | Carian mengikut `title` |
| `type` | string | — | `general`, `donation`, `programme`, `member`, `system` |
| `page` | number | `1` | Halaman |
| `limit` | number | `10` | Item per halaman |

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": "cla1",
      "title": "Agihan Makanan Bulan Julai",
      "description": "Agihan makanan untuk 120 keluarga",
      "type": "programme",
      "date": "2025-07-10T10:00:00.000Z",
      "metadata": null,
      "createdAt": "2025-07-10T08:00:00.000Z",
      "programme": { "id": "clp1", "name": "Program Makanan" },
      "programmeId": "clp1"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 12, "totalPages": 2 }
}
```

---

## 7. AI Routes

### `POST /api/chat`

Chatbot AI bercakap Bahasa Melayu.

**Request Body**:
```json
{
  "message": "Berapa jumlah ahli asnaf?"
}
```

**Response** `200 OK`:
```json
{
  "reply": "Berdasarkan data terkini, PUSPA mempunyai **128 ahli asnaf** yang aktif daripada jumlah keseluruhan 200 ahli."
}
```

> Response adalah dalam format Markdown. AI powered by DeepSeek Chat via z-ai-web-dev-sdk.

---

### `POST /api/report`

Penjanaan laporan AI.

**Request Body**:
```json
{
  "type": "summary",
  "customPrompt": null
}
```

**Report Types**:

| Type | Penerangan | Data Sources |
|---|---|---|
| `summary` | Ringkasan organisasi keseluruhan | Members, Programmes, Donations, Activities, ProgrammeMembers |
| `financial` | Laporan kewangan terperinci | All Donations, Programmes with nested Donations |
| `programme` | Status program dan pencapaian | Programmes with Members + Activities |
| `member` | Demografi dan analisis ahli | All Members with Programme participation |
| `custom` | Custom query dengan prompt | All data (Members, Programmes, Donations, Activities) |

**Response** `200 OK`:
```json
{
  "report": "# Laporan Ringkasan PUSPA\n\n## Statistik Utama\n\n- **Jumlah Ahli**: 200\n- **Ahli Asnaf**: 128\n...",
  "title": "Laporan Ringkasan PUSPA"
}
```

> Response adalah Markdown dalam Bahasa Melayu.

---

## 8. Member Tools API

### `POST /api/members/tools/aid-calculator`

Kalkulator Bantuan Mengikut Tahap (BMT) — pure calculation, tiada AI.

**Request Body**:
```json
{
  "monthlyIncome": 1500,
  "familySize": 5,
  "category": "asnaf",
  "specialNeeds": "oku"
}
```

**Response** `200 OK`:
```json
{
  "recommendedMonthlyAid": 5310,
  "breakdown": {
    "garisKemiskinan": 2960,
    "pendapatanBulanan": 1500,
    "jurangPendapatan": 1460,
    "pendarabanKeluarga": 2.5,
    "kategoriAhli": "asnaf",
    "pelarasanKategori": 1.0,
    "keperluanKhas": "oku",
    "tambahanKeperluanKhas": 500,
    "labelKeperluanKhas": "Orang Kurang Upaya (OKU) — +RM500"
  },
  "category": {
    "category": "asnaf",
    "label": "Asnaf",
    "color": "#8B5CF6"
  }
}
```

**Formula**: `(Garis Kemiskinan RM2,960 - Pendapatan) × Multiplier Keluarga × Pelarasan Kategori + Keperluan Khas`

**Special Needs Bonus**:
| Kategori | Bonus |
|---|---|
| `oku` | +RM500 |
| `warga_emas` | +RM300 |
| `ibu_tunggal` | +RM400 |
| `pelajar` | +RM200 |

---

### `GET /api/members/tools/communication?memberId=clxxx1`

Senarai log komunikasi ahli (last 50).

**Response** `200 OK`:
```json
[
  {
    "id": "clc1",
    "memberId": "clxxx1",
    "type": "phone",
    "summary": "Panggilan untuk maklumkan program",
    "followUpNeeded": true,
    "followUpDate": "2025-07-15",
    "priority": "normal",
    "conductedBy": "Admin 1",
    "createdAt": "2025-07-10"
  }
]
```

### `POST /api/members/tools/communication`

**Request Body**:
```json
{
  "memberId": "clxxx1",
  "type": "phone",
  "summary": "Panggilan untuk maklumkan program",
  "followUpNeeded": true,
  "followUpDate": "2025-07-15",
  "priority": "normal",
  "conductedBy": "Admin 1"
}
```

**Valid `type`**: `phone`, `visit`, `meeting`, `email`, `aid-distribution`
**Valid `priority`**: `low`, `normal`, `high`, `urgent`

---

### `POST /api/members/tools/eligibility`

AI-powered penentuan kelayakan program.

**Request Body**:
```json
{
  "memberId": "clxxx1"
}
```

**Response** `200 OK`:
```json
{
  "eligible": [
    {
      "programmeId": "clp1",
      "programmeName": "Program Bantuan Makanan",
      "matchScore": 92,
      "reason": "Pendapatan rendah (RM1,500), keluarga besar (5 orang), asnaf aktif"
    },
    {
      "programmeId": "clp2",
      "programmeName": "Program Pendidikan",
      "matchScore": 65,
      "reason": "Ada anak pelajar dalam keluarga"
    }
  ],
  "summary": "Ahli ini layak untuk 2 daripada 5 program aktif."
}
```

> Hanya program dengan match score > 40% dikembalikan. AI menggunakan DeepSeek Chat (temperature 0.3).

---

### `GET /api/members/tools/welfare?memberId=clxxx1`

Senarai penilaian kebajikan (latest + history).

**Response** `200 OK`:
```json
{
  "latest": {
    "id": "clw1",
    "memberId": "clxxx1",
    "foodSecurity": 2,
    "education": 3,
    "healthcare": 4,
    "financial": 1,
    "housing": 3,
    "overallScore": 2.6,
    "notes": "Memerlukan bantuan makanan segera",
    "assessedBy": "Pegawai 1",
    "assessedAt": "2025-07-10"
  },
  "history": [...]
}
```

### `POST /api/members/tools/welfare`

**Request Body**:
```json
{
  "memberId": "clxxx1",
  "foodSecurity": 2,
  "education": 3,
  "healthcare": 4,
  "financial": 1,
  "housing": 3,
  "notes": "Memerlukan bantuan makanan segera",
  "assessedBy": "Pegawai 1"
}
```

**Validation**: Semua 5 skor mesti integer antara 1-5.
**Computed**: `overallScore` = average of 5 dimensions.

---

## 9. Seed

### `POST /api/seed`

Isih database dengan data sample. Hanya berjalan jika tiada data (member.count === 0).

**Request Body**: None

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "summary": {
    "members": 29,
    "programmes": 8,
    "donations": 15,
    "totalDonationAmount": 45678.90,
    "programmeMembers": 25,
    "activities": 12
  }
}
```

---

## 10. Error Handling

### Standard Error Response

```json
{
  "error": "Description of the error"
}
```

### HTTP Status Codes

| Code | Penerangan |
|---|---|
| `200` | Berjaya |
| `201` | Berjaya dicipta |
| `400` | Bad request (fields missing/invalid) |
| `404` | Resource tidak dijumpai |
| `409` | Conflict (duplicate IC, etc.) |
| `500` | Server error (database, AI failure) |

---

* Dokumen ini dikemaskini secara berkala. Sila rujuk CHANGELOG.md untuk sejarah perubahan.
