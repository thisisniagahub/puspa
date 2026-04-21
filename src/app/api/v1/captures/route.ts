import { db } from "@/lib/db";
import { apiSuccess, apiError, getPaginationParams, buildPagination } from "@/lib/api-response";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { buildOpenClawEvent, sendOpenClawWebhook } from "@/lib/openclaw-webhook";
import { NextRequest } from "next/server";

function makeCorrelationId() {
  return globalThis.crypto?.randomUUID?.() ?? `cid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// GET /api/v1/captures
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "captures:read");

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request);

    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search") ?? "";

    const dbAny = db as any;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { linkUrl: { contains: search } },
      ];
    }

    const [captures, total] = await Promise.all([
      dbAny.capture.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: { select: { id: true, name: true, role: true } },
        },
      }),
      dbAny.capture.count({ where }),
    ]);

    return apiSuccess(captures, {
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CAPTURES] GET error:", error);
    return apiError("Gagal memuatkan capture", 500);
  }
}

// POST /api/v1/captures
export async function POST(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "captures:create");

    const dbAny = db as any;
    const body = await request.json();
    const type = String(body.type ?? "text");

    const capture = await dbAny.capture.create({
      data: {
        type,
        title: body.title ? String(body.title) : null,
        content: body.content ? String(body.content) : null,
        linkUrl: body.linkUrl ? String(body.linkUrl) : null,
        mediaUrl: body.mediaUrl ? String(body.mediaUrl) : null,
        status: "raw",
        createdBy: session.userId,
      },
      include: {
        creator: { select: { id: true, name: true, role: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      entity: "capture",
      entityId: capture.id,
      details: { type: capture.type, title: capture.title },
      ipAddress: getClientIp(request),
    });

    const correlationId = makeCorrelationId();

    await sendOpenClawWebhook(buildOpenClawEvent({
      schemaVersion: "1",
      correlationId,
      source: "puspa",
      eventType: "capture_created",
      occurredAt: new Date().toISOString(),
      entity: "capture",
      entityId: capture.id,
      actor: { userId: session.userId, name: session.name, role: session.role },
      data: {
        type: capture.type,
        title: capture.title,
        hasContent: Boolean(capture.content),
        hasLink: Boolean(capture.linkUrl),
        hasMedia: Boolean(capture.mediaUrl),
      },
    }));

    return apiSuccess(capture, { status: 201, message: "Capture berjaya disimpan" });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CAPTURES] POST error:", error);
    return apiError("Gagal simpan capture", 500);
  }
}
