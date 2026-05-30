import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import User from '@/models/User';

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  upiId: z.string().max(50).optional(),
});

export async function PUT(request: NextRequest) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  try {
    await connectDB();
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: parsed },
      { new: true, select: '-otp' }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedUser, message: 'Profile updated successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || 'Validation failed' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
