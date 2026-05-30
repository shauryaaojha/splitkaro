import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import Group from '@/models/Group';
import Notification from '@/models/Notification';
import type { IGroupMember } from '@/types';

const transferSchema = z.object({
  newAdminId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const { id: groupId } = await params;
    const body = await request.json();
    const { newAdminId } = transferSchema.parse(body);

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Only current admin can transfer
    const currentMember = group.members.find(
      (m: IGroupMember) => m.userId.toString() === auth._id.toString()
    );
    if (!currentMember || currentMember.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can transfer ownership' }, { status: 403 });
    }

    // Verify new admin is a group member
    const newAdminMember = group.members.find(
      (m: IGroupMember) => m.userId.toString() === newAdminId
    );
    if (!newAdminMember) {
      return NextResponse.json({ error: 'New admin must be a group member' }, { status: 400 });
    }

    if (newAdminId === auth._id.toString()) {
      return NextResponse.json({ error: 'You are already the admin' }, { status: 400 });
    }

    // Transfer: demote current admin, promote new one
    group.members.forEach((m: IGroupMember) => {
      if (m.userId.toString() === auth._id.toString()) {
        m.role = 'member';
      } else if (m.userId.toString() === newAdminId) {
        m.role = 'admin';
      }
    });

    await group.save();

    // Notify the new admin
    await Notification.create({
      userId: newAdminId,
      type: 'group_joined',
      message: `${auth.name} transferred admin ownership of "${group.name}" to you.`,
      metadata: { groupId: group._id.toString() },
      isRead: false,
    });

    return NextResponse.json({ message: 'Ownership transferred successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to transfer ownership';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
