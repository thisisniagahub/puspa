import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-response";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { canTransitionCase } from "@/lib/auth";
import { NextRequest } from "next/server";

// GET /api/v1/cases/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseData = await db.case.findUnique({
      where: { id },
      include: {
        programme: true,
        assignee: { select: { id: true, name: true, role: true } },
        verifier: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        caseNotes: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, name: true } } },
          take: 20,
        },
        disbursements: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        _count: { select: { caseNotes: true, disbursements: true, documents: true } },
      },
    });

    if (!caseData) return apiNotFound("Kes tidak dijumpai");

    return apiSuccess(caseData);
  } catch (error) {
    console.error("[CASES] GET by ID error:", error);
    return apiError("Gagal memuatkan kes", 500);
  }
}

// PATCH /api/v1/cases/[id] - Update case (supports status transitions)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.case.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Kes tidak dijumpai");

    const body = await request.json();

    // Status transition validation
    if (body.status && body.status !== existing.status) {
      if (!canTransitionCase(existing.status, body.status)) {
        const validTransitions = [
          "draft", "submitted", "verifying", "verified", "scoring", "scored",
          "approved", "disbursing", "disbursed", "follow_up", "closed", "rejected",
        ].filter(s => canTransitionCase(existing.status, s));

        return apiError(
          `Transisi status '${existing.status}' → '${body.status}' tidak dibenarkan. Transisi yang sah: ${existing.status} → [${validTransitions.join(", ")}]`,
          422
        );
      }
    }

    // Build update data (only include fields that are provided)
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "title", "description", "priority", "category", "subcategory",
      "applicantName", "applicantPhone", "applicantEmail", "applicantAddress",
      "householdSize", "monthlyIncome", "programmeId", "assignedTo",
      "notes", "metadata", "rejectionReason",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle status transitions with timestamps
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "verified") updateData.verifiedAt = new Date();
      if (body.status === "approved") updateData.approvedAt = new Date();
      if (body.status === "closed") updateData.closedAt = new Date();
      if (body.status === "follow_up") updateData.followUpDate = body.followUpDate ?? new Date();
    }

    // Handle assignment fields
    if (body.verifiedBy) updateData.verifiedBy = body.verifiedBy;
    if (body.approvedBy) updateData.approvedBy = body.approvedBy;
    if (body.verificationScore !== undefined) updateData.verificationScore = body.verificationScore;

    const updated = await db.case.update({
      where: { id },
      data: updateData,
      include: {
        programme: true,
        assignee: { select: { id: true, name: true } },
        verifier: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await createAuditLog({
      userId: body.userId,
      action: body.status !== existing.status ? "status_change" : "update",
      entity: "case",
      entityId: id,
      details: { from: existing.status, to: body.status ?? existing.status, fields: Object.keys(updateData) },
      ipAddress: getClientIp(request),
    });

    return apiSuccess(updated, "Kes berjaya dikemaskini");
  } catch (error) {
    console.error("[CASES] PATCH error:", error);
    return apiError("Gagal mengemaskini kes", 500);
  }
}

// DELETE /api/v1/cases/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.case.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Kes tidak dijumpai");

    // Only draft/submitted/rejected cases can be deleted
    if (!["draft", "submitted", "rejected"].includes(existing.status)) {
      return apiError("Hanya kes dalam draf/hantaran/ditolak boleh dipadam", 422);
    }

    await db.case.delete({ where: { id } });

    await createAuditLog({
      userId: undefined,
      action: "delete",
      entity: "case",
      entityId: id,
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ message: "Kes berjaya dipadam" });
  } catch (error) {
    console.error("[CASES] DELETE error:", error);
    return apiError("Gagal memadam kes", 500);
  }
}
