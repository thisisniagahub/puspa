import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/activities - List activities (latest first) with filter and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));

    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (type) {
      where.type = type;
    }

    const [activities, total] = await Promise.all([
      db.activity.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          programme: {
            select: { id: true, name: true },
          },
        },
      }),
      db.activity.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    // Parse metadata JSON if present
    const parsedActivities = activities.map((activity) => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    }));

    return NextResponse.json({
      data: parsedActivities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
