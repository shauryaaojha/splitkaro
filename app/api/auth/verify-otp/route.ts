import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { verifyOTP, isOTPExpired } from '@/lib/otp'
import { signJWT, setAuthCookie } from '@/lib/auth'

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase()),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const parsed = verifyOTPSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, otp } = parsed.data

    const user = await User.findOne({ email })
    if (!user || !user.otp?.hash) {
      return NextResponse.json(
        { error: 'No pending OTP for this email' },
        { status: 400 }
      )
    }

    if (user.otp.attempts >= 3) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      )
    }

    if (isOTPExpired(user.otp.expiresAt)) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    const isValid = await verifyOTP(otp, user.otp.hash)
    if (!isValid) {
      user.otp.attempts += 1
      await user.save()
      return NextResponse.json(
        { error: `Invalid OTP. ${3 - user.otp.attempts} attempts remaining.` },
        { status: 400 }
      )
    }

    // Clear OTP fields on success
    user.otp = undefined
    await user.save()

    const token = signJWT(user._id.toString())

    const response = NextResponse.json(
      {
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          upiId: user.upiId,
        },
        message: 'Login successful',
      },
      { status: 200 }
    )

    setAuthCookie(response, token)

    return response
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
