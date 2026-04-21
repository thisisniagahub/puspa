import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

// GET /api/members - List members with search, filter, pagination, sorting
export async function GET(request: NextRequest) {
  try {
    requireAuth(request);

    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const sortBy = searchParams.get('sortBy') || 'joinDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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

    // Build orderBy
    const allowedSortFields = ['joinDate', 'name', 'createdAt', 'monthlyIncome', 'familyMembers', 'category'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'joinDate';
    const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

    const [members, total] = await Promise.all([
      db.member.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { [orderField]: orderDir },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          donations: true,
          programmeMembers: {
            include: {
              programme: true,
            },
          },
        },
      }),
      db.member.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    return NextResponse.json({
      data: members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/members - Create a new member
export async function POST(request: NextRequest) {
  try {
    requireAuth(request);

    const body = await request.json();

    const {
      name,
      icNumber,
      phone,
      email,
      address,
      category,
      status,
      joinDate,
      familyMembers,
      monthlyIncome,
      notes,
      avatar,
    } = body;

    // Validate required fields
    if (!name || !icNumber || !phone) {
      return NextResponse.json(
        { error: 'Name, IC number, and phone are required' },
        { status: 400 }
      );
    }

    // Check for duplicate IC number
    const existingMember = await db.member.findUnique({
      where: { icNumber },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'A member with this IC number already exists' },
        { status: 409 }
      );
    }

    const member = await db.member.create({
      data: {
        name,
        icNumber,
        phone,
        email: email || null,
        address: address || null,
        category: category || 'asnaf',
        status: status || 'active',
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        familyMembers: familyMembers || 1,
        monthlyIncome: monthlyIncome || 0,
        notes: notes || null,
        avatar: avatar || null,
      },
    });

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}
