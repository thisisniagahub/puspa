import { db } from "@/lib/db";
import { apiSuccess, apiCreated, apiError, apiNotFound } from "@/lib/api-response";
import { NextRequest } from "next/server";

// GET /api/v1/cases/[id]/notes
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseData = await db.case.findUnique({ where: { id } });
    if (!caseData) return apiNotFound("Kes tidak dijumpai");

    const notes = await db.caseNote.findMany({
      where: { caseId: id },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    return apiSuccess(notes);
  } catch (error) {
    console.error("[CASE_NOTES] GET error:", error);
    return apiError("Gagal memuatkan nota", 500);
  }
}

// POST /api/v1/cases/[id]/notes
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseData = await db.case.findUnique({ where: { id } });
    if (!caseData) return apiNotFound("Kes tidak dijumpai");

    const body = await request.json();
    if (!body.content) return apiError("Kandungan nota diperlukan");
    if (!body.authorId) return apiError("ID penulis diperlukan");

    const note = await db.caseNote.create({
      data: {
        caseId: id,
        authorId: body.authorId,
        type: body.type ?? "note",
        content: body.content,
        metadata: body.metadata ? JSON.stringify(body.metadata) : undefined,
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    return apiCreated(note, "Nota berjaya ditambah");
  } catch (error) {
    console.error("[CASE_NOTES] POST error:", error);
    return apiError("Gagal menambah nota", 500);
  }
}
