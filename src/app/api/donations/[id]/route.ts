import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/donations/[id] - Get a single donation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const donation = await db.donation.findUnique({
      where: { id },
      include: {
        programme: true,
        member: true,
      },
    });

    if (!donation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: donation });
  } catch (error) {
    console.error('Error fetching donation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donation' },
      { status: 500 }
    );
  }
}

// PUT /api/donations/[id] - Update a donation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if donation exists
    const existingDonation = await db.donation.findUnique({
      where: { id },
    });

    if (!existingDonation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

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

    const donation = await db.donation.update({
      where: { id },
      data: {
        ...(donorName !== undefined && { donorName }),
        ...(donorEmail !== undefined && { donorEmail: donorEmail || null }),
        ...(donorPhone !== undefined && { donorPhone: donorPhone || null }),
        ...(amount !== undefined && { amount: parseFloat(amount.toString()) }),
        ...(method !== undefined && { method }),
        ...(status !== undefined && { status }),
        ...(receiptNumber !== undefined && { receiptNumber: receiptNumber || null }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(programmeId !== undefined && { programmeId: programmeId || null }),
        ...(memberId !== undefined && { memberId: memberId || null }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    return NextResponse.json({ data: donation });
  } catch (error) {
    console.error('Error updating donation:', error);
    return NextResponse.json(
      { error: 'Failed to update donation' },
      { status: 500 }
    );
  }
}

// DELETE /api/donations/[id] - Delete a donation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if donation exists
    const existingDonation = await db.donation.findUnique({
      where: { id },
    });

    if (!existingDonation) {
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }

    await db.donation.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    return NextResponse.json(
      { error: 'Failed to delete donation' },
      { status: 500 }
    );
  }
}
