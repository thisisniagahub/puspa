import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    requireAuth(_request);

    const { memberId } = await params;

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId diperlukan." },
        { status: 400 }
      );
    }

    // Get the latest assessment
    const latestAssessment = await db.welfareAssessment.findFirst({
      where: { memberId },
      orderBy: { createdAt: "desc" },
    });

    // Also get history (last 10)
    const history = await db.welfareAssessment.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      latest: latestAssessment,
      history,
    });
  } catch (error) {
    console.error("[Welfare Assessment GET Error]", error);
    return NextResponse.json(
      { error: "Ralat teknikal berlaku." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body = await request.json();
    const {
      memberId,
      foodSecurity,
      education,
      healthcare,
      financial,
      housing,
      notes,
      assessedBy,
    } = body;

    // Validate required fields
    if (!memberId) {
      return NextResponse.json(
        { error: "memberId diperlukan." },
        { status: 400 }
      );
    }

    // Validate scores are 1-5
    const scores = { foodSecurity, education, healthcare, financial, housing };
    for (const [key, value] of Object.entries(scores)) {
      if (typeof value !== "number" || value < 1 || value > 5) {
        return NextResponse.json(
          { error: `${key} mesti antara 1 dan 5.` },
          { status: 400 }
        );
      }
    }

    // Calculate overall score
    const scoreValues = Object.values(scores) as number[];
    const overallScore =
      Math.round(
        (scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length) *
          100
      ) / 100;

    // Create assessment
    const assessment = await db.welfareAssessment.create({
      data: {
        memberId,
        foodSecurity,
        education,
        healthcare,
        financial,
        housing,
        overallScore,
        notes: notes || null,
        assessedBy: assessedBy || null,
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("[Welfare Assessment POST Error]", error);
    return NextResponse.json(
      { error: "Ralat teknikal berlaku semasa menyimpan penilaian." },
      { status: 500 }
    );
  }
}
