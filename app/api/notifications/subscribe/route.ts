import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  try {
    await connectDB();
    const subscription = await request.json();

    if (!subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 });
    }

    // A device belongs to whoever is logged in on it now, so detach this
    // endpoint from every account (including earlier ones) before re-adding it.
    await User.updateMany(
      { 'pushSubscriptions.endpoint': subscription.endpoint },
      { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
    );

    await User.findByIdAndUpdate(user._id, {
      $push: {
        pushSubscriptions: {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          expirationTime: subscription.expirationTime,
          createdAt: new Date(),
        },
      },
    });

    return NextResponse.json({ message: 'Push subscription saved' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
