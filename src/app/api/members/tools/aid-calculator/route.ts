import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";

// Malaysia Poverty Line 2024
const POVERTY_LINE = 2960;

interface AidCalculatorRequest {
  monthlyIncome: number;
  familySize: number;
  category: string;
  specialNeeds?: string;
}

function calculateMultiplier(familySize: number): number {
  // 1 adult = 1.0, each additional = 0.5, max 4.0
  const multiplier = 1.0 + (familySize - 1) * 0.5;
  return Math.min(multiplier, 4.0);
}

function getAidCategory(recommendedAid: number): {
  category: string;
  label: string;
  color: string;
} {
  if (recommendedAid >= 3000) {
    return { category: "kritikal", label: "Bantuan Kritikal", color: "red" };
  } else if (recommendedAid >= 2000) {
    return { category: "tinggi", label: "Bantuan Tinggi", color: "orange" };
  } else if (recommendedAid >= 1000) {
    return { category: "sederhana", label: "Bantuan Sederhana", color: "yellow" };
  } else if (recommendedAid > 0) {
    return { category: "rendah", label: "Bantuan Rendah", color: "green" };
  } else {
    return { category: "tiada", label: "Tidak Memerlukan", color: "gray" };
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body: AidCalculatorRequest = await request.json();
    const { monthlyIncome, familySize, category, specialNeeds } = body;

    // Validate inputs
    if (typeof monthlyIncome !== "number" || monthlyIncome < 0) {
      return NextResponse.json(
        { error: "Pendapatan bulanan mesti bernilai positif." },
        { status: 400 }
      );
    }

    if (typeof familySize !== "number" || familySize < 1) {
      return NextResponse.json(
        { error: "Saiz keluarga mesti sekurang-kurangnya 1." },
        { status: 400 }
      );
    }

    // Calculate multiplier based on family size
    const multiplier = calculateMultiplier(familySize);

    // Base calculation: (Poverty line - monthlyIncome) * multiplier
    const incomeGap = Math.max(POVERTY_LINE - monthlyIncome, 0);
    let recommendedMonthlyAid = incomeGap * multiplier;

    // Category adjustments
    let categoryAdjustment = 0;
    let categoryLabel = category || "asnaf";

    switch (category) {
      case "asnaf":
        categoryAdjustment = 0; // Full eligibility
        categoryLabel = "Asnaf";
        break;
      case "volunteer":
        categoryAdjustment = -0.3; // Slightly reduced
        categoryLabel = "Sukarelawan";
        break;
      case "donor":
        recommendedMonthlyAid = 0; // Donors not eligible
        categoryLabel = "Penderma";
        break;
      default:
        categoryAdjustment = 0;
    }

    // Apply category adjustment
    if (category !== "donor" && categoryAdjustment !== 0) {
      recommendedMonthlyAid = recommendedMonthlyAid * (1 + categoryAdjustment);
    }

    // Special needs adjustments
    let specialNeedsAdjustment = 0;
    let specialNeedsLabel = "";

    if (specialNeeds) {
      const needs = specialNeeds.toLowerCase();
      if (needs.includes("oku") || needs.includes("kurang upaya") || needs.includes("disability")) {
        specialNeedsAdjustment += 500;
        specialNeedsLabel = "Tambah OKU (+RM500)";
      }
      if (needs.includes("warga emas") || needs.includes("tua") || needs.includes("elderly")) {
        specialNeedsAdjustment += 300;
        specialNeedsLabel = specialNeedsLabel
          ? `${specialNeedsLabel}, Warga Emas (+RM300)`
          : "Warga Emas (+RM300)";
      }
      if (needs.includes("ibu tunggal") || needs.includes("single mother")) {
        specialNeedsAdjustment += 400;
        specialNeedsLabel = specialNeedsLabel
          ? `${specialNeedsLabel}, Ibu Tunggal (+RM400)`
          : "Ibu Tunggal (+RM400)";
      }
      if (needs.includes("pelajar") || needs.includes("student")) {
        specialNeedsAdjustment += 200;
        specialNeedsLabel = specialNeedsLabel
          ? `${specialNeedsLabel}, Pelajar (+RM200)`
          : "Pelajar (+RM200)";
      }
    }

    recommendedMonthlyAid = Math.max(recommendedMonthlyAid + specialNeedsAdjustment, 0);

    // Round to 2 decimal places
    recommendedMonthlyAid = Math.round(recommendedMonthlyAid * 100) / 100;

    // Get aid category info
    const aidCategory = getAidCategory(recommendedMonthlyAid);

    // Build breakdown
    const breakdown = {
      garisKemiskinan: POVERTY_LINE,
      pendapatanBulanan: monthlyIncome,
      jurangPendapatan: incomeGap,
      pendarabanKeluarga: multiplier,
      kategoriAhli: categoryLabel,
      pelarasanKategori: categoryAdjustment !== 0 ? `${Math.round(categoryAdjustment * 100)}%` : "Tiada",
      keperluanKhas: specialNeeds || "Tiada",
      tambahanKeperluanKhas: specialNeedsAdjustment,
      labelKeperluanKhas: specialNeedsLabel || "Tiada",
    };

    return NextResponse.json({
      recommendedMonthlyAid,
      breakdown,
      category: aidCategory,
    });
  } catch (error) {
    console.error("[Aid Calculator API Error]", error);
    return NextResponse.json(
      { error: "Ralat teknikal berlaku. Sila cuba lagi." },
      { status: 500 }
    );
  }
}
