import { db } from "@/lib/db";
import { apiSuccess, apiError, apiNotFound } from "@/lib/api-response";
import { caseUpdateSchema } from "@/lib/validators";
import { createAuditLog, getClientIp } from "@/lib/audit";
import { canTransitionCase } from "@/lib/auth";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { buildOpenClawEvent, sendOpenClawWebhook } from "@/lib/openclaw-webhook";
import { NextRequest } from "next/server";

function safeLower(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

function buildCaseNextAction(status: string, context: {
  hasDocuments: boolean;
  hasDisbursement: boolean;
  hasCompletedDisbursement: boolean;
  verificationScore?: number | null;
}) {
  switch (status) {
    case "draft":
      return {
        title: "Lengkapkan intake dan hantar kes",
        description: "Semak maklumat pemohon, pastikan saluran komunikasi wujud, kemudian hantar untuk verifikasi.",
        urgency: "medium",
      };
    case "submitted":
      return {
        title: "Mulakan verifikasi",
        description: context.hasDocuments
          ? "Dokumen sudah ada. Ops boleh terus mula verifikasi dan sahkan butiran kes."
          : "Minta atau muat naik dokumen sokongan sebelum verifikasi untuk kurangkan rework.",
        urgency: "high",
      };
    case "verifying":
      return {
        title: "Tutup jurang verifikasi",
        description: context.hasDocuments
          ? "Lengkapkan semakan terakhir dan gerakkan kes ke status verified."
          : "Dokumen masih kurang. Lengkapkan bukti sebelum sahkan kes.",
        urgency: "high",
      };
    case "verified":
      return {
        title: "Teruskan ke penilaian",
        description: "Kes sudah verified. Isi skor penilaian untuk bantu keputusan kelulusan lebih cepat.",
        urgency: "medium",
      };
    case "scoring":
      return {
        title: "Masukkan skor penilaian",
        description: "Penilaian sedang berjalan. Simpan skor 0-100 supaya kes boleh masuk ke approval lane.",
        urgency: "medium",
      };
    case "scored":
      return {
        title: "Buat keputusan kelulusan",
        description: context.verificationScore !== null && context.verificationScore !== undefined
          ? `Kes ini sudah dinilai pada ${context.verificationScore}/100. Admin boleh luluskan atau tolak dengan sebab yang jelas.`
          : "Skor belum jelas. Semak semula justifikasi sebelum membuat keputusan kelulusan.",
        urgency: "high",
      };
    case "approved":
      return {
        title: "Cipta pengagihan",
        description: context.hasDisbursement
          ? "Pengagihan sudah wujud. Finance boleh terus gerakkan payout ke processing/completed."
          : "Finance patut cipta pengagihan daripada kes ini untuk elakkan approval tergantung tanpa payout.",
        urgency: "high",
      };
    case "disbursing":
      return {
        title: "Lengkapkan payout dan rekonsiliasi",
        description: context.hasCompletedDisbursement
          ? "Payout nampak sudah lengkap. Pastikan status kes ikut ditutup atau masuk susulan."
          : "Pantau status pengagihan sampai completed dan simpan bukti transaksi bila ada.",
        urgency: "high",
      };
    case "disbursed":
      return {
        title: "Tentukan susulan atau tutup",
        description: "Kes sudah diagihkan. Tentukan sama ada perlu follow-up outcome atau boleh ditutup.",
        urgency: "medium",
      };
    case "follow_up":
      return {
        title: "Jalankan follow-up outcome",
        description: "Hubungi penerima, semak impak bantuan, dan tentukan sama ada kes patut ditutup atau perlu bantuan tambahan.",
        urgency: "medium",
      };
    case "rejected":
      return {
        title: "Simpan justifikasi dengan kemas",
        description: "Pastikan sebab penolakan cukup jelas untuk audit trail dan rujukan masa depan.",
        urgency: "low",
      };
    default:
      return {
        title: "Semak status kes",
        description: "Pastikan langkah seterusnya jelas untuk elakkan kes tergantung tanpa tindakan.",
        urgency: "low",
      };
  }
}

// GET /api/v1/cases/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireAuth(_request);
    requirePermission(session, "cases:read");
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
          include: { author: { select: { id: true, name: true, role: true } } },
          take: 50,
        },
        disbursements: {
          orderBy: { createdAt: "desc" },
          include: {
            processor: { select: { id: true, name: true } },
          },
        },
        documents: { orderBy: { createdAt: "desc" } },
        donations: { orderBy: { date: "desc" }, take: 10 },
        _count: { select: { caseNotes: true, disbursements: true, documents: true } },
      },
    });

    if (!caseData) return apiNotFound("Kes tidak dijumpai");

    // Calculate disbursement totals
    const totalDisbursed = caseData.disbursements
      .filter(d => d.status === "completed")
      .reduce((sum, d) => sum + d.amount, 0);

    const normalizedPhone = safeLower(caseData.applicantPhone);
    const normalizedAddress = safeLower(caseData.applicantAddress);

    const [sameIcCases, samePhoneCases, sameAddressCases, activeCasesForApplicant, relatedProgrammes] = await Promise.all([
      db.case.findMany({
        where: { id: { not: id }, applicantIc: caseData.applicantIc },
        select: { id: true, caseNumber: true, status: true, createdAt: true, updatedAt: true, applicantName: true, priority: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      normalizedPhone
        ? db.case.findMany({
            where: {
              id: { not: id },
              applicantPhone: caseData.applicantPhone,
            },
            select: { id: true, caseNumber: true, status: true, createdAt: true, updatedAt: true, applicantName: true, priority: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : Promise.resolve([]),
      normalizedAddress
        ? db.case.findMany({
            where: {
              id: { not: id },
              applicantAddress: caseData.applicantAddress,
            },
            select: { id: true, caseNumber: true, status: true, createdAt: true, updatedAt: true, applicantName: true, priority: true },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : Promise.resolve([]),
      db.case.count({
        where: {
          id: { not: id },
          applicantIc: caseData.applicantIc,
          status: { in: ["draft", "submitted", "verifying", "verified", "scoring", "scored", "approved", "disbursing", "follow_up"] },
        },
      }),
      db.programme.findMany({
        where: {
          status: "active",
          OR: [
            { category: caseData.category },
            caseData.programmeId ? { id: caseData.programmeId } : undefined,
          ].filter(Boolean) as { category?: string; id?: string }[],
        },
        select: { id: true, name: true, code: true, category: true, totalBudget: true, totalSpent: true },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
    ]);

    const relatedCasesMap = new Map<string, {
      id: string;
      caseNumber: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      applicantName: string;
      priority: string;
      matchReasons: string[];
    }>();

    for (const item of sameIcCases) {
      relatedCasesMap.set(item.id, { ...item, matchReasons: ["IC sama"] });
    }
    for (const item of samePhoneCases) {
      const existingRelated = relatedCasesMap.get(item.id);
      if (existingRelated) existingRelated.matchReasons.push("Telefon sama");
      else relatedCasesMap.set(item.id, { ...item, matchReasons: ["Telefon sama"] });
    }
    for (const item of sameAddressCases) {
      const existingRelated = relatedCasesMap.get(item.id);
      if (existingRelated) existingRelated.matchReasons.push("Alamat sama");
      else relatedCasesMap.set(item.id, { ...item, matchReasons: ["Alamat sama"] });
    }

    const relatedCases = Array.from(relatedCasesMap.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6);

    const hasDocuments = (caseData._count?.documents ?? 0) > 0;
    const hasDisbursement = (caseData._count?.disbursements ?? 0) > 0;
    const hasCompletedDisbursement = caseData.disbursements.some(d => d.status === "completed");
    const totalPastCases = sameIcCases.length;
    const recentRelatedCase = relatedCases[0];
    const duplicateSignalCount = [samePhoneCases.length > 0, sameAddressCases.length > 0].filter(Boolean).length;

    const riskFlags: { level: "low" | "medium" | "high"; title: string; description: string }[] = [];

    if (!caseData.applicantPhone) {
      riskFlags.push({
        level: "medium",
        title: "Saluran komunikasi tidak lengkap",
        description: "Tiada nombor telefon pada kes ini. Follow-up akan jadi lebih lambat jika bantuan perlu disahkan semula.",
      });
    }
    if (!hasDocuments && ["submitted", "verifying", "verified", "scoring", "scored", "approved"].includes(caseData.status)) {
      riskFlags.push({
        level: "high",
        title: "Dokumen sokongan masih tiada",
        description: "Kes sudah bergerak dalam pipeline tetapi belum ada dokumen direkodkan. Ini berisiko untuk audit dan rework.",
      });
    }
    if (activeCasesForApplicant > 0) {
      riskFlags.push({
        level: "high",
        title: "Pemohon ada kes aktif lain",
        description: `Terdapat ${activeCasesForApplicant} kes aktif lain untuk IC yang sama. Ops perlu semak sama ada bantuan bertindih atau memang kes susulan yang sah.`,
      });
    }
    if (duplicateSignalCount > 0) {
      riskFlags.push({
        level: duplicateSignalCount > 1 ? "high" : "medium",
        title: "Signal pertindihan dikesan",
        description: `Dijumpai padanan pada ${duplicateSignalCount > 1 ? "telefon dan alamat" : samePhoneCases.length > 0 ? "telefon" : "alamat"} dengan kes lain. Perlu semak hubungan isi rumah atau duplicate intake.`,
      });
    }
    if ((caseData.monthlyIncome ?? 0) <= 1200 && (caseData.householdSize ?? 0) >= 5) {
      riskFlags.push({
        level: "medium",
        title: "Tekanan kewangan isi rumah tinggi",
        description: `Pendapatan ${caseData.monthlyIncome} dengan ${caseData.householdSize} isi rumah menunjukkan tekanan bantuan yang tinggi dan wajar diprioritikan.`,
      });
    }
    if (caseData.verificationScore !== null && caseData.verificationScore !== undefined && caseData.verificationScore < 50 && ["scored", "approved", "disbursing"].includes(caseData.status)) {
      riskFlags.push({
        level: "medium",
        title: "Skor penilaian rendah",
        description: `Skor ${caseData.verificationScore}/100 rendah berbanding threshold biasa. Semak semula justifikasi jika kes ini diteruskan.`,
      });
    }

    const householdPressureScore = Math.max(0, Math.min(100,
      Math.round(((caseData.householdSize * 12) - Math.min(caseData.monthlyIncome / 60, 40)) + (caseData.priority === "urgent" ? 20 : caseData.priority === "high" ? 10 : 0))
    ));

    const intelligence = {
      nextAction: buildCaseNextAction(caseData.status, {
        hasDocuments,
        hasDisbursement,
        hasCompletedDisbursement,
        verificationScore: caseData.verificationScore,
      }),
      beneficiary360: {
        totalPastCases,
        activeCasesForApplicant,
        totalDisbursed,
        totalDisbursementCount: caseData.disbursements.length,
        lastDisbursementAt: caseData.disbursements[0]?.processedDate ?? caseData.disbursements[0]?.createdAt ?? null,
        totalNotes: caseData._count?.caseNotes ?? 0,
        hasDocuments,
        householdPressureScore,
      },
      riskFlags,
      relatedCases,
      recommendations: relatedProgrammes.map(programme => ({
        id: programme.id,
        name: programme.name,
        code: programme.code,
        reason: programme.category === caseData.category
          ? "Program aktif dalam kategori yang sama"
          : "Program semasa yang sudah dikaitkan dengan kes ini",
        remainingBudget: Math.max(0, (programme.totalBudget ?? 0) - (programme.totalSpent ?? 0)),
      })),
      quickSignals: {
        duplicatePhoneMatches: samePhoneCases.length,
        duplicateAddressMatches: sameAddressCases.length,
        recentRelatedCaseNumber: recentRelatedCase?.caseNumber ?? null,
      },
    };

    return apiSuccess({ ...caseData, totalDisbursed, intelligence });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
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
    const session = requireAuth(request);
    const { id } = await params;

    const existing = await db.case.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Kes tidak dijumpai");

    const body = await request.json();
    const parsed = caseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Data tidak sah", 422);
    }

    const data = parsed.data;
    const hasStatusChange = Boolean(data.status && data.status !== existing.status);
    const hasGeneralFieldUpdate = Object.entries(data).some(([key, value]) => {
      if (value === undefined) return false;
      return !["status", "verificationScore", "rejectionReason", "followUpDate"].includes(key);
    });

    if (hasGeneralFieldUpdate || !hasStatusChange) {
      requirePermission(session, "cases:update");
    }

    // Status transition validation
    if (data.status && data.status !== existing.status) {
      if (!canTransitionCase(existing.status, data.status)) {
        const validTransitions = [
          "draft", "submitted", "verifying", "verified", "scoring", "scored",
          "approved", "disbursing", "disbursed", "follow_up", "closed", "rejected",
        ].filter(s => canTransitionCase(existing.status, s));
        return apiError(
          `Transisi '${existing.status}' → '${data.status}' tidak dibenarkan. Sah: [${validTransitions.join(", ")}]`,
          422
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== "status") {
        updateData[key] = value;
      }
    }

    // Handle status transitions with timestamps and role-based checks
    if (data.status) {
      updateData.status = data.status;

      // Role-based checks for specific transitions
      if (["verified", "verifying"].includes(data.status)) {
        requirePermission(session, "cases:verify");
        if (data.status === "verified") {
          updateData.verifiedAt = new Date();
          updateData.verifiedBy = session.userId;
        }
      } else if (data.status === "approved") {
        requirePermission(session, "cases:approve");
        if (data.status === "approved") {
          updateData.approvedAt = new Date();
          updateData.approvedBy = session.userId;
        }
      } else if (["disbursing", "disbursed"].includes(data.status)) {
        requirePermission(session, "cases:disburse");
      } else {
        requirePermission(session, "cases:update");
      }
      if (data.status === "closed") {
        updateData.closedAt = new Date();
      }
      if (data.status === "follow_up") {
        updateData.followUpDate = data.followUpDate ? new Date(data.followUpDate) : new Date();
      }
      if (data.status === "rejected") {
        if (!data.rejectionReason) {
          return apiError("Sebab penolakan diperlukan", 422);
        }
      }
    }

    if (data.verificationScore !== undefined) updateData.verificationScore = data.verificationScore;

    const updated = await db.case.update({
      where: { id },
      data: updateData,
      include: {
        programme: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, name: true, role: true } },
        verifier: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    // Auto-create status change note
    if (data.status && data.status !== existing.status) {
      const noteMessages: Record<string, string> = {
        submitted: `Kes dihantar untuk verifikasi oleh ${session.name}.`,
        verifying: `Proses verifikasi dimulakan oleh ${session.name}.`,
        verified: `Kes disahkan oleh ${session.name}.`,
        scoring: `Penilaian dimulakan oleh ${session.name}.`,
        scored: `Penilaian selesai oleh ${session.name}. Skor: ${data.verificationScore ?? "N/A"}/100.`,
        approved: `Kes diluluskan oleh ${session.name}.`,
        disbursing: `Proses pengagihan dimulakan oleh ${session.name}.`,
        disbursed: `Pengagihan telah dilengkapkan.`,
        follow_up: `Kes memerlukan susulan. Tarikh susulan: ${data.followUpDate ? new Date(data.followUpDate).toLocaleDateString("ms-MY") : "N/A"}.`,
        closed: `Kes ditutup oleh ${session.name}.`,
        rejected: `Kes ditolak oleh ${session.name}. Sebab: ${data.rejectionReason}`,
      };

      await db.caseNote.create({
        data: {
          caseId: id,
          authorId: session.userId,
          type: "status_change",
          content: noteMessages[data.status] ?? `Status diubah ke '${data.status}' oleh ${session.name}.`,
        },
      });
    }

    // Audit log
    await createAuditLog({
      userId: session.userId,
      action: data.status !== existing.status ? "status_change" : "update",
      entity: "case",
      entityId: id,
      details: { from: existing.status, to: data.status ?? existing.status, fields: Object.keys(data) },
      ipAddress: getClientIp(request),
    });

    if (data.status && data.status !== existing.status) {
      await sendOpenClawWebhook(buildOpenClawEvent({
        schemaVersion: "1",
        correlationId: globalThis.crypto?.randomUUID?.() ?? undefined,
        source: "puspa",
        eventType: "case_status_changed",
        occurredAt: new Date().toISOString(),
        entity: "case",
        entityId: id,
        actor: { userId: session.userId, name: session.name, role: session.role },
        data: {
          caseNumber: updated.caseNumber,
          applicantName: updated.applicantName,
          fromStatus: existing.status,
          toStatus: data.status,
          verificationScore: data.verificationScore ?? updated.verificationScore ?? null,
          rejectionReason: data.rejectionReason ?? null,
          programmeName: updated.programme?.name ?? null,
        },
      }));
    }

    return apiSuccess(updated, "Kes berjaya dikemaskini");
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
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
    const session = requireAuth(request);
    requirePermission(session, "cases:delete");
    const { id } = await params;

    const existing = await db.case.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Kes tidak dijumpai");

    if (!["draft", "submitted", "rejected"].includes(existing.status)) {
      return apiError("Hanya kes dalam draf/hantaran/ditolak boleh dipadam", 422);
    }

    await db.case.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      entity: "case",
      entityId: id,
      details: { caseNumber: existing.caseNumber },
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ message: "Kes berjaya dipadam" });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[CASES] DELETE error:", error);
    return apiError("Gagal memadam kes", 500);
  }
}
