import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";

const ELIGIBILITY_SYSTEM_PROMPT = `Anda adalah penasihat kelayakan program untuk PUSPA (Pertubuhan Urus Peduli Asnaf KL & Selangor). Tugasan anda adalah menganalisis data ahli dan menentukan program-program yang sesuai untuk mereka.

Kategori program PUSPA:
- food-aid: Bantuan makanan dan keperluan asas
- education: Sokongan pendidikan, tuisyen, bursa
- skills: Latihan kemahiran dan keusahawanan
- healthcare: Bantuan perubatan dan kesihatan
- financial: Bantuan kewangan dan zakat
- community: Program komuniti dan pembangunan

Kriteria kelayakan umum:
- asnaf (pendapatan rendah/tiada): Layak untuk semua program bantuan
- volunteer: Layak untuk program latihan kemahiran
- donor: Tidak layak untuk program bantuan kewangan
- Pendapatan < RM2,960/bulan: Layak bantuan makanan dan kewangan
- Saiz keluarga > 4: Keutamaan untuk bantuan makanan

Berikan respons dalam format JSON sahaja, tanpa markdown. Format:
{
  "eligible": [
    {
      "programmeId": "id program",
      "programmeName": "nama program",
      "matchScore": 85,
      "reason": "sebab kelayakan dalam Bahasa Melayu"
    }
  ],
  "summary": "Ringkasan keseluruhan dalam Bahasa Melayu"
}

matchScore antara 0-100. Hanya masukkan program dengan skor > 40.
Susun mengikut matchScore tertinggi.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId diperlukan." },
        { status: 400 }
      );
    }

    // Fetch member data
    const member = await db.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        monthlyIncome: true,
        familyMembers: true,
        address: true,
        joinDate: true,
        programmeMembers: {
          select: {
            programmeId: true,
            programme: {
              select: { name: true, category: true, status: true },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Ahli tidak dijumpai." },
        { status: 404 }
      );
    }

    // Fetch all active programmes
    const programmes = await db.programme.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        description: true,
        location: true,
      },
    });

    // Build member info for AI
    const enrolledProgrammeIds = new Set(
      member.programmeMembers.map((pm) => pm.programmeId)
    );

    const programmeList = programmes
      .map(
        (p) =>
          `ID: ${p.id} | Nama: ${p.name} | Kategori: ${p.category} | ${p.description ? `Penerangan: ${p.description}` : ""} ${p.location ? `| Lokasi: ${p.location}` : ""}`
      )
      .join("\n");

    const memberInfo = `
MAKLUMAT AHLI:
- Nama: ${member.name}
- Kategori: ${member.category}
- Status: ${member.status}
- Pendapatan Bulanan: RM${member.monthlyIncome}
- Saiz Keluarga: ${member.familyMembers} orang
- Alamat: ${member.address || "Tidak diset"}
- Tarikh Sertai: ${new Date(member.joinDate).toLocaleDateString("ms-MY")}
- Program yang didaftarkan: ${member.programmeMembers.map((pm) => pm.programme.name).join(", ") || "Tiada"}

SENARAI PROGRAM AKTIF PUSPA:
${programmeList}

PERINGATAN: Jangan cadangkan program yang sudah didaftarkan oleh ahli ini. IDs program yang sudah didaftarkan: ${[...enrolledProgrammeIds].join(", ") || "Tiada"}`.trim();

    // Call LLM
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: ELIGIBILITY_SYSTEM_PROMPT },
        { role: "user", content: memberInfo },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "";

    // Parse JSON response
    let result;
    try {
      // Try to extract JSON from the response (handle possible markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { eligible: [], summary: "Tidak dapat menganalisis kelayakan pada masa ini." };
      }
    } catch {
      result = { eligible: [], summary: "Ralat dalam menganalisis kelayakan. Sila cuba lagi." };
    }

    // Ensure eligible is an array and filter by score
    if (!Array.isArray(result.eligible)) {
      result.eligible = [];
    }
    result.eligible = result.eligible
      .filter((e: { matchScore: number }) => e.matchScore > 40)
      .sort((a: { matchScore: number }, b: { matchScore: number }) => b.matchScore - a.matchScore);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Eligibility API Error]", error);
    return NextResponse.json(
      { error: "Ralat teknikal berlaku. Sila cuba lagi.", eligible: [], summary: "Ralat sistem." },
      { status: 500 }
    );
  }
}
