import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-response";
import { userUpdateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, hashPassword } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { NextRequest } from "next/server";

// GET /api/v1/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "users:read");
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, role: true, avatar: true,
        isActive: true, lastLogin: true, createdAt: true, updatedAt: true,
        _count: { select: { auditLogs: true, caseNotes: true, assignedCases: true } },
      },
    });

    if (!user) return apiNotFound("Pengguna tidak dijumpai");
    return apiSuccess(user);
  } catch (error) {
    if (error instanceof Error && (error.message.includes("Sesi") || error.message.includes("Tiada"))) {
      return apiError(error.message, error.message.includes("Sesi") ? 401 : 403);
    }
    console.error("[USERS] GET by ID error:", error);
    return apiError("Gagal memuatkan pengguna", 500);
  }
}

// PATCH /api/v1/users/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "users:update");
    const { id } = await params;

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Pengguna tidak dijumpai");

    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === undefined) delete updateData[key];
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, name: true, role: true, avatar: true,
        isActive: true, lastLogin: true, createdAt: true, updatedAt: true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      entity: "user",
      entityId: id,
      details: { fields: Object.keys(parsed.data) },
      ipAddress: getClientIp(request),
    });

    return apiSuccess(updated, "Pengguna berjaya dikemaskini");
  } catch (error) {
    if (error instanceof Error && (error.message.includes("Sesi") || error.message.includes("Tiada"))) {
      return apiError(error.message, error.message.includes("Sesi") ? 401 : 403);
    }
    console.error("[USERS] PATCH error:", error);
    return apiError("Gagal mengemaskini pengguna", 500);
  }
}

// DELETE /api/v1/users/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "users:delete");
    const { id } = await params;

    if (id === session.userId) {
      return apiError("Tidak boleh memadam akaun sendiri", 422);
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Pengguna tidak dijumpai");

    await db.user.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      entity: "user",
      entityId: id,
      details: { deletedUser: existing.email },
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ message: "Pengguna berjaya dipadam" });
  } catch (error) {
    if (error instanceof Error && (error.message.includes("Sesi") || error.message.includes("Tiada"))) {
      return apiError(error.message, error.message.includes("Sesi") ? 401 : 403);
    }
    console.error("[USERS] DELETE error:", error);
    return apiError("Gagal memadam pengguna", 500);
  }
}
