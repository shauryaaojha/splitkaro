import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import Group from '@/models/Group';

const updateGroupSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  category: z.enum(['food', 'trip', 'home', 'fun', 'other']).optional(),
  emoji: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const group = await Group.findById(id)
      .populate('members.userId', 'name email upiId avatarUrl')
      .populate('createdBy', 'name email')
      .lean();

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (m: any) => m.userId?._id.toString() === auth._id.toString()
    );
    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { data: group, message: 'Group retrieved successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get group error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const body = await request.json();
    const parsed = updateGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Verify admin status from the members array
    const memberRecord = group.members.find(
      (m) => m.userId.toString() === auth._id.toString()
    );
    const isAdmin = memberRecord?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only group admins can update group settings' },
        { status: 403 }
      );
    }

    const { name, category, emoji } = parsed.data;

    if (name) group.name = name;
    if (category) group.category = category as any;
    if (emoji) group.emoji = emoji;

    await group.save();

    const updated = await Group.findById(id)
      .populate('members.userId', 'name email avatarUrl')
      .populate('createdBy', 'name email');

    return NextResponse.json(
      { data: updated, message: 'Group updated successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update group error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Verify admin status
    const memberRecord = group.members.find(
      (m) => m.userId.toString() === auth._id.toString()
    );
    const isAdmin = memberRecord?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only group admins can archive groups' },
        { status: 403 }
      );
    }

    group.isArchived = true;
    await group.save();

    return NextResponse.json(
      { data: null, message: 'Group archived successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Archive group error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
