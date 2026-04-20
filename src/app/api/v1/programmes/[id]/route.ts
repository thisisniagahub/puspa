import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-response";
import { programmeUpdateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { NextRequest } from "next/server";

// GET /api/v1/programmes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "programmes:read");
    const { id } = await params;

    const programme = await db.programme.findUnique({
      where: { id },
      include: {
        _count: { select: { cases: true, donations: true, disbursements: true } },
        creator: { select: { id: true, name: true } },
        cases: {
          take: 10,
          orderBy: { createdAt: "desc" },
          select: { id: true, caseNumber: true, applicantName: true, status: true },
        },
      },
    });

    if (!programme) return apiNotFound("Program tidak dijumpai");
    return apiSuccess(programme);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[PROGRAMMES] GET by ID error:", error);
    return apiError("Gagal memuatkan program", 500);
  }
}

// PATCH /api/v1/programmes/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "programmes:update");
    const { id } = await params;

    const existing = await db.programme.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Program tidak dijumpai");

    const body = await request.json();
    const parsed = programmeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        if ((key === "startDate" || key === "endDate") && typeof value === "string") {
          updateData[key] = new Date(value);
        } else {
          updateData[key] = value;
        }
      }
    }

    const updated = await db.programme.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { cases: true, donations: true, disbursements: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      entity: "programme",
      entityId: id,
      details: { fields: Object.keys(parsed.data) },
      ipAddress: getClientIp(request),
    });

    return apiSuccess(updated, "Program berjaya dikemaskini");
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[PROGRAMMES] PATCH error:", error);
    return apiError("Gagal mengemaskini program", 500);
  }
}

// DELETE /api/v1/programmes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "programmes:delete");
    const { id } = await params;

    const existing = await db.programme.findUnique({
      where: { id },
      include: { _count: { select: { cases: true, donations: true, disbursements: true } } },
    });

    if (!existing) return apiNotFound("Program tidak dijumpai");

    const linkedResources = existing._count.cases + existing._count.donations + existing._count.disbursements;
    if (linkedResources > 0) {
      return apiError(
        `Tidak boleh memadam program yang mempunyai ${linkedResources} sumber terpaut. Nyahaktifkan sebaliknya.`,
        422
      );
    }

    await db.programme.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      entity: "programme",
      entityId: id,
      details: { name: existing.name, code: existing.code },
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ message: "Program berjaya dipadam" });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[PROGRAMMES] DELETE error:", error);
    return apiError("Gagal memadam program", 500);
  }
}
