import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-response";
import { disbursementUpdateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { buildOpenClawEvent, sendOpenClawWebhook } from "@/lib/openclaw-webhook";
import { NextRequest } from "next/server";

async function syncCaseAfterDisbursementStatusChange(params: {
  caseId: string;
  caseNumber: string;
  currentCaseStatus: string;
  disbursementNumber: string;
  fromStatus: string;
  toStatus: string;
  actor: { userId: string; name: string; role: string };
}) {
  const { caseId, caseNumber, currentCaseStatus, disbursementNumber, fromStatus, toStatus, actor } = params;

  await db.caseNote.create({
    data: {
      caseId,
      authorId: actor.userId,
      type: "status_change",
      content: `Status pengagihan ${disbursementNumber} berubah daripada ${fromStatus} kepada ${toStatus} oleh ${actor.name}.`,
    },
  });

  if (toStatus !== "completed") {
    return;
  }

  if (currentCaseStatus === "disbursed") {
    return;
  }

  const updatedCase = await db.case.update({
    where: { id: caseId },
    data: { status: "disbursed" },
    select: { id: true, caseNumber: true, applicantName: true },
  });

  await db.caseNote.create({
    data: {
      caseId,
      authorId: actor.userId,
      type: "status_change",
      content: `Kes ${caseNumber} ditandakan sebagai selesai diagihkan selepas pengagihan ${disbursementNumber} disiapkan.`,
    },
  });

  await sendOpenClawWebhook(buildOpenClawEvent({
    source: "puspa",
    eventType: "case_status_changed",
    occurredAt: new Date().toISOString(),
    entity: "case",
    entityId: updatedCase.id,
    actor,
    data: {
      caseNumber: updatedCase.caseNumber,
      applicantName: updatedCase.applicantName,
      fromStatus: currentCaseStatus,
      toStatus: "disbursed",
      verificationScore: null,
      rejectionReason: null,
      programmeName: null,
    },
  }));
}

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

    const existing = await db.disbursement.findUnique({
      where: { id },
      include: { case: { select: { id: true, caseNumber: true, status: true } } },
    });
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

      const nextMethod = typeof updateData.method === "string" ? updateData.method : existing.method;
      const nextBankName = typeof updateData.bankName === "string" ? updateData.bankName : existing.bankName;
      const nextAccountNumber = typeof updateData.accountNumber === "string" ? updateData.accountNumber : existing.accountNumber;
      const nextAccountHolder = typeof updateData.accountHolder === "string" ? updateData.accountHolder : existing.accountHolder;
      const nextRecipientName = typeof updateData.recipientName === "string" ? updateData.recipientName : existing.recipientName;
      const nextRecipientIc = typeof updateData.recipientIc === "string" ? updateData.recipientIc : existing.recipientIc;
      const nextPurpose = typeof updateData.purpose === "string" ? updateData.purpose : existing.purpose;

      if (["processing", "completed"].includes(parsed.data.status)) {
        if (!nextRecipientName?.trim() || !nextRecipientIc?.trim() || !nextPurpose?.trim()) {
          return apiError("Nama penerima, IC penerima, dan tujuan mesti lengkap sebelum pengagihan diproses", 422);
        }

        if (nextMethod === "bank_transfer" && (!nextBankName?.trim() || !nextAccountNumber?.trim() || !nextAccountHolder?.trim())) {
          return apiError("Maklumat bank mesti lengkap sebelum pindahan bank diproses", 422);
        }
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
      if (updated.case) {
        await syncCaseAfterDisbursementStatusChange({
          caseId: updated.case.id,
          caseNumber: updated.case.caseNumber,
          currentCaseStatus: existing.case?.status ?? "approved",
          disbursementNumber: updated.disbursementNumber,
          fromStatus: existing.status,
          toStatus: parsed.data.status,
          actor: { userId: session.userId, name: session.name, role: session.role },
        });
      }

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
