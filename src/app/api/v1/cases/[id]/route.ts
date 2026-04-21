import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-response";
import { caseUpdateSchema } from "@/lib/validators";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { canTransitionCase } from "@/lib/auth";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { NextRequest } from "next/server";

// GET /api/v1/cases/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(_request);
    requirePermission(session, "cases:read");
    const { id } = await params;

    const caseData = await db.case.findUnique({
      where: { id },
      include: {
        programme: true,
        assignee: { select: { id: true, name: true, role: true } },
        verifier: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        caseNotes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, name: true, role: true } } },
          take: 50,
        },
        disbursements: {
          orderBy: { createdAt: "desc" },
          include: {
            processor: { select: { id: true, name: true } },
          },
        },
        documents: { orderBy: { createdAt: "desc" } },
        donations: { orderBy: { date: "desc" }, take: 10 },
        _count: { select: { caseNotes: true, disbursements: true, documents: true } },
      },
    });

    if (!caseData) return apiNotFound("Kes tidak dijumpai");

    // Calculate disbursement totals
    const totalDisbursed = caseData.disbursements
      .filter(d => d.status === "completed")
      .reduce((sum, d) => sum + d.amount, 0);

    return apiSuccess({ ...caseData, totalDisbursed });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CASES] GET by ID error:", error);
    return apiError("Gagal memuatkan kes", 500);
  }
}

// PATCH /api/v1/cases/[id] - Update case (supports status transitions)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    const { id } = await params;

    const existing = await db.case.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Kes tidak dijumpai");

    const body = await request.json();
    const parsed = caseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const data = parsed.data;
    const hasStatusChange = Boolean(data.status && data.status !== existing.status);
    const hasGeneralFieldUpdate = Object.entries(data).some(([key, value]) => {
      if (value === undefined) return false;
      return !["status", "verificationScore", "rejectionReason", "followUpDate"].includes(key);
    });

    if (hasGeneralFieldUpdate || !hasStatusChange) {
      requirePermission(session, "cases:update");
    }

    // Status transition validation
    if (data.status && data.status !== existing.status) {
      if (!canTransitionCase(existing.status, data.status)) {
        const validTransitions = [
          "draft", "submitted", "verifying", "verified", "scoring", "scored",
          "approved", "disbursing", "disbursed", "follow_up", "closed", "rejected",
        ].filter(s => canTransitionCase(existing.status, s));
        return apiError(
          `Transisi '${existing.status}' → '${data.status}' tidak dibenarkan. Sah: [${validTransitions.join(", ")}]`,
          422
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== "status") {
        updateData[key] = value;
      }
    }

    // Handle status transitions with timestamps and role-based checks
    if (data.status) {
      updateData.status = data.status;

      // Role-based checks for specific transitions
      if (["verified", "verifying"].includes(data.status)) {
        requirePermission(session, "cases:verify");
        if (data.status === "verified") {
          updateData.verifiedAt = new Date();
          updateData.verifiedBy = session.userId;
        }
      } else if (data.status === "approved") {
        requirePermission(session, "cases:approve");
        if (data.status === "approved") {
          updateData.approvedAt = new Date();
          updateData.approvedBy = session.userId;
        }
      } else if (["disbursing", "disbursed"].includes(data.status)) {
        requirePermission(session, "cases:disburse");
      } else {
        requirePermission(session, "cases:update");
      }
      if (data.status === "closed") {
        updateData.closedAt = new Date();
      }
      if (data.status === "follow_up") {
        updateData.followUpDate = data.followUpDate ? new Date(data.followUpDate) : new Date();
      }
      if (data.status === "rejected") {
        if (!data.rejectionReason) {
          return apiError("Sebab penolakan diperlukan", 422);
        }
      }
    }

    if (data.verificationScore !== undefined) updateData.verificationScore = data.verificationScore;

    const updated = await db.case.update({
      where: { id },
      data: updateData,
      include: {
        programme: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, name: true, role: true } },
        verifier: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    // Auto-create status change note
    if (data.status && data.status !== existing.status) {
      const noteMessages: Record<string, string> = {
        submitted: `Kes dihantar untuk verifikasi oleh ${session.name}.`,
        verifying: `Proses verifikasi dimulakan oleh ${session.name}.`,
        verified: `Kes disahkan oleh ${session.name}.`,
        scoring: `Penilaian dimulakan oleh ${session.name}.`,
        scored: `Penilaian selesai oleh ${session.name}. Skor: ${data.verificationScore ?? "N/A"}/100.`,
        approved: `Kes diluluskan oleh ${session.name}.`,
        disbursing: `Proses pengagihan dimulakan oleh ${session.name}.`,
        disbursed: `Pengagihan telah dilengkapkan.`,
        follow_up: `Kes memerlukan susulan. Tarikh susulan: ${data.followUpDate ? new Date(data.followUpDate).toLocaleDateString("ms-MY") : "N/A"}.`,
        closed: `Kes ditutup oleh ${session.name}.`,
        rejected: `Kes ditolak oleh ${session.name}. Sebab: ${data.rejectionReason}`,
      };

      await db.caseNote.create({
        data: {
          caseId: id,
          authorId: session.userId,
          type: "status_change",
          content: noteMessages[data.status] ?? `Status diubah ke '${data.status}' oleh ${session.name}.`,
        },
      });
    }

    // Audit log
    await createAuditLog({
      userId: session.userId,
      action: data.status !== existing.status ? "status_change" : "update",
      entity: "case",
      entityId: id,
      details: { from: existing.status, to: data.status ?? existing.status, fields: Object.keys(data) },
      ipAddress: getClientIp(request),
    });

    return apiSuccess(updated, "Kes berjaya dikemaskini");
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CASES] PATCH error:", error);
    return apiError("Gagal mengemaskini kes", 500);
  }
}

// DELETE /api/v1/cases/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "cases:delete");
    const { id } = await params;

    const existing = await db.case.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Kes tidak dijumpai");

    if (!["draft", "submitted", "rejected"].includes(existing.status)) {
      return apiError("Hanya kes dalam draf/hantaran/ditolak boleh dipadam", 422);
    }

    await db.case.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      entity: "case",
      entityId: id,
      details: { caseNumber: existing.caseNumber },
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ message: "Kes berjaya dipadam" });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CASES] DELETE error:", error);
    return apiError("Gagal memadam kes", 500);
  }
}
