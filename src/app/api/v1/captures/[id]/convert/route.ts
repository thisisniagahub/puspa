import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { buildOpenClawEvent, sendOpenClawWebhook } from "@/lib/openclaw-webhook";
import { NextRequest } from "next/server";

function makeCorrelationId() {
  return globalThis.crypto?.randomUUID?.() ?? `cid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// POST /api/v1/captures/[id]/convert
// body: { target: "case" | "donation" | "disbursement" | "note", convertedId?: string }
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "captures:convert");

    const dbAny = db as any;

    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));
    const target = String(body.target ?? "note");
    const convertedId = body.convertedId ? String(body.convertedId) : null;

    const existing = await dbAny.capture.findUnique({ where: { id } });
    if (!existing) return apiError("Capture tidak dijumpai", 404);

    const updated = await dbAny.capture.update({
      where: { id },
      data: {
        status: "converted",
        convertedTo: target,
        convertedId,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      entity: "capture",
      entityId: id,
      details: { convertedTo: target, convertedId },
      ipAddress: getClientIp(request),
    });

    const correlationId = makeCorrelationId();

    await sendOpenClawWebhook(buildOpenClawEvent({
      schemaVersion: "1",
      correlationId,
      source: "puspa",
      eventType: "capture_converted",
      occurredAt: new Date().toISOString(),
      entity: "capture",
      entityId: id,
      actor: { userId: session.userId, name: session.name, role: session.role },
      data: {
        type: updated.type,
        status: updated.status,
        convertedTo: target,
        convertedId,
      },
    }));

    return apiSuccess(updated, { message: "Capture ditanda sebagai converted" });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CAPTURES] convert error:", error);
    return apiError("Gagal convert capture", 500);
  }
}
