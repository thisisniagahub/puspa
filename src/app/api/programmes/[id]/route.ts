import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/programmes/[id] - Get a single programme by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const programme = await db.programme.findUnique({
      where: { id },
      include: {
        donations: {
          orderBy: { date: 'desc' },
        },
        programmeMembers: {
          include: {
            member: true,
          },
        },
        activities: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!programme) {
      return NextResponse.json(
        { error: 'Programme not found' },
        { status: 404 }
      );
    }

    // Parse partners JSON if present
    const result = {
      ...programme,
      partners: programme.partners ? JSON.parse(programme.partners) : null,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching programme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programme' },
      { status: 500 }
    );
  }
}

// PUT /api/programmes/[id] - Update a programme
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if programme exists
    const existingProgramme = await db.programme.findUnique({
      where: { id },
    });

    if (!existingProgramme) {
      return NextResponse.json(
        { error: 'Programme not found' },
        { status: 404 }
      );
    }

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

    const programme = await db.programme.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(location !== undefined && { location: location || null }),
        ...(beneficiaryCount !== undefined && { beneficiaryCount }),
        ...(volunteerCount !== undefined && { volunteerCount }),
        ...(budget !== undefined && { budget }),
        ...(actualCost !== undefined && { actualCost }),
        ...(partners !== undefined && { partners: partners ? JSON.stringify(partners) : null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    const result = {
      ...programme,
      partners: programme.partners ? JSON.parse(programme.partners) : null,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error updating programme:', error);
    return NextResponse.json(
      { error: 'Failed to update programme' },
      { status: 500 }
    );
  }
}

// DELETE /api/programmes/[id] - Delete a programme
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if programme exists
    const existingProgramme = await db.programme.findUnique({
      where: { id },
    });

    if (!existingProgramme) {
      return NextResponse.json(
        { error: 'Programme not found' },
        { status: 404 }
      );
    }

    await db.programme.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Programme deleted successfully' });
  } catch (error) {
    console.error('Error deleting programme:', error);
    return NextResponse.json(
      { error: 'Failed to delete programme' },
      { status: 500 }
    );
  }
}
