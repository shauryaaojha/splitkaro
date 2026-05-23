import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import Group from '@/models/Group';
import Notification from '@/models/Notification';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();

    const { token } = await params;

    const group = await Group.findOne({ inviteToken: token })
      .populate('createdBy', 'name')
      .lean();

    if (!group) {
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 404 }
      );
    }

    if (group.isArchived) {
      return NextResponse.json(
        { error: 'This group has been archived' },
        { status: 410 }
      );
    }

    return NextResponse.json(
      {
        data: {
          name: group.name,
          emoji: group.emoji,
          category: group.category,
          memberCount: group.members.length,
          creatorName: (group.createdBy as any)?.name || 'Unknown',
        },
        message: 'Group preview retrieved',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Group preview error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();

    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const { token } = await params;

    const group = await Group.findOne({ inviteToken: token });
    if (!group) {
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 404 }
      );
    }

    if (group.isArchived) {
      return NextResponse.json(
        { error: 'This group has been archived' },
        { status: 410 }
      );
    }

    // Correct membership check for subdocument
    const isMember = group.members.some(
      (m: any) => m.userId.toString() === auth._id.toString()
    );
    if (isMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Add nested member record
    group.members.push({
      userId: auth._id,
      role: 'member',
      joinedAt: new Date(),
    });
    await group.save();

    // Notify all existing members about the new join
    const membersToNotify = group.members.filter(
      (m: any) => m.userId.toString() !== auth._id.toString()
    );

    const notificationPromises = membersToNotify.map((m: any) =>
      Notification.create({
        userId: m.userId,
        type: 'group_joined',
        message: `${auth.name} joined the group "${group.name}".`,
        metadata: {
          groupId: group._id.toString(),
          userId: auth._id.toString(),
        },
        isRead: false,
      })
    );

    await Promise.all(notificationPromises);

    const populated = await Group.findById(group._id)
      .populate('members.userId', 'name email avatarUrl');

    return NextResponse.json(
      { data: populated, message: 'Joined group successfully!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Join group error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
