import { db } from "@/lib/db";
import { apiSuccess, apiError, getPaginationParams, buildPagination } from "@/lib/api-response";
import { userUpdateSchema } from "@/lib/validators";
import { getAuthSession, requireAuth, requirePermission } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { NextRequest } from "next/server";

// GET /api/v1/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "users:read");

    const { page, limit, skip } = getPaginationParams(request);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, name: true, role: true, avatar: true,
          isActive: true, lastLogin: true, createdAt: true,
          _count: { select: { auditLogs: true, caseNotes: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    return apiSuccess(users, {
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Sesi tidak sah") || error instanceof Error && error.message.includes("Tiada kebenaran")) {
      return apiError(error.message, error.message.includes("Sesi") ? 401 : 403);
    }
    console.error("[USERS] GET error:", error);
    return apiError("Gagal memuatkan senarai pengguna", 500);
  }
}

// PATCH /api/v1/users/[id] handled in [id]/route.ts
// POST /api/v1/users - handled by auth/register (admin only)
