import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { generateOTP, hashOTP } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/mail'

const loginSchema = z.object({
  email: z.string().email('Invalid email address').transform((v) => v.toLowerCase()),
})

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      )
    }

    const otp = generateOTP()
    const hashedOTP = await hashOTP(otp)

    user.otp = {
      hash: hashedOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    }
    await user.save()

    await sendOTPEmail(user.email, user.name, otp)

    return NextResponse.json(
      { data: null, message: 'OTP sent to your email' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
