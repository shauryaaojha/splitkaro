import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const authUser = await getUserFromRequest(request)
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await User.findById(authUser._id)
      .select('-otp')
      .populate('friendRequests.from', 'name email upiId avatarUrl');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { data: user, message: 'User retrieved successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
