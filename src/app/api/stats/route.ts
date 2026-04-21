import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

// GET /api/stats - Dashboard statistics
export async function GET(request: Request) {
  try {
    requireAuth(request);

    // Run all queries in parallel for performance
    const [
      allMembers,
      allProgrammes,
      allDonations,
      totalBeneficiaries,
      recentActivities,
    ] = await Promise.all([
      // All members
      db.member.findMany({
        select: { category: true, status: true },
      }),
      // All programmes
      db.programme.findMany({
        select: { status: true, beneficiaryCount: true },
      }),
      // All confirmed donations
      db.donation.findMany({
        where: { status: 'confirmed' },
        select: { amount: true, date: true },
      }),
      // Total beneficiaries from all programmes
      db.programme.aggregate({
        _sum: { beneficiaryCount: true },
      }),
      // Recent 5 activities
      db.activity.findMany({
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          programme: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    // ── Members grouped by category ──
    const membersByCategory: Record<string, number> = {
      asnaf: 0,
      volunteer: 0,
      donor: 0,
      staff: 0,
    };
    allMembers.forEach((m) => {
      if (m.category in membersByCategory) {
        membersByCategory[m.category]++;
      }
    });

    const totalMembers = allMembers.length;

    // ── Programmes grouped by status ──
    const programmesByStatus: Record<string, number> = {
      active: 0,
      completed: 0,
      upcoming: 0,
      cancelled: 0,
    };
    allProgrammes.forEach((p) => {
      if (p.status in programmesByStatus) {
        programmesByStatus[p.status]++;
      }
    });

    const totalProgrammes = allProgrammes.length;

    // ── Donations total amount ──
    const totalDonationsAmount = allDonations.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    // ── Monthly breakdown for last 12 months ──
    const now = new Date();
    const monthlyBreakdown: Array<{
      month: string;
      year: number;
      amount: number;
      count: number;
    }> = [];

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);

      const monthDonations = allDonations.filter((d) => {
        const donationDate = new Date(d.date);
        return donationDate >= monthStart && donationDate < monthEnd;
      });

      const monthAmount = monthDonations.reduce((sum, d) => sum + d.amount, 0);

      monthlyBreakdown.push({
        month: monthDate.toLocaleString('en-US', { month: 'short' }),
        year: monthDate.getFullYear(),
        amount: Math.round(monthAmount * 100) / 100,
        count: monthDonations.length,
      });
    }

    // ── Donation trend for charts ──
    const donationTrend = monthlyBreakdown.map((m) => ({
      label: `${m.month} ${m.year}`,
      amount: m.amount,
      count: m.count,
    }));

    // ── Total beneficiaries ──
    const totalBeneficiariesCount = totalBeneficiaries._sum.beneficiaryCount || 0;

    // ── Recent activities with parsed metadata ──
    const parsedRecentActivities = recentActivities.map((activity) => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    }));

    return NextResponse.json({
      data: {
        totalMembers,
        membersByCategory,
        totalProgrammes,
        programmesByStatus,
        totalDonations: {
          amount: Math.round(totalDonationsAmount * 100) / 100,
          count: allDonations.length,
          monthlyBreakdown,
        },
        totalBeneficiaries: totalBeneficiariesCount,
        recentActivities: parsedRecentActivities,
        donationTrend,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics', details: message },
      { status: 500 }
    );
  }
}
