import { db } from "@/lib/db";
import { apiSuccess, apiCreated, apiError, getPaginationParams, buildPagination } from "@/lib/api-response";
import { disbursementCreateSchema, disbursementUpdateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { buildOpenClawEvent, sendOpenClawWebhook } from "@/lib/openclaw-webhook";
import { NextRequest } from "next/server";

async function syncCaseAfterDisbursementCreate(caseData: { id: string; status: string; caseNumber: string }, actor: { userId: string; name: string; role: string }) {
  if (!["approved", "follow_up"].includes(caseData.status)) {
    return null;
  }

  const updatedCase = await db.case.update({
    where: { id: caseData.id },
    data: { status: "disbursing" },
    select: { id: true, caseNumber: true, applicantName: true, status: true },
  });

  await db.caseNote.create({
    data: {
      caseId: caseData.id,
      authorId: actor.userId,
      type: "status_change",
      content: `Proses pengagihan dimulakan oleh ${actor.name} selepas rekod pengagihan diwujudkan.`,
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
      fromStatus: caseData.status,
      toStatus: "disbursing",
      verificationScore: null,
      rejectionReason: null,
      programmeName: null,
    },
  }));

  return updatedCase;
}

// GET /api/v1/disbursements — List disbursements
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "disbursements:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request);
    const status = searchParams.get("status");
    const caseId = searchParams.get("caseId");
    const programmeId = searchParams.get("programmeId");
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (caseId) where.caseId = caseId;
    if (programmeId) where.programmeId = programmeId;

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [disbursements, total] = await Promise.all([
      db.disbursement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          case: { select: { id: true, caseNumber: true, applicantName: true, status: true } },
          programme: { select: { id: true, name: true, code: true } },
          approver: { select: { id: true, name: true } },
          processor: { select: { id: true, name: true } },
        },
      }),
      db.disbursement.count({ where }),
    ]);

    return apiSuccess(disbursements, {
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DISBURSEMENTS] GET error:", error);
    return apiError("Gagal memuatkan senarai pengagihan", 500);
  }
}

// POST /api/v1/disbursements — Create disbursement
export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "disbursements:create");

    const body = await request.json();
    const parsed = disbursementCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const data = parsed.data;

    // Verify case exists
    const caseData = await db.case.findUnique({ where: { id: data.caseId } });
    if (!caseData) return apiError("Kes tidak dijumpai", 404);

    // Only approved/disbursing cases can receive disbursements
    if (!["approved", "disbursing", "disbursed", "follow_up"].includes(caseData.status)) {
      return apiError("Hanya kes yang diluluskan boleh menerima pengagihan", 422);
    }

    // Generate disbursement number
    const year = new Date().getFullYear();
    const disbursementCount = await db.disbursement.count({
      where: { disbursementNumber: { startsWith: `DIS-${year}` } },
    });
    const disbursementNumber = `DIS-${year}-${String(disbursementCount + 1).padStart(4, "0")}`;

    const disbursement = await db.disbursement.create({
      data: {
        disbursementNumber,
        caseId: data.caseId,
        programmeId: data.programmeId || caseData.programmeId,
        approvedBy: session.userId,
        amount: data.amount,
        method: data.method,
        status: "pending",
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        accountHolder: data.accountHolder || null,
        recipientName: data.recipientName,
        recipientIc: data.recipientIc,
        recipientPhone: data.recipientPhone || null,
        purpose: data.purpose,
        notes: data.notes || null,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      },
      include: {
        case: { select: { id: true, caseNumber: true, applicantName: true } },
        programme: { select: { id: true, name: true, code: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    await db.caseNote.create({
      data: {
        caseId: caseData.id,
        authorId: session.userId,
        type: "system",
        content: `Rekod pengagihan ${disbursement.disbursementNumber} diwujudkan sebanyak RM${data.amount.toFixed(2)} untuk ${data.recipientName}.`,
      },
    });

    await syncCaseAfterDisbursementCreate(caseData, { userId: session.userId, name: session.name, role: session.role });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      entity: "disbursement",
      entityId: disbursement.id,
      details: { amount: data.amount, caseNumber: caseData.caseNumber },
      ipAddress: getClientIp(request),
    });

    await sendOpenClawWebhook(buildOpenClawEvent({
      schemaVersion: "1",
      correlationId: globalThis.crypto?.randomUUID?.() ?? undefined,
      source: "puspa",
      eventType: "disbursement_created",
      occurredAt: new Date().toISOString(),
      entity: "disbursement",
      entityId: disbursement.id,
      actor: { userId: session.userId, name: session.name, role: session.role },
      data: {
        disbursementNumber: disbursement.disbursementNumber,
        amount: disbursement.amount,
        status: disbursement.status,
        method: disbursement.method,
        recipientName: disbursement.recipientName,
        caseNumber: disbursement.case?.caseNumber ?? null,
        programmeName: disbursement.programme?.name ?? null,
      },
    }));

    return apiCreated(disbursement, "Pengagihan berjaya direkod");
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DISBURSEMENTS] POST error:", error);
    return apiError("Gagal merekod pengagihan", 500);
  }
}
