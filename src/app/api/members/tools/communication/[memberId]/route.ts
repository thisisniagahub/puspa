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

    const logs = await db.communicationLog.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[Communication Log Member GET Error]", error);
    return NextResponse.json({ error: "Ralat teknikal berlaku." }, { status: 500 });
  }
}
