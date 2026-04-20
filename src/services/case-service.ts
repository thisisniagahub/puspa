// ============================================================
// Case Management Service — Business logic layer for case operations
// Handles complex workflows, auto-transitions, and notifications
// ============================================================

import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { canTransitionCase } from "@/lib/auth";

// ============================================================
// Types
// ============================================================

interface ServiceContext {
  userId: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
}

interface CaseWorkflowResult {
  success: boolean;
  case?: any;
  error?: string;
}

// ============================================================
// Case Service
// ============================================================

export const CaseService = {
  /**
   * Get a single case with full details
   */
  async getCaseById(caseId: string): Promise<CaseWorkflowResult> {
    try {
      const caseData = await db.case.findUnique({
        where: { id: caseId },
        include: {
          programme: { select: { id: true, name: true, code: true } },
          assignee: { select: { id: true, name: true, role: true } },
          verifier: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          caseNotes: {
            orderBy: { createdAt: "desc" },
            include: { author: { select: { id: true, name: true, role: true } } },
            take: 50,
          },
          disbursements: { orderBy: { createdAt: "desc" } },
          documents: { orderBy: { createdAt: "desc" } },
          _count: { select: { caseNotes: true, disbursements: true, documents: true } },
        },
      });

      if (!caseData) {
        return { success: false, error: "Kes tidak dijumpai" };
      }

      return { success: true, case: caseData };
    } catch (error) {
      console.error("[CaseService] getCaseById error:", error);
      return { success: false, error: "Gagal memuatkan kes" };
    }
  },

  /**
   * Advance case through the workflow pipeline
   * draft → submitted → verifying → verified → scoring → scored → approved → disbursing → disbursed → follow_up → closed
   */
  async advanceWorkflow(
    caseId: string,
    newStatus: string,
    ctx: ServiceContext,
    options?: { verificationScore?: number; rejectionReason?: string; followUpDate?: string }
  ): Promise<CaseWorkflowResult> {
    try {
      const existing = await db.case.findUnique({ where: { id: caseId } });
      if (!existing) {
        return { success: false, error: "Kes tidak dijumpai" };
      }

      // Validate transition using rules from auth.ts
      if (!canTransitionCase(existing.status, newStatus)) {
        return { success: false, error: `Transisi '${existing.status}' → '${newStatus}' tidak dibenarkan` };
      }

      const updateData: Record<string, unknown> = { status: newStatus };

      // Set timestamps and responsible users based on transition
      if (newStatus === "verified") {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = ctx.userId;
      }
      if (newStatus === "approved") {
        updateData.approvedAt = new Date();
        updateData.approvedBy = ctx.userId;
      }
      if (newStatus === "closed") {
        updateData.closedAt = new Date();
      }
      if (newStatus === "follow_up") {
        updateData.followUpDate = options?.followUpDate ? new Date(options.followUpDate) : new Date();
      }
      if (newStatus === "rejected" && options?.rejectionReason) {
        updateData.rejectionReason = options.rejectionReason;
      }
      if (options?.verificationScore !== undefined) {
        updateData.verificationScore = options.verificationScore;
      }

      const updated = await db.case.update({
        where: { id: caseId },
        data: updateData,
        include: {
          programme: { select: { id: true, name: true, code: true } },
          assignee: { select: { id: true, name: true, role: true } },
          verifier: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } }
        },
      });

      // Auto-create status change note
      const noteContent = this.getStatusChangeNote(newStatus, ctx.userName, options);
      await db.caseNote.create({
        data: {
          caseId,
          authorId: ctx.userId,
          type: "status_change",
          content: noteContent,
        },
      });

      // Create notification for assignee if someone else changed the case
      if (existing.assignedTo && existing.assignedTo !== ctx.userId) {
        await db.notification.create({
          data: {
            userId: existing.assignedTo,
            type: "case_updated",
            title: `Kes ${existing.caseNumber} dikemaskini`,
            message: `Status diubah dari '${existing.status}' ke '${newStatus}'`,
            actionUrl: `/cases?id=${caseId}`,
          },
        });
      }

      // Audit log
      await createAuditLog({
        userId: ctx.userId,
        action: "status_change",
        entity: "case",
        entityId: caseId,
        details: {
          from: existing.status,
          to: newStatus,
          caseNumber: existing.caseNumber,
        },
        ipAddress: ctx.ipAddress,
      });

      return { success: true, case: updated };
    } catch (error) {
      console.error("[CaseService] advanceWorkflow error:", error);
      return { success: false, error: "Gagal mengemaskini status kes" };
    }
  },

  /**
   * Assign a case to a user
   */
  async assignCase(caseId: string, assigneeId: string, ctx: ServiceContext): Promise<CaseWorkflowResult> {
    try {
      const existing = await db.case.findUnique({ where: { id: caseId } });
      if (!existing) {
        return { success: false, error: "Kes tidak dijumpai" };
      }

      // Verify assignee exists
      const assignee = await db.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, name: true, role: true, isActive: true },
      });
      if (!assignee || !assignee.isActive) {
        return { success: false, error: "Pengguna tidak dijumpai atau tidak aktif" };
      }

      const updated = await db.case.update({
        where: { id: caseId },
        data: { assignedTo: assigneeId },
        include: {
          programme: { select: { id: true, name: true, code: true } },
          assignee: { select: { id: true, name: true, role: true } }
        },
      });

      // Create note
      await db.caseNote.create({
        data: {
          caseId,
          authorId: ctx.userId,
          type: "system",
          content: `Kes diserahkan kepada ${assignee.name} oleh ${ctx.userName}.`,
        },
      });

      // Notify the new assignee
      await db.notification.create({
        data: {
          userId: assigneeId,
          type: "task_assigned",
          title: `Kes ${existing.caseNumber} ditugaskan kepada anda`,
          message: `${ctx.userName} telah menyerahkan kes ${existing.applicantName} kepada anda.`,
          actionUrl: `/cases?id=${caseId}`,
        },
      });

      await createAuditLog({
        userId: ctx.userId,
        action: "update",
        entity: "case",
        entityId: caseId,
        details: { action: "assign", assigneeId, assigneeName: assignee.name },
        ipAddress: ctx.ipAddress,
      });

      return { success: true, case: updated };
    } catch (error) {
      console.error("[CaseService] assignCase error:", error);
      return { success: false, error: "Gagal menyerahkan kes" };
    }
  },

  /**
   * Get case statistics for dashboard
   */
  async getCaseStats() {
    try {
      const [
        totalCases,
        pendingCases,
        activeCases,
        closedCases,
        urgentCases,
        rejectedCases,
        casesByCategory,
        casesByPriority,
        avgVerificationScore,
      ] = await Promise.all([
        db.case.count(),
        db.case.count({ where: { status: { in: ["draft", "submitted", "verifying"] } } }),
        db.case.count({ where: { status: { in: ["verified", "scoring", "scored", "approved", "disbursing", "disbursed", "follow_up"] } } }),
        db.case.count({ where: { status: "closed" } }),
        db.case.count({ where: { priority: "urgent" } }),
        db.case.count({ where: { status: "rejected" } }),
        db.case.groupBy({ by: ["category"], _count: true }),
        db.case.groupBy({ by: ["priority"], _count: true }),
        db.case.aggregate({
          where: { verificationScore: { not: null } },
          _avg: { verificationScore: true },
        }),
      ]);

      return {
        total: totalCases,
        pending: pendingCases,
        active: activeCases,
        closed: closedCases,
        urgent: urgentCases,
        rejected: rejectedCases,
        byCategory: casesByCategory.map(c => ({ category: c.category, count: c._count })),
        byPriority: casesByPriority.map(p => ({ priority: p.priority, count: p._count })),
        avgScore: avgVerificationScore._avg.verificationScore ?? 0,
      };
    } catch (error) {
      console.error("[CaseService] getCaseStats error:", error);
      return null;
    }
  },

  // ============================================================
  // Internal helpers
  // ============================================================

  getStatusChangeNote(status: string, actorName: string, options?: { verificationScore?: number; rejectionReason?: string }): string {
    const messages: Record<string, string> = {
      submitted: `Kes dihantar untuk verifikasi oleh ${actorName}.`,
      verifying: `Proses verifikasi dimulakan oleh ${actorName}.`,
      verified: `Kes disahkan oleh ${actorName}.`,
      scoring: `Penilaian dimulakan oleh ${actorName}.`,
      scored: `Penilaian selesai. Skor: ${options?.verificationScore?.toFixed(1) ?? "N/A"}/100.`,
      approved: `Kes diluluskan oleh ${actorName}.`,
      disbursing: `Proses pengagihan dimulakan oleh ${actorName}.`,
      disbursed: `Pengagihan telah dilengkapkan.`,
      follow_up: `Kes memerlukan susulan.`,
      closed: `Kes ditutup oleh ${actorName}.`,
      rejected: `Kes ditolak oleh ${actorName}. Sebab: ${options?.rejectionReason ?? "Tidak dinyatakan"}`,
    };
    return messages[status] ?? `Status diubah ke '${status}' oleh ${actorName}.`;
  },
};

// ============================================================
// Reports Service
// ============================================================

export const ReportService = {
  /**
   * Get financial summary report
   */
  async getFinancialReport(startDate?: Date, endDate?: Date) {
    try {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;

      const [donationAgg, disbursementAgg, monthlyDonations, monthlyDisbursements] = await Promise.all([
        db.donation.aggregate({
          where: { status: "confirmed", ...(startDate || endDate ? { date: dateFilter } : {}) },
          _sum: { amount: true },
          _count: true,
        }),
        db.disbursement.aggregate({
          where: { status: "completed", ...(startDate || endDate ? { createdAt: dateFilter } : {}) },
          _sum: { amount: true },
          _count: true,
        }),
        // Monthly breakdown
        db.$queryRaw<Array<{ month: string; total: number }>>`
          SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
          FROM Donation
          WHERE status = 'confirmed'
          GROUP BY month
          ORDER BY month DESC
          LIMIT 12
        `,
        db.$queryRaw<Array<{ month: string; total: number }>>`
          SELECT strftime('%Y-%m', processedDate) as month, SUM(amount) as total
          FROM Disbursement
          WHERE status = 'completed' AND processedDate IS NOT NULL
          GROUP BY month
          ORDER BY month DESC
          LIMIT 12
        `,
      ]);

      const totalDonated = donationAgg._sum.amount ?? 0;
      const totalDisbursed = disbursementAgg._sum.amount ?? 0;

      return {
        totalDonated: Math.round(totalDonated * 100) / 100,
        totalDisbursed: Math.round(totalDisbursed * 100) / 100,
        balance: Math.round((totalDonated - totalDisbursed) * 100) / 100,
        donationCount: donationAgg._count,
        disbursementCount: disbursementAgg._count,
        monthlyDonations: monthlyDonations.map(m => ({ month: m.month, total: m.total })),
        monthlyDisbursements: monthlyDisbursements.map(m => ({ month: m.month, total: m.total })),
      };
    } catch (error) {
      console.error("[ReportService] getFinancialReport error:", error);
      return null;
    }
  },

  /**
   * Get case workflow report
   */
  async getCaseReport() {
    try {
      const [byStatus, byCategory, byPriority, avgProcessingTime] = await Promise.all([
        db.case.groupBy({ by: ["status"], _count: true }),
        db.case.groupBy({ by: ["category"], _count: true }),
        db.case.groupBy({ by: ["priority"], _count: true }),
        // Average days from submission to close
        db.$queryRaw<Array<{ avg_days: number }>>`
          SELECT AVG(julianday(closedAt) - julianday(createdAt)) as avg_days
          FROM "Case"
          WHERE status = 'closed' AND closedAt IS NOT NULL
        `,
      ]);

      return {
        byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
        byCategory: byCategory.map(c => ({ category: c.category, count: c._count })),
        byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
        avgProcessingDays: avgProcessingTime[0]?.avg_days ? Math.round(avgProcessingTime[0].avg_days) : 0,
      };
    } catch (error) {
      console.error("[ReportService] getCaseReport error:", error);
      return null;
    }
  },
};
