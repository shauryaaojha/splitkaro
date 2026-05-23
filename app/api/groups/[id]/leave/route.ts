import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import Group from '@/models/Group';
import { calculateGroupBalances } from '@/lib/balance';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const { id: groupId } = await params;

    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Verify member existence in nested subdocument
    const memberRecord = group.members.find(
      (m: any) => m.userId.toString() === auth._id.toString()
    );
    if (!memberRecord) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // Check if the user has settled all balances (balance is 0)
    const balances = await calculateGroupBalances(groupId);
    const userBalance = balances.get(auth._id.toString()) ?? 0;

    if (Math.abs(userBalance) > 0.01) {
      return NextResponse.json(
        { error: `You must settle all balances before leaving. Your current net balance is ₹${userBalance.toFixed(2)}.` },
        { status: 400 }
      );
    }

    // Check if user is the only admin in the group
    const isAdmin = memberRecord.role === 'admin';
    const adminCount = group.members.filter((m: any) => m.role === 'admin').length;

    if (isAdmin && adminCount === 1 && group.members.length > 1) {
      return NextResponse.json(
        { error: 'You are the only admin of this group. Please assign another admin role before leaving.' },
        { status: 400 }
      );
    }

    // Remove user record from group members array
    group.members = group.members.filter(
      (m: any) => m.userId.toString() !== auth._id.toString()
    ) as any;

    await group.save();

    return NextResponse.json(
      { data: null, message: 'Left group successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Leave group error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
