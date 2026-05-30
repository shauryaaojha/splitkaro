import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { authMiddleware } from '@/lib/middleware';
import User from '@/models/User';
import { generateOTP, hashOTP, verifyOTP, isOTPExpired } from '@/lib/otp';
import { sendOTPEmail } from '@/lib/mail';

const sendOtpSchema = z.object({
  newEmail: z.string().email(),
});

const verifyOtpSchema = z.object({
  newEmail: z.string().email(),
  otp: z.string().length(6),
});

// POST: send OTP to new email
export async function POST(request: NextRequest) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  try {
    await connectDB();
    const body = await request.json();
    const { newEmail } = sendOtpSchema.parse(body);

    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json({ error: 'New email cannot be the same as current email' }, { status: 400 });
    }

    // Check email not taken by another user
    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'This email is already in use' }, { status: 409 });
    }

    const otp = generateOTP();
    const hash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store OTP + pending new email in user's otp field
    await User.findByIdAndUpdate(user._id, {
      otp: { hash, expiresAt, attempts: 0 },
      // Store pending email in metadata (we re-use otp.hash field + a separate field)
      pendingEmail: newEmail.toLowerCase(),
    });

    await sendOTPEmail(newEmail, user.name, otp);

    return NextResponse.json({ message: 'OTP sent to new email address' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || 'Validation failed' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to send OTP';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: verify OTP and change email
export async function PUT(request: NextRequest) {
  const user = await authMiddleware(request);
  if (user instanceof NextResponse) return user;

  try {
    await connectDB();
    const body = await request.json();
    const { newEmail, otp } = verifyOtpSchema.parse(body);

    const dbUser = await User.findById(user._id);
    if (!dbUser || !dbUser.otp) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    if (isOTPExpired(dbUser.otp.expiresAt)) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    if (dbUser.otp.attempts >= 5) {
      return NextResponse.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 429 });
    }

    const isValid = await verifyOTP(otp, dbUser.otp.hash);
    if (!isValid) {
      await User.findByIdAndUpdate(user._id, { $inc: { 'otp.attempts': 1 } });
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Verify email matches pending email
    const pendingEmail = (dbUser as unknown as { pendingEmail?: string }).pendingEmail;
    if (!pendingEmail || pendingEmail !== newEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Email mismatch. Please restart the process.' }, { status: 400 });
    }

    // Update email, clear OTP
    await User.findByIdAndUpdate(user._id, {
      email: newEmail.toLowerCase(),
      $unset: { otp: 1, pendingEmail: 1 },
    });

    return NextResponse.json({ message: 'Email changed successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message || 'Validation failed' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Failed to change email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
