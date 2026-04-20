import { db } from "@/lib/db";

type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "status_change" | "export" | "import";
type AuditEntity = "case" | "donation" | "disbursement" | "programme" | "user" | "document";

interface CreateAuditLogInput {
  userId?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        details: input.details ? JSON.stringify(input.details) : undefined,
        ipAddress: input.ipAddress,
      },
    });
  } catch (error) {
    // Audit logging should never crash the app
    console.error("[AUDIT] Failed to write audit log:", error);
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}
