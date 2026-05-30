import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/middleware';
import { sendInviteEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  try {
    const { email } = await request.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await sendInviteEmail(email, user.name);

    return NextResponse.json({ message: 'Invite sent successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send invite';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
