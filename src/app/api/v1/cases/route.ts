import { db } from "@/lib/db";
import { apiSuccess, apiError, getPaginationParams, buildPagination } from "@/lib/api-response";
import { caseCreateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { buildOpenClawEvent, sendOpenClawWebhook } from "@/lib/openclaw-webhook";
import { NextRequest } from "next/server";

// GET /api/v1/cases - List cases with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "cases:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request);

    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const programmeId = searchParams.get("programmeId");
    const assignedTo = searchParams.get("assignedTo");
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { caseNumber: { contains: search } },
        { applicantName: { contains: search } },
        { applicantIc: { contains: search } },
        { title: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (programmeId) where.programmeId = programmeId;
    if (assignedTo) where.assignedTo = assignedTo;

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [cases, total] = await Promise.all([
      db.case.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          programme: { select: { id: true, name: true, code: true } },
          assignee: { select: { id: true, name: true, role: true } },
          verifier: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          _count: { select: { caseNotes: true, disbursements: true, documents: true } },
        },
      }),
      db.case.count({ where }),
    ]);

    return apiSuccess(cases, {
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CASES] GET error:", error);
    return apiError("Gagal memuatkan senarai kes", 500);
  }
}

// POST /api/v1/cases - Create new case
export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "cases:create");

    const body = await request.json();
    const parsed = caseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const data = parsed.data;

    // Check IC uniqueness
    const existing = await db.case.findUnique({ where: { applicantIc: data.applicantIc } });
    if (existing) return apiError("No. IC sudah wujud dalam sistem", 409);

    // If programmeId is provided, verify it exists
    if (data.programmeId) {
      const programme = await db.programme.findUnique({ where: { id: data.programmeId } });
      if (!programme) return apiError("Program tidak dijumpai", 404);
    }

    // Generate case number: CS-YYYY-XXXX
    const year = new Date().getFullYear();
    const caseCount = await db.case.count({
      where: { caseNumber: { startsWith: `CS-${year}` } },
    });
    const caseNumber = `CS-${year}-${String(caseCount + 1).padStart(4, "0")}`;

    const status = data.submitLater ? "draft" : "submitted";

    const newCase = await db.case.create({
      data: {
        caseNumber,
        title: data.title ?? `Kes ${data.applicantName}`,
        description: data.description,
        status,
        priority: data.priority,
        category: data.category,
        subcategory: data.subcategory,
        applicantName: data.applicantName,
        applicantIc: data.applicantIc,
        applicantPhone: data.applicantPhone,
        applicantEmail: data.applicantEmail || null,
        applicantAddress: data.applicantAddress,
        householdSize: data.householdSize,
        monthlyIncome: data.monthlyIncome,
        programmeId: data.programmeId,
        notes: data.notes,
        assignedTo: session.userId, // Auto-assign to creator
      },
      include: {
        programme: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, name: true, role: true } },
      },
    });

    // Create initial case note
    await db.caseNote.create({
      data: {
        caseId: newCase.id,
        authorId: session.userId,
        type: "system",
        content: status === "submitted"
          ? `Kes ${caseNumber} berjaya dicipta dan dihantar untuk verifikasi.`
          : `Kes ${caseNumber} berjaya dicipta sebagai draf.`,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      entity: "case",
      entityId: newCase.id,
      details: { caseNumber, applicantName: data.applicantName, status },
      ipAddress: getClientIp(request),
    });

    await sendOpenClawWebhook(buildOpenClawEvent({
      schemaVersion: "1",
      correlationId: globalThis.crypto?.randomUUID?.() ?? undefined,
      source: "puspa",
      eventType: "case_created",
      occurredAt: new Date().toISOString(),
      entity: "case",
      entityId: newCase.id,
      actor: { userId: session.userId, name: session.name, role: session.role },
      data: {
        caseNumber: newCase.caseNumber,
        status: newCase.status,
        applicantName: newCase.applicantName,
        priority: newCase.priority,
        category: newCase.category,
        programmeName: newCase.programme?.name ?? null,
      },
    }));

    return apiSuccess(newCase, { status: 201, message: "Kes berjaya dicipta" });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CASES] POST error:", error);
    return apiError("Gagal mencipta kes", 500);
  }
}
