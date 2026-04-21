import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    requireAuth(request);
    const { memberId } = await params;

    if (!memberId) {
      return NextResponse.json({ error: "memberId diperlukan." }, { status: 400 });
    }

    const [latestAssessment, history] = await Promise.all([
      db.welfareAssessment.findFirst({ where: { memberId }, orderBy: { createdAt: "desc" } }),
      db.welfareAssessment.findMany({ where: { memberId }, orderBy: { createdAt: "desc" }, take: 10 }),
    ]);

    return NextResponse.json({ latest: latestAssessment, history });
  } catch (error) {
    console.error("[Welfare Assessment Member GET Error]", error);
    return NextResponse.json({ error: "Ralat teknikal berlaku." }, { status: 500 });
  }
}
