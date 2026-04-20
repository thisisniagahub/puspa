import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/seed — Seed the database with PUSPA data
// Can be called once after deployment to populate initial data
export async function POST() {
  try {
    // Check if data already exists
    const existingMembers = await db.member.count();
    if (existingMembers > 0) {
      return NextResponse.json({
        message: "Database already has data. Skipping seed.",
        existingMembers,
      });
    }

    // Clear existing data (in case of partial seed)
    await db.activity.deleteMany();
    await db.programmeMember.deleteMany();
    await db.donation.deleteMany();
    await db.programme.deleteMany();
    await db.member.deleteMany();

    // ── 1. Seed Members ───────────────────────────────────────────
    const memberData = [
      // Leadership
      { name: "Datuk Dr Narimah Awin", icNumber: "680101010001", phone: "0123456789", email: "narimah@puspa.org.my", address: "Taman Melawati, KL", category: "staff", status: "active", familyMembers: 1, monthlyIncome: 0, notes: "Pengerusi PUSPA" },
      { name: "Datin Noor Khayatee Mohd Adnan", icNumber: "720102020002", phone: "0123456790", email: "khayatee@puspa.org.my", address: "Gombak, Selangor", category: "staff", status: "active", familyMembers: 1, monthlyIncome: 0, notes: "Naib Pengerusi PUSPA" },
      { name: "YM Raja Nuraini Raja Hassan", icNumber: "750103030003", phone: "0123456791", email: "nuraini@puspa.org.my", address: "Taman Permata, Gombak", category: "staff", status: "active", familyMembers: 1, monthlyIncome: 0, notes: "Bendahari PUSPA" },
      { name: "Pn Shahidah @ Fauziah Hashim", icNumber: "800104040004", phone: "0123456792", email: "shahidah@puspa.org.my", address: "Kg Fajar, Hulu Klang", category: "staff", status: "active", familyMembers: 1, monthlyIncome: 0, notes: "Setiausaha PUSPA" },
      { name: "Zaki", icNumber: "850105050005", phone: "0123183369", email: "zaki@puspa.org.my", address: "2253, Jalan Permata 22, Taman Permata, 53300 Gombak, Selangor", category: "staff", status: "active", familyMembers: 1, monthlyIncome: 0, notes: "Pegawai Operasi / Contact Person" },

      // Volunteers
      { name: "Ahmad Faris bin Mohd", icNumber: "950106060006", phone: "0172345678", email: "faris@gmail.com", address: "Taman Melawati, KL", category: "volunteer", status: "active", familyMembers: 4, monthlyIncome: 3500, notes: "Aktif sejak 2022" },
      { name: "Nurul Aisyah binti Abdullah", icNumber: "970107070007", phone: "0173456789", email: "aisyah@gmail.com", address: "Taman Permata, Gombak", category: "volunteer", status: "active", familyMembers: 3, monthlyIncome: 4200, notes: "Tutor sukarela" },
      { name: "Muhammad Haziq bin Ismail", icNumber: "990108080008", phone: "0174567890", email: "haziq@gmail.com", address: "Kg Fajar, Hulu Klang", category: "volunteer", status: "active", familyMembers: 5, monthlyIncome: 2800, notes: "Pemandu penghantaran" },
      { name: "Siti Aminah binti Osman", icNumber: "880109090009", phone: "0175678901", email: "aminah@gmail.com", address: "Klang Gate, KL", category: "volunteer", status: "active", familyMembers: 2, monthlyIncome: 5000, notes: "Penganjur acara" },
      { name: "Rizal bin Hamzah", icNumber: "920110100010", phone: "0176789012", email: "rizal@gmail.com", address: "Gombak, Selangor", category: "volunteer", status: "active", familyMembers: 3, monthlyIncome: 3800, notes: "Sukarela program kesihatan" },

      // Asnaf Families
      { name: "Hajah Salmah binti Mat", icNumber: "600111111011", phone: "0191234567", email: "", address: "Blok 5, Taman Permata, Gombak", category: "asnaf", status: "active", familyMembers: 6, monthlyIncome: 800, notes: "Keluarga asnaf - pendapatan rendah" },
      { name: "Md Noor bin Yusof", icNumber: "650112121012", phone: "0192345678", email: "", address: "Kg Fajar, Hulu Klang", category: "asnaf", status: "active", familyMembers: 8, monthlyIncome: 600, notes: "Justeru - 8 tanggungan" },
      { name: "Fatimah binti Ali", icNumber: "700113131013", phone: "0193456789", email: "", address: "Taman Melawati, KL", category: "asnaf", status: "active", familyMembers: 4, monthlyIncome: 950, notes: "Ibu tunggal - 3 anak" },
      { name: "Osman bin Mamat", icNumber: "550114141014", phone: "0194567890", email: "", address: "Klang Gate, KL", category: "asnaf", status: "active", familyMembers: 5, monthlyIncome: 500, notes: "Warga emas - tiada pendapatan tetap" },
      { name: "Rohani binti Sharif", icNumber: "750115151015", phone: "0195678901", email: "", address: "Taman Permata, Gombak", category: "asnaf", status: "active", familyMembers: 7, monthlyIncome: 700, notes: "Keluarga besar asnaf" },
      { name: "Ahmad bin Kasim", icNumber: "600116161016", phone: "0196789012", email: "", address: "Hulu Klang, KL", category: "asnaf", status: "active", familyMembers: 4, monthlyIncome: 900, notes: "Pekerja kontrak - pendapatan tidak stabil" },
      { name: "Zainab binti Hussin", icNumber: "800117171017", phone: "0197890123", email: "", address: "Taman Melawati, KL", category: "asnaf", status: "active", familyMembers: 3, monthlyIncome: 450, notes: "Ibu tunggal - anak sekolah" },
      { name: "Ismail bin Omar", icNumber: "580118181018", phone: "0198901234", email: "", address: "Kg Fajar, Hulu Klang", category: "asnaf", status: "active", familyMembers: 6, monthlyIncome: 550, notes: "Pesara - kesihatan terhad" },
      { name: "Halimah binti Md Yasin", icNumber: "680119191019", phone: "0199012345", email: "", address: "Taman Permata, Gombak", category: "asnaf", status: "active", familyMembers: 5, monthlyIncome: 650, notes: "Janda - menjaga ibu tua" },
      { name: "Kamal bin Zainal", icNumber: "720120202020", phone: "0190123456", email: "", address: "Klang Gate, KL", category: "asnaf", status: "active", familyMembers: 9, monthlyIncome: 750, notes: "Keluarga ramai - 7 anak" },
      { name: "Mastura binti Dollah", icNumber: "850121212121", phone: "0191123345", email: "", address: "Hulu Klang, KL", category: "asnaf", status: "active", familyMembers: 2, monthlyIncome: 500, notes: "OKU - pendapatan terhad" },
      { name: "Nasir bin Abas", icNumber: "630122222222", phone: "0192234567", email: "", address: "Taman Melawati, KL", category: "asnaf", status: "active", familyMembers: 4, monthlyIncome: 600, notes: "Tidak upaya bekerja" },
      { name: "Aminah binti Muda", icNumber: "770123232323", phone: "0193345678", email: "", address: "Taman Permata, Gombak", category: "asnaf", status: "active", familyMembers: 3, monthlyIncome: 800, notes: "Peniaga kecil terjejas COVID" },
      { name: "Razali bin Sulaiman", icNumber: "690124242424", phone: "0194456789", email: "", address: "Kg Fajar, Hulu Klang", category: "asnaf", status: "inactive", familyMembers: 5, monthlyIncome: 400, notes: "Berhijrah ke negeri lain" },
      { name: "Che Nor binti Che Mat", icNumber: "740125252525", phone: "0195567890", email: "", address: "Hulu Klang, KL", category: "asnaf", status: "active", familyMembers: 6, monthlyIncome: 700, notes: "Surirumah - tiada pendapatan tetap" },

      // Donors
      { name: "Perumahan Kinrara Berhad", icNumber: "ORG001", phone: "0380260000", email: "csr@pkb.com.my", address: "Bandar Kinrara, Selangor", category: "donor", status: "active", familyMembers: 0, monthlyIncome: 0, notes: "Penyumbang utama - zakat & program pendidikan" },
      { name: "Jaya Grocer", icNumber: "ORG002", phone: "0377288888", email: "csr@jayagrocer.com", address: "Kuala Lumpur", category: "donor", status: "active", familyMembers: 0, monthlyIncome: 0, notes: "Sumbangan bantuan makanan" },
      { name: "Kloth Cares Foundation", icNumber: "ORG003", phone: "0321880000", email: "info@klothcares.com", address: "Selangor", category: "donor", status: "active", familyMembers: 0, monthlyIncome: 0, notes: "Sumbangan langsir kitar semula" },
      { name: "Hj Razak bin Daud", icNumber: "600126262626", phone: "0137891234", email: "razak@gmail.com", address: "Ampang, Selangor", category: "donor", status: "active", familyMembers: 0, monthlyIncome: 0, notes: "Penderma individu tetap" },
      { name: "Pn Siti Hawa binti Ahmad", icNumber: "650127272727", phone: "0138901234", email: "siti.hawa@gmail.com", address: "KL", category: "donor", status: "active", familyMembers: 0, monthlyIncome: 0, notes: "Sumbangan bulanan RM200" },
    ];

    const members = await db.member.createMany({ data: memberData });
    const allMembers = await db.member.findMany();
    const memberMap = new Map(allMembers.map((m) => [m.name, m.id]));

    // ── 2. Seed Programmes ────────────────────────────────────────
    const programmeData = [
      { name: "Pengagihan Bantuan Makanan Bulanan", description: "Program pengagihan bungkusan makanan bulanan kepada keluarga asnaf di kawasan Hulu Klang, Taman Permata, Taman Melawati, Kg Fajar dan Klang Gate.", category: "food-aid", status: "active", startDate: new Date("2021-09-01"), location: "Hulu Klang, Taman Permata, Taman Melawati, Kg Fajar, Klang Gate", beneficiaryCount: 1200, volunteerCount: 45, budget: 180000, actualCost: 165000, partners: JSON.stringify(["Jaya Grocer", "Free Food Society", "Perumahan Kinrara Berhad"]), notes: "Program flagship PUSPA - 15 lokasi pengagihan" },
      { name: "Misi Tuisyen Sincerely Setia", description: "Program tuisyen percuma untuk kanak-kanak asnaf meliputi Bahasa Melayu, Bahasa Inggeris, Matematik dan kemahiran hidup.", category: "education", status: "completed", startDate: new Date("2023-02-20"), endDate: new Date("2023-03-02"), location: "Dewan Serbaguna MPAJ, Gombak", beneficiaryCount: 85, volunteerCount: 50, budget: 45000, actualCost: 42000, partners: JSON.stringify(["S P Setia Foundation", "Perumahan Kinrara Berhad"]), notes: "Kadar lulus 95%" },
      { name: "Program Literasi Kewangan", description: "Program kesedaran kewangan untuk asnaf berkaitan pengurusan kewangan, simpanan dan perancangan masa depan.", category: "financial", status: "completed", startDate: new Date("2023-04-14"), endDate: new Date("2023-04-14"), location: "Taman Melawati", beneficiaryCount: 80, volunteerCount: 20, budget: 30000, actualCost: 28000, partners: JSON.stringify(["S P Setia Foundation", "Lembaga Zakat Selangor", "ASNB", "AKPK", "Perumahan Kinrara Berhad"]), notes: "RM300 zakat per pax, RM80 bakul" },
      { name: "Ramadan Mubarak dengan Asnaf", description: "Program sempena Ramadan bersama kanak-kanak dan keluarga asnaf termasuk pengagihan langsir dan jamuan.", category: "community", status: "completed", startDate: new Date("2023-04-15"), endDate: new Date("2023-04-15"), location: "Masjid Al Hidayah, Taman Melawati", beneficiaryCount: 162, volunteerCount: 20, budget: 35000, actualCost: 33000, partners: JSON.stringify(["S P Setia Foundation", "Perumahan Kinrara Berhad", "Kloth Cares"]), notes: "122 set langsir diagihkan, 40 kanak-kanak" },
      { name: "Pengagihan Zakat Tahunan", description: "Program penyerahan zakat tahunan kepada asnaf yang layak di kawasan operasi PUSPA.", category: "financial", status: "active", startDate: new Date("2022-04-30"), location: "Masjid Lama Al Hidayah, Taman Melawati", beneficiaryCount: 200, volunteerCount: 30, budget: 100000, actualCost: 95000, partners: JSON.stringify(["Lembaga Zakat Selangor"]), notes: "Program tahunan sempena Ramadhan" },
      { name: "Program Latihan Kemahiran", description: "Program latihan kemahiran untuk golongan asnaf termasuk kemahiran digital, kraftangan dan keusahawanan.", category: "skills", status: "active", startDate: new Date("2023-06-01"), location: "Pusat Komuniti Hulu Klang", beneficiaryCount: 300, volunteerCount: 25, budget: 75000, actualCost: 60000, partners: JSON.stringify(["S P Setia Foundation"]), notes: "12 kursus disediakan, kadar kejayaan pekerjaan 70%" },
      { name: "Program Sokongan Kesihatan", description: "Program pemeriksaan kesihatan percuma dan konsultasi doktor untuk keluarga asnaf secara sukarela.", category: "healthcare", status: "active", startDate: new Date("2022-01-01"), location: "Pelbagai lokasi di Hulu Klang & Gombak", beneficiaryCount: 2000, volunteerCount: 25, budget: 120000, actualCost: 100000, partners: JSON.stringify(["Klinik Kesihatan Kerajaan", "Doktor Sukarela"]), notes: "25+ doktor sukarela, pemeriksaan sukarela" },
      { name: "Program Bantuan Sekolah", description: "Pemberian bantuan buku, alat tulis dan pakaian sekolah kepada anak-anak asnaf sempena sesi persekolahan baru.", category: "education", status: "active", startDate: new Date("2023-01-01"), location: "Taman Melawati & Taman Permata", beneficiaryCount: 350, volunteerCount: 15, budget: 50000, actualCost: 45000, partners: JSON.stringify(["Perumahan Kinrara Berhad"]), notes: "Semua peringkat sekolah" },
    ];

    const programmes = await db.programme.createMany({ data: programmeData });
    const allProgrammes = await db.programme.findMany();
    const progMap = new Map(allProgrammes.map((p) => [p.name, p.id]));

    // ── 3. Seed Donations ─────────────────────────────────────────
    const donationData = [
      { donorName: "Perumahan Kinrara Berhad", donorEmail: "csr@pkb.com.my", amount: 50000, method: "bank-transfer", status: "confirmed", date: new Date("2023-02-15"), programmeId: progMap.get("Misi Tuisyen Sincerely Setia"), notes: "Zakat untuk program pendidikan" },
      { donorName: "Perumahan Kinrara Berhad", donorEmail: "csr@pkb.com.my", amount: 35000, method: "bank-transfer", status: "confirmed", date: new Date("2023-04-10"), programmeId: progMap.get("Ramadan Mubarak dengan Asnaf"), notes: "Zakat Ramadan" },
      { donorName: "Jaya Grocer", donorEmail: "csr@jayagrocer.com", amount: 15000, method: "bank-transfer", status: "confirmed", date: new Date("2021-09-01"), programmeId: progMap.get("Pengagihan Bantuan Makanan Bulanan"), notes: "100 bungkusan makanan" },
      { donorName: "S P Setia Foundation", donorEmail: "foundation@spsetia.com", amount: 30000, method: "bank-transfer", status: "confirmed", date: new Date("2023-04-14"), programmeId: progMap.get("Program Literasi Kewangan"), notes: "Sokongan program literasi" },
      { donorName: "Kloth Cares Foundation", donorEmail: "info@klothcares.com", amount: 8000, method: "bank-transfer", status: "confirmed", date: new Date("2023-04-15"), programmeId: progMap.get("Ramadan Mubarak dengan Asnaf"), notes: "122 set langsir kitar semula" },
      { donorName: "Hj Razak bin Daud", donorEmail: "razak@gmail.com", amount: 5000, method: "bank-transfer", status: "confirmed", date: new Date("2023-03-01"), notes: "Sumbangan individu" },
      { donorName: "Pn Siti Hawa binti Ahmad", donorEmail: "siti.hawa@gmail.com", amount: 2400, method: "online", status: "confirmed", date: new Date("2023-01-01"), notes: "Sumbangan bulanan RM200 x 12 bulan" },
      { donorName: "Perumahan Kinrara Berhad", donorEmail: "csr@pkb.com.my", amount: 25000, method: "bank-transfer", status: "confirmed", date: new Date("2023-06-01"), programmeId: progMap.get("Program Latihan Kemahiran"), notes: "Sokongan program kemahiran" },
      { donorName: "Lembaga Zakat Selangor", donorEmail: "zakat@zakatselangor.com.my", amount: 60000, method: "bank-transfer", status: "confirmed", date: new Date("2023-04-20"), programmeId: progMap.get("Pengagihan Zakat Tahunan"), notes: "Zakat tahunan" },
      { donorName: "Perumahan Kinrara Berhad", donorEmail: "csr@pkb.com.my", amount: 30000, method: "bank-transfer", status: "confirmed", date: new Date("2023-01-15"), programmeId: progMap.get("Program Sokongan Kesihatan"), notes: "Sokongan program kesihatan" },
      { donorName: "Jaya Grocer", donorEmail: "csr@jayagrocer.com", amount: 10000, method: "bank-transfer", status: "confirmed", date: new Date("2023-05-01"), programmeId: progMap.get("Pengagihan Bantuan Makanan Bulanan"), notes: "Sumbangan makanan tambahan" },
      { donorName: "Perumahan Kinrara Berhad", donorEmail: "csr@pkb.com.my", amount: 15000, method: "bank-transfer", status: "confirmed", date: new Date("2023-01-10"), programmeId: progMap.get("Program Bantuan Sekolah"), notes: "Bantuan keperluan sekolah" },
      { donorName: "Hj Razak bin Daud", donorEmail: "razak@gmail.com", amount: 5000, method: "bank-transfer", status: "confirmed", date: new Date("2023-09-01"), notes: "Sumbangan individu - Q3" },
      { donorName: "Pn Siti Hawa binti Ahmad", donorEmail: "siti.hawa@gmail.com", amount: 1200, method: "online", status: "pending", date: new Date("2024-01-01"), notes: "Sumbangan bulanan 2024" },
      { donorName: "Donor Anonimus", donorEmail: "", amount: 3000, method: "cash", status: "confirmed", date: new Date("2023-12-01"), notes: "Sumbangan tanpa nama" },
    ];

    const donations = await db.donation.createMany({ data: donationData });

    // ── 4. Seed Programme Members ─────────────────────────────────
    const foodAidProgId = progMap.get("Pengagihan Bantuan Makanan Bulanan")!;
    const tuitionProgId = progMap.get("Misi Tuisyen Sincerely Setia")!;
    const ramadanProgId = progMap.get("Ramadan Mubarak dengan Asnaf")!;

    const asnafMembers = allMembers.filter((m) => m.category === "asnaf");
    const volunteerMembers = allMembers.filter((m) => m.category === "volunteer");

    const programmeMembersData = [
      ...asnafMembers.map((m) => ({
        programmeId: foodAidProgId,
        memberId: m.id,
        role: "beneficiary" as const,
        status: m.status,
      })),
      ...volunteerMembers.slice(0, 3).map((m) => ({
        programmeId: foodAidProgId,
        memberId: m.id,
        role: "volunteer" as const,
        status: "active",
      })),
      ...asnafMembers.slice(0, 5).map((m) => ({
        programmeId: tuitionProgId,
        memberId: m.id,
        role: "beneficiary" as const,
        status: "active",
      })),
      ...volunteerMembers.slice(0, 2).map((m) => ({
        programmeId: tuitionProgId,
        memberId: m.id,
        role: "volunteer" as const,
        status: "active",
      })),
      ...asnafMembers.slice(5, 10).map((m) => ({
        programmeId: ramadanProgId,
        memberId: m.id,
        role: "beneficiary" as const,
        status: "active",
      })),
      ...volunteerMembers.slice(2, 5).map((m) => ({
        programmeId: ramadanProgId,
        memberId: m.id,
        role: "volunteer" as const,
        status: "active",
      })),
    ];

    await db.programmeMember.createMany({ data: programmeMembersData });

    // ── 5. Seed Activities ────────────────────────────────────────
    const activityData = [
      { title: "100 bungkusan makanan Jaya Grocer diagihkan", description: "Free Food Society menyerahkan 100 bungkusan makanan Jaya Grocer kepada PUSPA untuk keluarga asnaf di Hulu Klang.", type: "programme", date: new Date("2021-09-09"), programmeId: foodAidProgId },
      { title: "Penyerahan Zakat Tahunan di Masjid Al Hidayah", description: "Program penyerahan zakat tahunan anjuran PUSPA di Masjid Lama Al Hidayah, Taman Melawati.", type: "programme", date: new Date("2022-04-30"), programmeId: progMap.get("Pengagihan Zakat Tahunan") },
      { title: "Misi Tuisyen bermula", description: "Program tuisyen 10 hari untuk kanak-kanak asnaf bermula di Dewan Serbaguna MPAJ, Gombak.", type: "programme", date: new Date("2023-02-20"), programmeId: tuitionProgId },
      { title: "Program Literasi Kewangan", description: "80 individu asnaf menyertai program literasi kewangan dengan LZS, ASNB dan AKPK.", type: "programme", date: new Date("2023-04-14"), programmeId: progMap.get("Program Literasi Kewangan") },
      { title: "Ramadan Mubarak bersama 162 asnaf", description: "Program Ramadan dengan kanak-kanak dan keluarga asnaf di Masjid Al Hidayah. 122 set langsir diagihkan.", type: "programme", date: new Date("2023-04-15"), programmeId: ramadanProgId },
      { title: "Pemberitaan The Star", description: "The Star melaporkan program bantuan Ramadan PUSPA - lebih 160 orang menerima bantuan.", type: "general", date: new Date("2023-04-27") },
      { title: "Mesyuarat Agung Pertama PUSPA", description: "PUSPA mengadakan AGM pertama pada 17 Disember 2023.", type: "general", date: new Date("2023-12-17") },
      { title: "Sumbangan RM50,000 dari PKB", description: "Perumahan Kinrara Berhad menyumbang RM50,000 untuk program pendidikan.", type: "donation", date: new Date("2023-02-15") },
      { title: "Ahli baru didaftarkan", description: "5 keluarga asnaf baru didaftarkan dari kawasan Taman Permata.", type: "member", date: new Date("2023-06-15") },
      { title: "Sistem PUSPA dilancarkan", description: "Sistem pengurusan ahli PUSPA secara digital dilancarkan untuk memperbaik pengurusan organisasi.", type: "system", date: new Date("2024-01-01") },
      { title: "Program Kemahiran Kitar Semula", description: "Kursus kraftangan kitar semula dengan Kloth Cares untuk 30 peserta asnaf.", type: "programme", date: new Date("2023-08-01"), programmeId: progMap.get("Program Latihan Kemahiran") },
      { title: "Pemeriksaan Kesihatan Percuma", description: "25 doktor sukarela memberikan pemeriksaan kesihatan kepada 200 asnaf.", type: "programme", date: new Date("2023-09-15"), programmeId: progMap.get("Program Sokongan Kesihatan") },
    ];

    await db.activity.createMany({ data: activityData });

    const totalDonationAmount = donationData
      .filter((d) => d.status === "confirmed")
      .reduce((s, d) => s + d.amount, 0);

    return NextResponse.json({
      success: true,
      message: "🌱 PUSPA database seeded successfully!",
      summary: {
        members: members.count,
        programmes: programmes.count,
        donations: donations.count,
        totalDonationAmount: `RM ${totalDonationAmount.toLocaleString()}`,
        programmeMembers: programmeMembersData.length,
        activities: activityData.length,
      },
    });
  } catch (error) {
    console.error("[Seed Error]", error);
    return NextResponse.json(
      {
        error: "Failed to seed database",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
