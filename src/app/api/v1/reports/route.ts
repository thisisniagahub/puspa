import { apiSuccess, apiError } from "@/lib/api-response";
import { requireAuth, requirePermission, AuthError } from "@/lib/session";
import { ReportService } from "@/services/case-service";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";

// GET /api/v1/reports - Comprehensive reports
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requirePermission(session, "reports:read");

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "overview";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    switch (type) {
      case "financial": {
        const report = await ReportService.getFinancialReport(start, end);
        if (!report) return apiError("Gagal menjana laporan kewangan", 500);
        return apiSuccess(report);
      }

      case "cases": {
        const report = await ReportService.getCaseReport();
        if (!report) return apiError("Gagal menjana laporan kes", 500);
        return apiSuccess(report);
      }

      case "programme": {
        const programmes = await db.programme.findMany({
          include: {
            _count: { select: { cases: true, donations: true, disbursements: true } },
            donations: {
              where: { status: "confirmed" },
              select: { amount: true },
            },
            disbursements: {
              where: { status: "completed" },
              select: { amount: true },
            },
          },
          orderBy: { totalBudget: "desc" },
        });

        const report = programmes.map(p => ({
          ...p,
          totalDonated: p.donations.reduce((sum, d) => sum + d.amount, 0),
          totalDisbursed: p.disbursements.reduce((sum, d) => sum + d.amount, 0),
          budgetUtilization: p.totalBudget > 0
            ? Math.round((p.disbursements.reduce((sum, d) => sum + d.amount, 0) / p.totalBudget) * 100)
            : 0,
          donations: undefined,
          disbursements: undefined,
        }));

        return apiSuccess(report);
      }

      case "overview":
      default: {
        const [financialReport, caseReport, programmeCount, activeProgrammes, userCount] = await Promise.all([
          ReportService.getFinancialReport(start, end),
          ReportService.getCaseReport(),
          db.programme.count(),
          db.programme.count({ where: { status: "active" } }),
          db.user.count({ where: { isActive: true } }),
        ]);

        return apiSuccess({
          financial: financialReport,
          cases: caseReport,
          programmes: { total: programmeCount, active: activeProgrammes },
          users: { total: userCount },
          generatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.statusCode);
    console.error("[REPORTS] GET error:", error);
    return apiError("Gagal menjana laporan", 500);
  }
}
