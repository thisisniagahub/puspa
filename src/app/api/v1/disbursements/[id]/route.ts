import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-response";
import { disbursementUpdateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { buildOpenClawEvent, sendOpenClawWebhook } from "@/lib/openclaw-webhook";
import { NextRequest } from "next/server";

// GET /api/v1/disbursements/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "disbursements:read");
    const { id } = await params;

    const disbursement = await db.disbursement.findUnique({
      where: { id },
      include: {
        case: { select: { id: true, caseNumber: true, applicantName: true, status: true } },
        programme: { select: { id: true, name: true, code: true } },
        approver: { select: { id: true, name: true } },
        processor: { select: { id: true, name: true } },
      },
    });

    if (!disbursement) return apiNotFound("Pengagihan tidak dijumpai");
    return apiSuccess(disbursement);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DISBURSEMENTS] GET by ID error:", error);
    return apiError("Gagal memuatkan pengagihan", 500);
  }
}

// PATCH /api/v1/disbursements/[id] — Update disbursement (status transitions)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "disbursements:update");
    const { id } = await params;

    const existing = await db.disbursement.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Pengagihan tidak dijumpai");

    const body = await request.json();
    const parsed = disbursementUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        if (key === "scheduledDate" && typeof value === "string") {
          updateData[key] = new Date(value);
        } else {
          updateData[key] = value;
        }
      }
    }

    // Status transition logic
    if (parsed.data.status && parsed.data.status !== existing.status) {
      const validTransitions: Record<string, string[]> = {
        pending: ["approved", "cancelled"],
        approved: ["processing", "cancelled"],
        processing: ["completed", "failed"],
        completed: [],
        failed: ["pending"],
        cancelled: [],
      };

      if (!validTransitions[existing.status]?.includes(parsed.data.status)) {
        return apiError(
          `Transisi '${existing.status}' → '${parsed.data.status}' tidak dibenarkan`,
          422
        );
      }

      // Auto-set processedBy when completed
      if (parsed.data.status === "completed") {
        updateData.processedBy = session.userId;
        updateData.processedDate = new Date();
      }
    }

    const updated = await db.disbursement.update({
      where: { id },
      data: updateData,
      include: {
        case: { select: { id: true, caseNumber: true, applicantName: true } },
        programme: { select: { id: true, name: true, code: true } },
        approver: { select: { id: true, name: true } },
        processor: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      entity: "disbursement",
      entityId: id,
      details: { from: existing.status, to: parsed.data.status, amount: existing.amount },
      ipAddress: getClientIp(request),
    });

    if (parsed.data.status && parsed.data.status !== existing.status) {
      await sendOpenClawWebhook(buildOpenClawEvent({
        source: "puspa",
        eventType: parsed.data.status === "completed" ? "disbursement_completed" : "disbursement_status_changed",
        occurredAt: new Date().toISOString(),
        entity: "disbursement",
        entityId: id,
        actor: { userId: session.userId, name: session.name, role: session.role },
        data: {
          disbursementNumber: updated.disbursementNumber,
          amount: updated.amount,
          fromStatus: existing.status,
          toStatus: parsed.data.status,
          recipientName: updated.recipientName,
          caseNumber: updated.case?.caseNumber ?? null,
          programmeName: updated.programme?.name ?? null,
          processedDate: updated.processedDate ? new Date(updated.processedDate).toISOString() : null,
        },
      }));
    }

    return apiSuccess(updated, "Pengagihan berjaya dikemaskini");
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DISBURSEMENTS] PATCH error:", error);
    return apiError("Gagal mengemaskini pengagihan", 500);
  }
}

// DELETE /api/v1/disbursements/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "disbursements:approve"); // Only admin
    const { id } = await params;

    const existing = await db.disbursement.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Pengagihan tidak dijumpai");

    // Only pending/cancelled can be deleted
    if (!["pending", "cancelled"].includes(existing.status)) {
      return apiError("Hanya pengagihan menunggu/dibatalkan boleh dipadam", 422);
    }

    await db.disbursement.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      entity: "disbursement",
      entityId: id,
      details: { disbursementNumber: existing.disbursementNumber, amount: existing.amount },
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ message: "Pengagihan berjaya dipadam" });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DISBURSEMENTS] DELETE error:", error);
    return apiError("Gagal memadam pengagihan", 500);
  }
}
