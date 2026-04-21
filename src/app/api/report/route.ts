import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

// ─── Types ──────────────────────────────────────────────────────────────

type ReportType = "summary" | "financial" | "programme" | "member" | "custom";

interface ReportRequest {
  type: ReportType;
  customPrompt?: string;
}

const REPORT_TITLES: Record<ReportType, string> = {
  summary: "Laporan Ringkasan Organisasi PUSPA",
  financial: "Laporan Kewangan PUSPA",
  programme: "Laporan Impak Program PUSPA",
  member: "Laporan Demografi Ahli PUSPA",
  custom: "Laporan Khas PUSPA",
};

const SYSTEM_PROMPT = `Anda adalah penulis laporan profesional untuk PUSPA (Pertubuhan Urus Peduli Asnaf KL & Selangor). Tulis laporan yang komprehensif, profesional dan terperinci dalam Bahasa Melayu. Gunakan format markdown yang sesuai.

Maklumat organisasi:
- Nama Penuh: Pertubuhan Urus Peduli Asnaf (KL & Selangor)
- Diasaskan: 2018
- Alamat: 2253, Jalan Permata 22, Taman Permata, 53300 Gombak, Selangor
- Pengerusi: Datuk Dr Narimah Awin
- Hubungi: salam.puspaKL@gmail.com | +6012-3183369
- Misi: Meningkatkan taraf hidup asnaf dan komuniti kurang bernasib baik melalui program sokongan holistik.

Format laporan hendaklah mengandungi:
1. Tajuk utama (H1)
2. Pengenalan / ringkasan eksekutif
3. Bahagian-bahagian utama dengan sub-tajuk (H2, H3)
4. Data dan angka dalam jadual atau senarai
5. Rumusan dan cadangan
6. Gunakan bahasa formal Bahasa Melayu yang sesuai untuk laporan organisasi`;

// ─── Helpers ────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `RM ${amount.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Data Fetchers ──────────────────────────────────────────────────────

async function fetchSummaryData(): Promise<string> {
  const [
    allMembers,
    allProgrammes,
    allDonations,
    allActivities,
    allProgrammeMembers,
  ] = await Promise.all([
    db.member.findMany({
      select: { category: true, status: true, joinDate: true, familyMembers: true },
    }),
    db.programme.findMany({
      select: {
        name: true,
        category: true,
        status: true,
        beneficiaryCount: true,
        volunteerCount: true,
        budget: true,
        actualCost: true,
        startDate: true,
        endDate: true,
        location: true,
      },
    }),
    db.donation.findMany({
      select: { amount: true, date: true, method: true, status: true, donorName: true },
    }),
    db.activity.findMany({
      select: { title: true, type: true, date: true },
      orderBy: { date: "desc" },
      take: 15,
    }),
    db.programmeMember.findMany({
      select: { role: true, status: true },
    }),
  ]);

  // Member stats
  const totalMembers = allMembers.length;
  const categoryBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  allMembers.forEach((m) => {
    categoryBreakdown[m.category] = (categoryBreakdown[m.category] || 0) + 1;
    statusBreakdown[m.status] = (statusBreakdown[m.status] || 0) + 1;
  });
  const totalFamilyMembers = allMembers.reduce((sum, m) => sum + m.familyMembers, 0);

  // Programme stats
  const totalProgrammes = allProgrammes.length;
  const programmeCategoryBreakdown: Record<string, number> = {};
  const programmeStatusBreakdown: Record<string, number> = {};
  let totalBeneficiaries = 0;
  let totalVolunteers = 0;
  allProgrammes.forEach((p) => {
    programmeCategoryBreakdown[p.category] = (programmeCategoryBreakdown[p.category] || 0) + 1;
    programmeStatusBreakdown[p.status] = (programmeStatusBreakdown[p.status] || 0) + 1;
    totalBeneficiaries += p.beneficiaryCount;
    totalVolunteers += p.volunteerCount;
  });

  // Donation stats
  const confirmedDonations = allDonations.filter((d) => d.status === "confirmed");
  const totalDonationAmount = confirmedDonations.reduce((sum, d) => sum + d.amount, 0);
  const donationMethodBreakdown: Record<string, { count: number; total: number }> = {};
  confirmedDonations.forEach((d) => {
    if (!donationMethodBreakdown[d.method]) {
      donationMethodBreakdown[d.method] = { count: 0, total: 0 };
    }
    donationMethodBreakdown[d.method].count++;
    donationMethodBreakdown[d.method].total += d.amount;
  });

  // Programme member stats
  const roleBreakdown: Record<string, number> = {};
  allProgrammeMembers.forEach((pm) => {
    roleBreakdown[pm.role] = (roleBreakdown[pm.role] || 0) + 1;
  });

  // Recent activities
  const recentActivitiesList = allActivities
    .slice(0, 10)
    .map((a) => `- ${a.title} (${a.type}) pada ${formatDate(new Date(a.date))}`)
    .join("\n");

  // Programme list
  const programmeList = allProgrammes
    .map(
      (p) =>
        `- ${p.name} [${p.category}/${p.status}]: ${p.beneficiaryCount} penerima manfaat, ${p.volunteerCount} sukarelawan, bajet ${formatCurrency(p.budget)}, kos sebenar ${formatCurrency(p.actualCost)}${p.location ? `, lokasi: ${p.location}` : ""}`
    )
    .join("\n");

  return `
DATA RINGKASAN ORGANISASI PUSPA:

=== AHLI ===
Jumlah ahli: ${totalMembers}
Jumlah keseluruhan ahli keluarga: ${totalFamilyMembers}
Pecahan kategori:
${Object.entries(categoryBreakdown)
  .map(([k, v]) => `  - ${k}: ${v}`)
  .join("\n")}
Pecahan status:
${Object.entries(statusBreakdown)
  .map(([k, v]) => `  - ${k}: ${v}`)
  .join("\n")}

=== PROGRAM ===
Jumlah program: ${totalProgrammes}
Jumlah penerima manfaat: ${totalBeneficiaries}
Jumlah sukarelawan terlibat: ${totalVolunteers}
Pecahan kategori program:
${Object.entries(programmeCategoryBreakdown)
  .map(([k, v]) => `  - ${k}: ${v}`)
  .join("\n")}
Pecahan status program:
${Object.entries(programmeStatusBreakdown)
  .map(([k, v]) => `  - ${k}: ${v}`)
  .join("\n")}

Senarai program:
${programmeList}

=== SUMBANGAN/DONASI ===
Jumlah sumbangan (disahkan): ${confirmedDonations.length}
Jumlah keseluruhan sumbangan: ${formatCurrency(totalDonationAmount)}
Purata sumbangan: ${formatCurrency(confirmedDonations.length > 0 ? totalDonationAmount / confirmedDonations.length : 0)}
Kaedah pembayaran:
${Object.entries(donationMethodBreakdown)
  .map(([k, v]) => `  - ${k}: ${v.count} sumbangan, jumlah ${formatCurrency(v.total)}`)
  .join("\n")}

=== PENGLIBATAN AHLI PROGRAM ===
Pecahan peranan:
${Object.entries(roleBreakdown)
  .map(([k, v]) => `  - ${k}: ${v}`)
  .join("\n")}

=== AKTIVITI TERKINI ===
${recentActivitiesList}

Tarikh laporan dijana: ${formatDate(new Date())}`.trim();
}

async function fetchFinancialData(): Promise<string> {
  const [allDonations, allProgrammes] = await Promise.all([
    db.donation.findMany({
      select: { amount: true, date: true, method: true, status: true, donorName: true, programmeId: true },
      orderBy: { date: "desc" },
    }),
    db.programme.findMany({
      select: {
        name: true,
        category: true,
        status: true,
        budget: true,
        actualCost: true,
        startDate: true,
        endDate: true,
        donations: {
          select: { amount: true, status: true },
        },
      },
    }),
  ]);

  // Overall donation stats
  const allConfirmed = allDonations.filter((d) => d.status === "confirmed");
  const allPending = allDonations.filter((d) => d.status === "pending");
  const allRejected = allDonations.filter((d) => d.status === "rejected");

  const totalConfirmed = allConfirmed.reduce((s, d) => s + d.amount, 0);
  const totalPending = allPending.reduce((s, d) => s + d.amount, 0);
  const totalRejected = allRejected.reduce((s, d) => s + d.amount, 0);
  const grandTotal = allDonations.reduce((s, d) => s + d.amount, 0);

  // Method breakdown
  const methodBreakdown: Record<string, { count: number; total: number }> = {};
  allConfirmed.forEach((d) => {
    if (!methodBreakdown[d.method]) methodBreakdown[d.method] = { count: 0, total: 0 };
    methodBreakdown[d.method].count++;
    methodBreakdown[d.method].total += d.amount;
  });

  // Monthly breakdown (last 12 months)
  const now = new Date();
  const monthlyData: Array<{ month: string; amount: number; count: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthDonations = allConfirmed.filter((d) => {
      const dd = new Date(d.date);
      return dd >= monthStart && dd < monthEnd;
    });
    const amount = monthDonations.reduce((s, d) => s + d.amount, 0);
    if (amount > 0 || monthDonations.length > 0) {
      monthlyData.push({
        month: monthStart.toLocaleDateString("ms-MY", { month: "long", year: "numeric" }),
        amount,
        count: monthDonations.length,
      });
    }
  }

  // Top donors
  const donorTotals: Record<string, number> = {};
  allConfirmed.forEach((d) => {
    donorTotals[d.donorName] = (donorTotals[d.donorName] || 0) + d.amount;
  });
  const topDonors = Object.entries(donorTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Programme budget vs actual
  const programmeFinancials = allProgrammes.map((p) => {
    const donationsForProgramme = p.donations.filter((d) => d.status === "confirmed");
    const donationTotal = donationsForProgramme.reduce((s, d) => s + d.amount, 0);
    const variance = p.budget - p.actualCost;
    const utilizationRate = p.budget > 0 ? ((p.actualCost / p.budget) * 100).toFixed(1) : "N/A";
    return {
      name: p.name,
      category: p.category,
      status: p.status,
      budget: p.budget,
      actualCost: p.actualCost,
      donationTotal,
      variance,
      utilizationRate,
    };
  });

  const totalBudget = allProgrammes.reduce((s, p) => s + p.budget, 0);
  const totalActualCost = allProgrammes.reduce((s, p) => s + p.actualCost, 0);
  const totalVariance = totalBudget - totalActualCost;
  const overallUtilization = totalBudget > 0 ? ((totalActualCost / totalBudget) * 100).toFixed(1) : "N/A";

  const programmeFinList = programmeFinancials
    .map(
      (pf) =>
        `- ${pf.name} [${pf.category}]: Bajet ${formatCurrency(pf.budget)}, Kos Sebenar ${formatCurrency(pf.actualCost)}, Sumbangan ${formatCurrency(pf.donationTotal)}, Varians ${formatCurrency(pf.variance)}, Kadar Penggunaan ${pf.utilizationRate}%`
    )
    .join("\n");

  return `
DATA LAPORAN KEWANGAN PUSPA:

=== RINGKASAN KESELURUHAN ===
Jumlah keseluruhan sumbangan: ${formatCurrency(grandTotal)}
Sumbangan disahkan: ${formatCurrency(totalConfirmed)} (${allConfirmed.length} transaksi)
Sumbangan menunggu: ${formatCurrency(totalPending)} (${allPending.length} transaksi)
Sumbangan ditolak: ${formatCurrency(totalRejected)} (${allRejected.length} transaksi)
Purata sumbangan: ${formatCurrency(allConfirmed.length > 0 ? totalConfirmed / allConfirmed.length : 0)}

=== KAEDAH PEMBAYARAN ===
${Object.entries(methodBreakdown)
  .map(([k, v]) => `  - ${k}: ${v.count} transaksi, jumlah ${formatCurrency(v.total)}`)
  .join("\n")}

=== PEMECahan BULANAN (12 BULAN TERAKHIR) ===
${monthlyData.map((m) => `  - ${m.month}: ${m.count} sumbangan, jumlah ${formatCurrency(m.amount)}`).join("\n")}

=== PENYUMBANG UTAMA (TOP 10) ===
${topDonors.map(([name, amount], i) => `  ${i + 1}. ${name}: ${formatCurrency(amount)}`).join("\n")}

=== BAJET vs KOS SEBENAR PROGRAM ===
Jumlah keseluruhan bajet: ${formatCurrency(totalBudget)}
Jumlah keseluruhan kos sebenar: ${formatCurrency(totalActualCost)}
Jumlah varians: ${formatCurrency(totalVariance)}
Kadar penggunaan keseluruhan: ${overallUtilization}%

${programmeFinList}

Tarikh laporan dijana: ${formatDate(new Date())}`.trim();
}

async function fetchProgrammeData(): Promise<string> {
  const [allProgrammes, allProgrammeMembers, allActivities] = await Promise.all([
    db.programme.findMany({
      select: {
        name: true,
        description: true,
        category: true,
        status: true,
        startDate: true,
        endDate: true,
        location: true,
        beneficiaryCount: true,
        volunteerCount: true,
        budget: true,
        actualCost: true,
        partners: true,
        programmeMembers: {
          select: { role: true, status: true },
        },
        activities: {
          select: { title: true, type: true, date: true },
          take: 5,
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.programmeMember.findMany({
      select: { role: true, status: true, joinedAt: true },
    }),
    db.activity.findMany({
      select: { title: true, type: true, date: true, programmeId: true },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  // Programme category breakdown
  const categoryBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  let totalBeneficiaries = 0;
  let totalVolunteers = 0;
  let totalBudget = 0;
  let totalActualCost = 0;

  allProgrammes.forEach((p) => {
    categoryBreakdown[p.category] = (categoryBreakdown[p.category] || 0) + 1;
    statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    totalBeneficiaries += p.beneficiaryCount;
    totalVolunteers += p.volunteerCount;
    totalBudget += p.budget;
    totalActualCost += p.actualCost;
  });

  // Programme member role breakdown
  const roleBreakdown: Record<string, number> = {};
  allProgrammeMembers.forEach((pm) => {
    roleBreakdown[pm.role] = (roleBreakdown[pm.role] || 0) + 1;
  });

  // Detailed programme info
  const programmeDetails = allProgrammes
    .map((p) => {
      const memberCount = p.programmeMembers.length;
      const activityList = p.activities.map((a) => `    - ${a.title} (${a.date.toLocaleDateString("ms-MY")})`).join("\n");
      return `
[${p.name}]
  Kategori: ${p.category}
  Status: ${p.status}
  Lokasi: ${p.location || "Tidak ditetapkan"}
  Tarikh: ${p.startDate ? formatDate(new Date(p.startDate)) : "-"} hingga ${p.endDate ? formatDate(new Date(p.endDate)) : "-"}
  Penerima manfaat: ${p.beneficiaryCount}
  Sukarelawan: ${p.volunteerCount}
  Ahli terlibat: ${memberCount}
  Bajet: ${formatCurrency(p.budget)}
  Kos sebenar: ${formatCurrency(p.actualCost)}
  Rakan kongsi: ${p.partners || "Tiada"}
  Penerangan: ${p.description || "Tiada"}
  Aktiviti terkini:
${activityList || "    - Tiada aktiviti direkodkan"}`.trim();
    })
    .join("\n\n");

  // Recent activities
  const recentActivities = allActivities
    .slice(0, 10)
    .map((a) => `- ${a.title} (${a.type}) pada ${formatDate(new Date(a.date))}`)
    .join("\n");

  return `
DATA LAPORAN IMPAK PROGRAM PUSPA:

=== RINGKASAN ===
Jumlah program: ${allProgrammes.length}
Jumlah keseluruhan penerima manfaat: ${totalBeneficiaries}
Jumlah keseluruhan sukarelawan: ${totalVolunteers}
Jumlah bajet semua program: ${formatCurrency(totalBudget)}
Jumlah kos sebenar semua program: ${formatCurrency(totalActualCost)}

=== PECAHAN KATEGORI PROGRAM ===
${Object.entries(categoryBreakdown)
  .map(([k, v]) => `  - ${k}: ${v} program`)
  .join("\n")}

=== PECAHAN STATUS PROGRAM ===
${Object.entries(statusBreakdown)
  .map(([k, v]) => `  - ${k}: ${v} program`)
  .join("\n")}

=== PECAHAN PERANAN AHLI ===
${Object.entries(roleBreakdown)
  .map(([k, v]) => `  - ${k}: ${v}`)
  .join("\n")}

=== BUTIRAN TERPERINCI SETIAP PROGRAM ===
${programmeDetails}

=== AKTIVITI TERKINI ===
${recentActivities}

Tarikh laporan dijana: ${formatDate(new Date())}`.trim();
}

async function fetchMemberData(): Promise<string> {
  const allMembers = await db.member.findMany({
    select: {
      name: true,
      category: true,
      status: true,
      phone: true,
      address: true,
      joinDate: true,
      familyMembers: true,
      monthlyIncome: true,
      programmeMembers: {
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  let totalFamilyMembers = 0;

  const incomeRanges: Record<string, number> = {
    "Tiada pendapatan (RM0)": 0,
    "Rendah (RM1-1500)": 0,
    "Pertengahan rendah (RM1501-3000)": 0,
    "Pertengahan (RM3001-5000)": 0,
    "Sederhana tinggi (RM5001+)": 0,
  };

  const joinYearBreakdown: Record<string, number> = {};

  // Location extraction (simplified - take first word/area from address)
  const locationBreakdown: Record<string, number> = {};

  allMembers.forEach((m) => {
    categoryBreakdown[m.category] = (categoryBreakdown[m.category] || 0) + 1;
    statusBreakdown[m.status] = (statusBreakdown[m.status] || 0) + 1;
    totalFamilyMembers += m.familyMembers;

    // Income range
    if (m.monthlyIncome === 0) incomeRanges["Tiada pendapatan (RM0)"]++;
    else if (m.monthlyIncome <= 1500) incomeRanges["Rendah (RM1-1500)"]++;
    else if (m.monthlyIncome <= 3000) incomeRanges["Pertengahan rendah (RM1501-3000)"]++;
    else if (m.monthlyIncome <= 5000) incomeRanges["Pertengahan (RM3001-5000)"]++;
    else incomeRanges["Sederhana tinggi (RM5001+)"]++;

    // Join year
    const joinYear = new Date(m.joinDate).getFullYear().toString();
    joinYearBreakdown[joinYear] = (joinYearBreakdown[joinYear] || 0) + 1;

    // Location (extract area from address)
    if (m.address) {
      const area = m.address.trim().split(/[,;]/)[0].trim();
      if (area) {
        locationBreakdown[area] = (locationBreakdown[area] || 0) + 1;
      }
    }
  });

  // Programme participation
  const programmeParticipation: Record<string, number> = {};
  allMembers.forEach((m) => {
    const count = m.programmeMembers.length;
    if (count === 0) programmeParticipation["Tiada program"]++;
    else if (count === 1) programmeParticipation["1 program"]++;
    else if (count <= 3) programmeParticipation["2-3 program"]++;
    else programmeParticipation["4+ program"]++;
  });

  // Member list by category
  const membersByCategory: Record<string, string[]> = {};
  allMembers.forEach((m) => {
    if (!membersByCategory[m.category]) membersByCategory[m.category] = [];
    membersByCategory[m.category].push(`  - ${m.name} (sertai: ${formatDate(new Date(m.joinDate))}, pendapatan: ${formatCurrency(m.monthlyIncome)}, keluarga: ${m.familyMembers} orang${m.programmeMembers.length > 0 ? `, program: ${m.programmeMembers.length}` : ""})`);
  });

  const totalMonthlyIncome = allMembers.reduce((s, m) => s + m.monthlyIncome, 0);
  const avgMonthlyIncome = allMembers.length > 0 ? totalMonthlyIncome / allMembers.length : 0;

  return `
DATA DEMOGRAFI AHLI PUSPA:

=== RINGKASAN ===
Jumlah ahli berdaftar: ${allMembers.length}
Jumlah keseluruhan ahli keluarga: ${totalFamilyMembers}
Purata pendapatan bulanan: ${formatCurrency(avgMonthlyIncome)}
Jumlah pendapatan bulanan semua ahli: ${formatCurrency(totalMonthlyIncome)}

=== PECAHAN KATEGORI ===
${Object.entries(categoryBreakdown)
  .map(([k, v]) => `  - ${k}: ${v} (${((v / allMembers.length) * 100).toFixed(1)}%)`)
  .join("\n")}

=== PECAHAN STATUS ===
${Object.entries(statusBreakdown)
  .map(([k, v]) => `  - ${k}: ${v} (${((v / allMembers.length) * 100).toFixed(1)}%)`)
  .join("\n")}

=== TAHAP PENDAPATAN BULANAN ===
${Object.entries(incomeRanges)
  .map(([k, v]) => `  - ${k}: ${v}`)
  .join("\n")}

=== PENGECAMAN MENGIKUT TAHUN BERGABUNG ===
${Object.entries(joinYearBreakdown)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `  - ${k}: ${v} ahli`)
  .join("\n")}

=== LOKASI/ALAMAT ===
${Object.entries(locationBreakdown)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([k, v]) => `  - ${k}: ${v}`)
  .join("\n")}

=== PENGLIBATAN PROGRAM ===
${Object.entries(programmeParticipation)
  .map(([k, v]) => `  - ${k}: ${v} ahli`)
  .join("\n")}

=== SENARAI AHLI MENGIKUT KATEGORI ===
${Object.entries(membersByCategory)
  .map(([category, members]) => `[${category}]\n${members.join("\n")}`)
  .join("\n\n")}

Tarikh laporan dijana: ${formatDate(new Date())}`.trim();
}

async function fetchCustomData(): Promise<string> {
  // For custom reports, fetch all data so the LLM has full context
  const [members, programmes, donations, activities] = await Promise.all([
    db.member.findMany({
      select: { name: true, category: true, status: true, joinDate: true, familyMembers: true, monthlyIncome: true, address: true, phone: true },
    }),
    db.programme.findMany({
      select: { name: true, category: true, status: true, beneficiaryCount: true, volunteerCount: true, budget: true, actualCost: true, location: true, startDate: true, endDate: true, description: true, partners: true },
    }),
    db.donation.findMany({
      select: { donorName: true, amount: true, date: true, method: true, status: true },
      orderBy: { date: "desc" },
    }),
    db.activity.findMany({
      select: { title: true, type: true, date: true },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const totalDonationAmount = donations
    .filter((d) => d.status === "confirmed")
    .reduce((s, d) => s + d.amount, 0);

  const memberList = members
    .map((m) => `  - ${m.name} [${m.category}/${m.status}], pendapatan: ${formatCurrency(m.monthlyIncome)}, keluarga: ${m.familyMembers}`)
    .join("\n");

  const programmeList = programmes
    .map((p) => `  - ${p.name} [${p.category}/${p.status}], penerima: ${p.beneficiaryCount}, bajet: ${formatCurrency(p.budget)}, kos: ${formatCurrency(p.actualCost)}`)
    .join("\n");

  const donationList = donations.slice(0, 15)
    .map((d) => `  - ${d.donorName}: ${formatCurrency(d.amount)} (${d.method}/${d.status}) pada ${formatDate(new Date(d.date))}`)
    .join("\n");

  const activityList = activities
    .map((a) => `  - ${a.title} (${a.type}) pada ${formatDate(new Date(a.date))}`)
    .join("\n");

  return `
DATA LENGKAP PUSPA UNTUK LAPORAN KHAS:

=== AHLI (${members.length}) ===
${memberList}

=== PROGRAM (${programmes.length}) ===
${programmeList}

=== SUMBANGAN (${donations.length} transaksi, jumlah disahkan: ${formatCurrency(totalDonationAmount)}) ===
${donationList}

=== AKTIVITI ===
${activityList}

Tarikh laporan dijana: ${formatDate(new Date())}`.trim();
}

// ─── Context Builder ────────────────────────────────────────────────────

function buildUserPrompt(type: ReportType, customPrompt?: string, contextData: string): string {
  const typeInstructions: Record<ReportType, string> = {
    summary:
      "Sediakan laporan ringkasan organisasi yang komprehensif merangkumi keseluruhan operasi PUSPA termasuk ahli, program, sumbangan, dan aktiviti terkini. Tumpukan kepada gambaran besar organisasi, pencapaian utama, dan trend terkini.",
    financial:
      "Sediakan laporan kewangan yang terperinci merangkumi semua sumbangan, pecahan kaedah pembayaran, analisis bulanan, penyumbang utama, dan perbandingan bajet vs kos sebenar untuk setiap program. Sertakan analisis varians dan cadangan pengurusan kewangan.",
    programme:
      "Sediakan laporan impak program yang komprehensif merangkumi semua program PUSPA, pecahan kategori, jumlah penerima manfaat, penglibatan sukarelawan, dan impak setiap program. Tumpukan kepada keberkesanan program dan cadangan penambahbaikan.",
    member:
      "Sediakan laporan demografi ahli yang terperinci merangkumi pecahan kategori, tahap pendapatan, taburan lokasi, penglibatan program, dan trend pendaftaran. Sertakan analisis profil ahli dan cadangan strategi penglibatan.",
    custom: `Berdasarkan data PUSPA di bawah, sediakan laporan mengikut permintaan pengguna: "${customPrompt}"`,
  };

  return `${typeInstructions[type]}

Berikut adalah data semasa dari pangkalan data PUSPA:

${contextData}`;
}

// ─── Main Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: ReportRequest = await request.json();
    const { type, customPrompt } = body;

    if (!type || !["summary", "financial", "programme", "member", "custom"].includes(type)) {
      return NextResponse.json(
        { error: "Jenis laporan tidak sah. Pilih: summary, financial, programme, member, atau custom." },
        { status: 400 }
      );
    }

    if (type === "custom" && (!customPrompt || customPrompt.trim().length === 0)) {
      return NextResponse.json(
        { error: "Prompt khas diperlukan untuk jenis laporan 'custom'." },
        { status: 400 }
      );
    }

    // Fetch data based on report type
    let contextData: string;
    switch (type) {
      case "summary":
        contextData = await fetchSummaryData();
        break;
      case "financial":
        contextData = await fetchFinancialData();
        break;
      case "programme":
        contextData = await fetchProgrammeData();
        break;
      case "member":
        contextData = await fetchMemberData();
        break;
      case "custom":
        contextData = await fetchCustomData();
        break;
      default:
        return NextResponse.json({ error: "Jenis laporan tidak dikenali." }, { status: 400 });
    }

    // Build prompt
    const userPrompt = buildUserPrompt(type, customPrompt, contextData);

    // Call LLM
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const report = response.choices[0]?.message?.content || "Maaf, berlaku ralat semasa menjana laporan. Sila cuba lagi.";

    const title = type === "custom" && customPrompt
      ? `Laporan Khas: ${customPrompt.slice(0, 60)}${customPrompt.length > 60 ? "..." : ""}`
      : REPORT_TITLES[type];

    return NextResponse.json({ report, title });
  } catch (error) {
    console.error("[PUSPA Report API Error]", error);
    return NextResponse.json(
      {
        error: "Ralat teknikal berlaku semasa menjana laporan. Sila cuba lagi sebentar.",
      },
      { status: 500 }
    );
  }
}
