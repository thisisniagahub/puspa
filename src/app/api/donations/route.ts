import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/donations - List donations with search, filter, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const method = searchParams.get('method') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));

    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.donorName = { contains: search };
    }
    if (status) {
      where.status = status;
    }
    if (method) {
      where.method = method;
    }

    const [donations, total] = await Promise.all([
      db.donation.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          programme: {
            select: { id: true, name: true },
          },
          member: {
            select: { id: true, name: true },
          },
        },
      }),
      db.donation.count({
        where: Object.keys(where).length > 0 ? where : undefined,
      }),
    ]);

    return NextResponse.json({
      data: donations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}

// POST /api/donations - Create a new donation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      donorName,
      donorEmail,
      donorPhone,
      amount,
      method,
      status,
      receiptNumber,
      date,
      programmeId,
      memberId,
      notes,
    } = body;

    // Validate required fields
    if (!donorName || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Donor name and amount are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Donation amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Verify optional relations exist
    if (programmeId) {
      const programme = await db.programme.findUnique({
        where: { id: programmeId },
      });
      if (!programme) {
        return NextResponse.json(
          { error: 'Referenced programme not found' },
          { status: 404 }
        );
      }
    }

    if (memberId) {
      const member = await db.member.findUnique({
        where: { id: memberId },
      });
      if (!member) {
        return NextResponse.json(
          { error: 'Referenced member not found' },
          { status: 404 }
        );
      }
    }

    const donation = await db.donation.create({
      data: {
        donorName,
        donorEmail: donorEmail || null,
        donorPhone: donorPhone || null,
        amount: parseFloat(amount.toString()),
        method: method || 'bank-transfer',
        status: status || 'confirmed',
        receiptNumber: receiptNumber || null,
        date: date ? new Date(date) : new Date(),
        programmeId: programmeId || null,
        memberId: memberId || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ data: donation }, { status: 201 });
  } catch (error) {
    console.error('Error creating donation:', error);
    return NextResponse.json(
      { error: 'Failed to create donation' },
      { status: 500 }
    );
  }
}
