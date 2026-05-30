import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import User from '@/models/User';
import Notification from '@/models/Notification';

const respondSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  action: z.enum(['accept', 'decline']),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = await authMiddleware(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const parsed = respondSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { requestId, action } = parsed.data;

    const currentUser = await User.findById(auth._id);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Find the friend request inside the current user's requests array
    // Wait, the request contains requestId which refers to the 'from' user's ID
    const requestIndex = currentUser.friendRequests?.findIndex(
      (req: { from: { toString(): string }; status: string }) => req.from.toString() === requestId && req.status === 'pending'
    );

    if (requestIndex === undefined || requestIndex === -1) {
      return NextResponse.json(
        { error: 'Friend request not found or already processed' },
        { status: 404 }
      );
    }

    const friendRequest = currentUser.friendRequests[requestIndex];
    friendRequest.status = action === 'accept' ? 'accepted' : 'declined';

    if (action === 'accept') {
      const fromUser = await User.findById(friendRequest.from);
      if (!fromUser) {
        return NextResponse.json(
          { error: 'Requesting user no longer exists' },
          { status: 404 }
        );
      }

      // Add each user to the other's friends array (prevent duplicates)
      const currentId = currentUser._id.toString();
      const fromId = fromUser._id.toString();

      const alreadyFriendsCurrentUser = currentUser.friends.some(
        (id: { toString(): string }) => id.toString() === fromId
      );
      const alreadyFriendsFromUser = fromUser.friends.some(
        (id: { toString(): string }) => id.toString() === currentId
      );

      if (!alreadyFriendsCurrentUser) {
        currentUser.friends.push(fromUser._id);
      }
      if (!alreadyFriendsFromUser) {
        fromUser.friends.push(currentUser._id);
      }

      await fromUser.save();

      // Notify the requester that their request was accepted
      await Notification.create({
        userId: fromUser._id,
        type: 'friend_accepted',
        message: `${currentUser.name} accepted your friend request.`,
        metadata: {
          fromUserId: currentUser._id.toString(),
        },
        isRead: false,
      });
    }

    // Remove or update the status in the local document
    currentUser.friendRequests.splice(requestIndex, 1);
    await currentUser.save();

    return NextResponse.json(
      {
        data: null,
        message: action === 'accept'
          ? 'Friend request accepted'
          : 'Friend request declined',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Respond friend request error:', error);
    const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
