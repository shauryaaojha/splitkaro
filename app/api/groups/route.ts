import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import Group from '@/models/Group';
import { calculateGroupBalances } from '@/lib/balance';
import User from '@/models/User';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(50, 'Group name too long'),
  category: z.enum(['food', 'trip', 'home', 'fun', 'other']),
  emoji: z.string().optional().default('👥'),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    // Correct query: user is in the members subdocument array
    const groups = await Group.find({
      'members.userId': auth._id,
      isArchived: { $ne: true },
    })
      .populate('members.userId', 'name email avatarUrl upiId')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    // Map groups and inject balances and formatted member details
    const groupsWithMeta = await Promise.all(
      groups.map(async (group: any) => {
        // Calculate group balances
        const balances = await calculateGroupBalances(group._id.toString());
        const userBalance = balances.get(auth._id.toString()) ?? 0;

        // Map populated members to matches required for GroupCard Props: { name, avatarUrl }
        const mappedMembers = group.members.map((m: any) => ({
          name: m.userId?.name || 'Unknown',
          avatarUrl: m.userId?.avatarUrl,
        }));

        return {
          id: group._id.toString(),
          name: group.name,
          category: group.category,
          emoji: group.emoji,
          inviteToken: group.inviteToken,
          members: mappedMembers,
          balance: userBalance,
        };
      })
    );

    return NextResponse.json(
      { data: groupsWithMeta, message: 'Groups retrieved successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get groups error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, category, emoji } = parsed.data;
    const inviteToken = crypto.randomUUID();

    // Correct structure for members subdocument array
    const group = await Group.create({
      name,
      category,
      emoji,
      inviteToken,
      members: [
        {
          userId: auth._id,
          role: 'admin',
          joinedAt: new Date(),
        },
      ],
      createdBy: auth._id,
    });

    const populated = await Group.findById(group._id)
      .populate('members.userId', 'name email avatarUrl')
      .populate('createdBy', 'name email');

    return NextResponse.json(
      { data: populated, message: 'Group created successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create group error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
