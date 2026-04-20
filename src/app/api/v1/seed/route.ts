import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    // Check if data already exists
    const userCount = await db.user.count();
    if (userCount > 0) {
      return apiSuccess({ message: "Database sudah ada data. Gunakan db:reset untuk reset." });
    }

    // Create users
    const admin = await db.user.create({
      data: {
        email: "admin@puspa.org",
        name: "Pentadbir PUSPA",
        password: "$2b$10$placeholder_hashed_password",
        role: "admin",
      },
    });

    const opsUser = await db.user.create({
      data: {
        email: "ops@puspa.org",
        name: "Pegawai Operasi",
        password: "$2b$10$placeholder_hashed_password",
        role: "ops",
      },
    });

    const financeUser = await db.user.create({
      data: {
        email: "finance@puspa.org",
        name: "Pegawai Kewangan",
        password: "$2b$10$placeholder_hashed_password",
        role: "finance",
      },
    });

    const volunteer = await db.user.create({
      data: {
        email: "volunteer@puspa.org",
        name: "Sukarelawan Ahmad",
        password: "$2b$10$placeholder_hashed_password",
        role: "volunteer",
      },
    });

    // Create programmes
    const programmes = await Promise.all([
      db.programme.create({ data: { code: "PG-001", name: "Program Bantuan Makanan", category: "food_aid", status: "active", totalBudget: 60000, description: "Agihan makanan bulanan kepada asnaf" } }),
      db.programme.create({ data: { code: "PG-002", name: "Program Pendidikan Anak Asnaf", category: "education", status: "active", totalBudget: 40000, description: "Bantuan yuran persekolahan dan keperluan pembelajaran" } }),
      db.programme.create({ data: { code: "PG-003", name: "Program Latihan Kemahiran", category: "skills_training", status: "active", totalBudget: 30000, description: "Latihan kemahiran untuk meningkatkan kebolehpasaran" } }),
      db.programme.create({ data: { code: "PG-004", name: "Program Bantuan Kesihatan", category: "healthcare", status: "active", totalBudget: 25000, description: "Bantuan perubatan dan pemeriksaan kesihatan" } }),
      db.programme.create({ data: { code: "PG-005", name: "Tabung Kecemasan", category: "emergency_relief", status: "active", totalBudget: 50000, description: "Bantuan kecemasan mangsa bencana dan musibah" } }),
    ]);

    // Create sample cases with full lifecycle
    const cases = await Promise.all([
      db.case.create({
        data: {
          caseNumber: "CS-2025-0001", title: "Bantuan Makanan Keluarga Ahmad", description: "Keluarga 5 orang memerlukan bantuan makanan bulanan",
          status: "approved", priority: "high", category: "zakat",
          applicantName: "Ahmad bin Abdullah", applicantIc: "850101-01-1234", applicantPhone: "012-3456789",
          applicantAddress: "No 12, Jalan Mawar 3, Taman Seri Indah, 43000 Kajang",
          householdSize: 5, monthlyIncome: 1200, verificationScore: 78.5,
          programmeId: programmes[0].id, assignedTo: opsUser.id, verifiedBy: opsUser.id, approvedBy: admin.id,
          verifiedAt: new Date("2025-06-20"), approvedAt: new Date("2025-06-25"),
        },
      }),
      db.case.create({
        data: {
          caseNumber: "CS-2025-0002", title: "Bantuan Pendidikan Anak Siti", description: "3 orang anak memerlukan bantuan yuran sekolah",
          status: "disbursed", priority: "normal", category: "zakat",
          applicantName: "Siti binti Hassan", applicantIc: "900201-14-5678", applicantPhone: "013-7890123",
          applicantAddress: "No 5, Lorong Melati, Kampung Baru, 68000 Ampang",
          householdSize: 5, monthlyIncome: 1800, verificationScore: 72.0,
          programmeId: programmes[1].id, assignedTo: volunteer.id, verifiedBy: opsUser.id, approvedBy: admin.id,
          verifiedAt: new Date("2025-06-15"), approvedAt: new Date("2025-06-18"),
        },
      }),
      db.case.create({
        data: {
          caseNumber: "CS-2025-0003", title: "Bantuan Kesihatan Warga Emas", description: "Warga emas memerlukan bantuan pembedahan",
          status: "verifying", priority: "urgent", category: "sedekah",
          applicantName: "Osman bin Bakar", applicantIc: "500315-01-9012", applicantPhone: "017-2345678",
          applicantAddress: "No 8, Jalan Kenanga, Seksyen 7, 40000 Shah Alam",
          householdSize: 2, monthlyIncome: 800, programmeId: programmes[3].id,
          assignedTo: opsUser.id,
        },
      }),
      db.case.create({
        data: {
          caseNumber: "CS-2025-0004", title: "Permohonan Bantuan Kecemasan Banjir", description: "Mangsa banjir memerlukan bantuan segera",
          status: "submitted", priority: "urgent", category: "sedekah",
          applicantName: "Rahim bin Ismail", applicantIc: "950810-01-3456", applicantPhone: "019-8765432",
          applicantAddress: "Kampung Sungai Derhaka, 45000 Kuala Selangor",
          householdSize: 7, monthlyIncome: 1500, programmeId: programmes[4].id,
        },
      }),
      db.case.create({
        data: {
          caseNumber: "CS-2025-0005", title: "Latihan Kemahiran Peniagaan", description: "Ingin menyertai program latihan kemahiran peniagaan kecil",
          status: "draft", priority: "low", category: "wakaf",
          applicantName: "Aminah binti Ali", applicantIc: "980512-14-7890", applicantPhone: "014-5678901",
          applicantAddress: "No 22, Jalan Bunga Raya, 43200 Cheras",
          householdSize: 3, monthlyIncome: 2200, programmeId: programmes[2].id,
        },
      }),
    ]);

    // Create case notes
    await Promise.all([
      db.caseNote.create({ data: { caseId: cases[0].id, authorId: opsUser.id, type: "phone_call", content: "Panggilan pertama untuk mengesahkan maklumat pemohon. Beliau mengesahkan perlunya bantuan." } }),
      db.caseNote.create({ data: { caseId: cases[0].id, authorId: opsUser.id, type: "visit", content: "Lawatan ke rumah. Keadaan rumah memerlukan bantuan. 5 orang ahli keluarga termasuk 3 orang anak sekolah." } }),
      db.caseNote.create({ data: { caseId: cases[0].id, authorId: opsUser.id, type: "assessment", content: "Penilaian kebajikan: Makanan=2, Pendidikan=3, Kesihatan=4, Kewangan=1, Perumahan=3. Skor keseluruhan: 2.6/5. Layak." } }),
      db.caseNote.create({ data: { caseId: cases[2].id, authorId: opsUser.id, type: "note", content: "Memerlukan pengesahan rekod perubatan dari hospital. Jadual pembedahan pada 15 Ogos." } }),
      db.caseNote.create({ data: { caseId: cases[3].id, authorId: volunteer.id, type: "phone_call", content: "Mangsa banjir memerlukan bantuan makanan dan pakaian segera. Keluarga dipindahkan ke pusat pemindahan." } }),
    ]);

    // Create donations
    await Promise.all([
      db.donation.create({ data: { donorName: "Haji Ismail bin Ahmad", amount: 5000, method: "bank_transfer", status: "confirmed", date: new Date("2025-07-01"), programmeId: programmes[0].id, paymentChannel: "maybank2u", receiptNumber: "RCP-2025-0001" } }),
      db.donation.create({ data: { donorName: "Puan Siti binti Rahman", amount: 2000, method: "online", status: "confirmed", date: new Date("2025-07-03"), programmeId: programmes[1].id, paymentChannel: "cimb_clicks", isTaxDeductible: true, receiptNumber: "RCP-2025-0002" } }),
      db.donation.create({ data: { donorName: "Syarikat Tech Sdn Bhd", amount: 10000, method: "bank_transfer", status: "confirmed", date: new Date("2025-07-05"), programmeId: programmes[4].id, donorEmail: "csr@tech.com.my", isTaxDeductible: true, receiptNumber: "RCP-2025-0003" } }),
      db.donation.create({ data: { donorName: "Encik Muhammad", amount: 500, method: "cash", status: "confirmed", date: new Date("2025-07-08"), notes: "Sedekah untuk tabung kecemasan" } }),
      db.donation.create({ data: { donorName: "Anonymous", amount: 1500, method: "online", status: "pending", date: new Date("2025-07-10"), isAnonymous: true, programmeId: programmes[0].id } }),
    ]);

    // Create disbursements
    await Promise.all([
      db.disbursement.create({
        data: {
          disbursementNumber: "DIS-2025-0001", caseId: cases[1].id, programmeId: programmes[1].id,
          approvedBy: admin.id, processedBy: financeUser.id,
          amount: 1500, method: "bank_transfer", status: "completed",
          bankName: "Maybank", accountNumber: "123456789012", accountHolder: "Siti binti Hassan",
          recipientName: "Siti binti Hassan", recipientIc: "900201-14-5678", recipientPhone: "013-7890123",
          purpose: "Bantuan yuran sekolah 3 orang anak",
          processedDate: new Date("2025-06-20"),
        },
      }),
      db.disbursement.create({
        data: {
          disbursementNumber: "DIS-2025-0002", caseId: cases[0].id, programmeId: programmes[0].id,
          approvedBy: admin.id,
          amount: 500, method: "cash", status: "pending",
          recipientName: "Ahmad bin Abdullah", recipientIc: "850101-01-1234", recipientPhone: "012-3456789",
          purpose: "Bantuan makanan bulan Julai",
          scheduledDate: new Date("2025-07-15"),
        },
      }),
    ]);

    return apiSuccess({
      message: "Database berjaya diisi dengan data sample",
      summary: {
        users: 4,
        programmes: programmes.length,
        cases: cases.length,
        donations: 5,
        disbursements: 2,
        caseNotes: 5,
      },
    });
  } catch (error) {
    console.error("[SEED] error:", error);
    return apiError("Gagal mengisi database", 500);
  }
}
