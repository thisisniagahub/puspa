import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    if (!memberId) {
      return NextResponse.json(
        { error: "memberId diperlukan." },
        { status: 400 }
      );
    }

    const logs = await db.communicationLog.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[Communication Log GET Error]", error);
    return NextResponse.json(
      { error: "Ralat teknikal berlaku." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      memberId,
      type,
      summary,
      followUpNeeded,
      followUpDate,
      priority,
      conductedBy,
    } = body;

    // Validate required fields
    if (!memberId) {
      return NextResponse.json(
        { error: "memberId diperlukan." },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "Jenis komunikasi diperlukan." },
        { status: 400 }
      );
    }

    if (!summary || summary.trim().length === 0) {
      return NextResponse.json(
        { error: "Ringkasan diperlukan." },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["phone", "visit", "meeting", "email", "aid-distribution"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Jenis tidak sah. Pilih: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["low", "normal", "high", "urgent"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Keutamaan tidak sah. Pilih: ${validPriorities.join(", ")}` },
        { status: 400 }
      );
    }

    // Create communication log
    const log = await db.communicationLog.create({
      data: {
        memberId,
        type,
        summary: summary.trim(),
        followUpNeeded: followUpNeeded || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        priority: priority || "normal",
        conductedBy: conductedBy || null,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("[Communication Log POST Error]", error);
    return NextResponse.json(
      { error: "Ralat teknikal berlaku semasa menyimpan rekod." },
      { status: 500 }
    );
  }
}
