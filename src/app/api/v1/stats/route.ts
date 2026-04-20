import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// GET /api/v1/stats — Dashboard statistics (no auth required for public dashboard view)
export async function GET() {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Cases stats ──
    const [totalCases, pendingCases, activeCases, closedCases, urgentCases, rejectedCases] =
      await Promise.all([
        db.case.count(),
        db.case.count({ where: { status: { in: ["draft", "submitted", "verifying"] } } }),
        db.case.count({ where: { status: { in: ["verified", "scoring", "scored", "approved", "disbursing", "disbursed", "follow_up"] } } }),
        db.case.count({ where: { status: "closed" } }),
        db.case.count({ where: { priority: "urgent" } }),
        db.case.count({ where: { status: "rejected" } }),
      ]);

    // ── Donations stats ──
    const [confirmedDonations, confirmedThisMonth, uniqueDonors] = await Promise.all([
      db.donation.aggregate({ where: { status: "confirmed" }, _sum: { amount: true }, _count: true }),
      db.donation.aggregate({ where: { status: "confirmed", date: { gte: thisMonthStart } }, _sum: { amount: true } }),
      db.donation.groupBy({ by: ["donorName"], where: { status: "confirmed" } }),
    ]);

    const totalDonationAmount = confirmedDonations._sum.amount ?? 0;
    const thisMonthAmount = confirmedThisMonth._sum.amount ?? 0;

    // ── Programmes stats ──
    const [totalProgrammes, activeProgrammes] = await Promise.all([
      db.programme.count(),
      db.programme.count({ where: { status: "active" } }),
    ]);

    // ── Disbursements stats ──
    const [disbursementAgg, completedDisbursements] = await Promise.all([
      db.disbursement.aggregate({ where: { status: "completed" }, _sum: { amount: true }, _count: true }),
      db.disbursement.aggregate({ _sum: { amount: true }, _count: true }),
    ]);

    const totalDisbursed = disbursementAgg._sum.amount ?? 0;
    const totalDisbursementTransactions = disbursementAgg._count ?? 0;
    const balance = Math.max(0, totalDonationAmount - totalDisbursed);

    // ── Recent cases (last 5) ──
    const recentCases = await db.case.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, caseNumber: true, applicantName: true, status: true, priority: true, createdAt: true,
        assignee: { select: { name: true } },
      },
    });

    // ── Recent donations (last 5) ──
    const recentDonations = await db.donation.findMany({
      orderBy: { date: "desc" },
      take: 5,
      select: { id: true, donorName: true, amount: true, status: true, method: true, date: true },
    });

    // ── Case pipeline breakdown ──
    const pipelineData = await db.case.groupBy({
      by: ["status"],
      _count: true,
    });

    const pipeline: Record<string, number> = {};
    for (const item of pipelineData) {
      pipeline[item.status] = item._count;
    }

    return NextResponse.json({
      data: {
        cases: {
          total: totalCases,
          pending: pendingCases,
          active: activeCases,
          closed: closedCases,
          urgent: urgentCases,
          rejected: rejectedCases,
          pipeline,
        },
        donations: {
          totalAmount: Math.round(totalDonationAmount * 100) / 100,
          totalDonors: uniqueDonors.length,
          thisMonth: Math.round(thisMonthAmount * 100) / 100,
        },
        programmes: { active: activeProgrammes, total: totalProgrammes },
        disbursements: {
          totalAmount: Math.round(totalDisbursed * 100) / 100,
          totalTransactions: totalDisbursementTransactions,
          balance: Math.round(balance * 100) / 100,
        },
        recentCases: recentCases.map((c) => ({
          id: c.id,
          caseNumber: c.caseNumber,
          applicantName: c.applicantName,
          status: c.status,
          priority: c.priority,
          assignee: c.assignee?.name ?? null,
          createdAt: c.createdAt.toISOString(),
        })),
        recentDonations: recentDonations.map((d) => ({
          id: d.id,
          donorName: d.donorName,
          amount: d.amount,
          status: d.status,
          method: d.method,
          date: d.date.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("[Stats API Error]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics", details: message },
      { status: 500 }
    );
  }
}
