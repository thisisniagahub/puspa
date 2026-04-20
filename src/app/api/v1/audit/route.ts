import { db } from "@/lib/db";
import { apiSuccess, apiError, getPaginationParams, buildPagination } from "@/lib/api-response";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { NextRequest } from "next/server";

// GET /api/v1/audit - Audit log viewer (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "audit:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request);

    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.createdAt = dateFilter;
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      db.auditLog.count({ where }),
    ]);

    return apiSuccess(logs, {
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[AUDIT] GET error:", error);
    return apiError("Gagal memuatkan log audit", 500);
  }
}
