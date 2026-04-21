import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

// GET /api/programmes - List programmes with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));

    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search };
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const [programmes, total] = await Promise.all([
      db.programme.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          donations: true,
          programmeMembers: {
            include: {
              member: true,
            },
          },
          activities: {
            orderBy: { date: 'desc' },
          },
          _count: {
            select: {
              programmeMembers: true,
              donations: true,
              activities: true,
            },
          },
        },
      }),
      db.programme.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    return NextResponse.json({
      programmes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching programmes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programmes' },
      { status: 500 }
    );
  }
}

// POST /api/programmes - Create a new programme
export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body = await request.json();

    const {
      name,
      description,
      category,
      status,
      startDate,
      endDate,
      location,
      beneficiaryCount,
      volunteerCount,
      budget,
      actualCost,
      partners,
      notes,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Programme name is required' },
        { status: 400 }
      );
    }

    const programme = await db.programme.create({
      data: {
        name,
        description: description || null,
        category: category || 'food-aid',
        status: status || 'active',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        location: location || null,
        beneficiaryCount: beneficiaryCount || 0,
        volunteerCount: volunteerCount || 0,
        budget: budget || 0,
        actualCost: actualCost || 0,
        partners: partners ? JSON.stringify(partners) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ data: programme }, { status: 201 });
  } catch (error) {
    console.error('Error creating programme:', error);
    return NextResponse.json(
      { error: 'Failed to create programme' },
      { status: 500 }
    );
  }
}
