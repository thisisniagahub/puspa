import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-response";
import { donationUpdateSchema } from "@/lib/validators";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { NextRequest } from "next/server";

// GET /api/v1/donations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "donations:read");
    const { id } = await params;

    const donation = await db.donation.findUnique({
      where: { id },
      include: {
        programme: true,
        case: { select: { id: true, caseNumber: true, applicantName: true } },
      },
    });

    if (!donation) return apiNotFound("Sumbangan tidak dijumpai");
    return apiSuccess(donation);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DONATIONS] GET by ID error:", error);
    return apiError("Gagal memuatkan sumbangan", 500);
  }
}

// PATCH /api/v1/donations/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "donations:update");
    const { id } = await params;

    const existing = await db.donation.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Sumbangan tidak dijumpai");

    const body = await request.json();
    const parsed = donationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) {
        updateData[key] = key === "date" && typeof value === "string" ? new Date(value) : value;
      }
    }

    const updated = await db.donation.update({
      where: { id },
      data: updateData,
      include: {
        programme: { select: { id: true, name: true, code: true } },
        case: { select: { id: true, caseNumber: true, applicantName: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      entity: "donation",
      entityId: id,
      details: { fields: Object.keys(parsed.data), from: existing.status, to: parsed.data.status },
      ipAddress: getClientIp(request),
    });

    return apiSuccess(updated, "Sumbangan berjaya dikemaskini");
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DONATIONS] PATCH error:", error);
    return apiError("Gagal mengemaskini sumbangan", 500);
  }
}

// DELETE /api/v1/donations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "donations:delete");
    const { id } = await params;

    const existing = await db.donation.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Sumbangan tidak dijumpai");

    await db.donation.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      entity: "donation",
      entityId: id,
      details: { donor: existing.donorName, amount: existing.amount },
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ message: "Sumbangan berjaya dipadam" });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[DONATIONS] DELETE error:", error);
    return apiError("Gagal memadam sumbangan", 500);
  }
}
