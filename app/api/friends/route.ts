import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import User from '@/models/User';
import Notification from '@/models/Notification';

const addFriendSchema = z.object({
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase()),
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    // Fetch user and populate their friends
    const user = await User.findById(auth._id).populate(
      'friends',
      'name email upiId avatarUrl'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: user.friends, message: 'Friends retrieved successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get friends error:', error);
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
    const parsed = addFriendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const currentUser = await User.findById(auth._id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (currentUser.email === email) {
      return NextResponse.json(
        { error: 'You cannot add yourself as a friend' },
        { status: 400 }
      );
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return NextResponse.json(
        { error: 'No user found with this email' },
        { status: 404 }
      );
    }

    // Check if already friends
    const isAlreadyFriend = currentUser.friends.some(
      (friendId: any) => friendId.toString() === targetUser._id.toString()
    );
    if (isAlreadyFriend) {
      return NextResponse.json(
        { error: 'You are already friends with this user' },
        { status: 400 }
      );
    }

    // Check for pending friend request sent from us
    const hasPendingRequest = targetUser.friendRequests?.some(
      (req: any) =>
        req.from.toString() === currentUser._id.toString() && req.status === 'pending'
    );
    if (hasPendingRequest) {
      return NextResponse.json(
        { error: 'Friend request already pending' },
        { status: 400 }
      );
    }

    // Check if target already sent a request to us
    const hasIncomingRequest = currentUser.friendRequests?.some(
      (req: any) =>
        req.from.toString() === targetUser._id.toString() && req.status === 'pending'
    );
    if (hasIncomingRequest) {
      return NextResponse.json(
        { error: 'This user has already sent you a friend request' },
        { status: 400 }
      );
    }

    // Add friend request to target user's array
    targetUser.friendRequests = targetUser.friendRequests || [];
    targetUser.friendRequests.push({
      from: currentUser._id,
      status: 'pending',
    });
    await targetUser.save();

    // Create notification for target user
    await Notification.create({
      userId: targetUser._id,
      type: 'friend_request',
      message: `${currentUser.name} wants to be your friend.`,
      metadata: {
        fromUserId: currentUser._id.toString(),
      },
      isRead: false,
    });

    return NextResponse.json(
      { data: null, message: 'Friend request sent successfully!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Add friend error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
