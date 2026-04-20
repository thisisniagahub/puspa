import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-response";
import { caseNoteCreateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { NextRequest } from "next/server";

// GET /api/v1/cases/[id]/notes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "cases:read");
    const { id } = await params;

    const caseData = await db.case.findUnique({ where: { id } });
    if (!caseData) return apiNotFound("Kes tidak dijumpai");

    const notes = await db.caseNote.findMany({
      where: { caseId: id },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, role: true, avatar: true } } },
    });

    return apiSuccess(notes);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
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
    const session = requireAuth(request);
    requirePermission(session, "cases:read"); // Anyone who can read cases can add notes
    const { id } = await params;

    const caseData = await db.case.findUnique({ where: { id } });
    if (!caseData) return apiNotFound("Kes tidak dijumpai");

    const body = await request.json();
    const parsed = caseNoteCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    // Override authorId with session user to prevent impersonation
    const note = await db.caseNote.create({
      data: {
        caseId: id,
        authorId: session.userId,
        type: parsed.data.type,
        content: parsed.data.content,
        metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : undefined,
      },
      include: { author: { select: { id: true, name: true, role: true, avatar: true } } },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      entity: "case",
      entityId: id,
      details: { noteType: parsed.data.type },
      ipAddress: getClientIp(request),
    });

    return apiSuccess(note, { status: 201, message: "Nota berjaya ditambah" });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CASE_NOTES] POST error:", error);
    return apiError("Gagal menambah nota", 500);
  }
}
