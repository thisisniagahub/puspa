import { db } from "@/lib/db";
import { apiSuccess, apiCreated, apiError, getPaginationParams, buildPagination } from "@/lib/api-response";
import { programmeCreateSchema, programmeUpdateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { NextRequest } from "next/server";

// GET /api/v1/programmes — List programmes
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "programmes:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [programmes, total] = await Promise.all([
      db.programme.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: { select: { cases: true, donations: true, disbursements: true } },
          creator: { select: { id: true, name: true } },
        },
      }),
      db.programme.count({ where }),
    ]);

    return apiSuccess(programmes, {
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[PROGRAMMES] GET error:", error);
    return apiError("Gagal memuatkan senarai program", 500);
  }
}

// POST /api/v1/programmes — Create programme
export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "programmes:create");

    const body = await request.json();
    const parsed = programmeCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const data = parsed.data;

    // Generate programme code if not provided
    if (!data.code) {
      const count = await db.programme.count();
      data.code = `PG-${String(count + 1).padStart(3, "0")}`;
    }

    const programme = await db.programme.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description || null,
        category: data.category,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location || null,
        targetBeneficiaries: data.targetBeneficiaries,
        totalBudget: data.totalBudget,
        notes: data.notes || null,
        createdBy: session.userId,
      },
      include: {
        _count: { select: { cases: true, donations: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      entity: "programme",
      entityId: programme.id,
      details: { name: data.name, code: data.code },
      ipAddress: getClientIp(request),
    });

    return apiCreated(programme, "Program berjaya dicipta");
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[PROGRAMMES] POST error:", error);
    return apiError("Gagal mencipta program", 500);
  }
}
