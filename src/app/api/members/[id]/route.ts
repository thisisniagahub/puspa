import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/session';

// GET /api/members/[id] - Get a single member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request);

    const { id } = await params;

    const member = await db.member.findUnique({
      where: { id },
      include: {
        donations: {
          orderBy: { date: 'desc' },
        },
        programmeMembers: {
          include: {
            programme: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: member });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    );
  }
}

// PUT /api/members/[id] - Update a member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if member exists
    const existingMember = await db.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check for duplicate IC number if it's being changed
    if (body.icNumber && body.icNumber !== existingMember.icNumber) {
      const duplicateIc = await db.member.findUnique({
        where: { icNumber: body.icNumber },
      });

      if (duplicateIc) {
        return NextResponse.json(
          { error: 'A member with this IC number already exists' },
          { status: 409 }
        );
      }
    }

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

    const member = await db.member.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(icNumber !== undefined && { icNumber }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...(joinDate !== undefined && { joinDate: new Date(joinDate) }),
        ...(familyMembers !== undefined && { familyMembers }),
        ...(monthlyIncome !== undefined && { monthlyIncome }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(avatar !== undefined && { avatar: avatar || null }),
      },
    });

    return NextResponse.json({ data: member });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/members/[id] - Delete a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if member exists
    const existingMember = await db.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    await db.member.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}
