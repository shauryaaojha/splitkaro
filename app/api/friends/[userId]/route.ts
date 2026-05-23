import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { authMiddleware } from '@/lib/middleware'
import User from '@/models/User'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB()

    const auth = await authMiddleware(request)
    if (auth instanceof NextResponse) return auth

    const { userId: friendId } = await params

    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend user ID is required' },
        { status: 400 }
      )
    }

    const currentUser = await User.findById(auth._id)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const friendUser = await User.findById(friendId)
    if (!friendUser) {
      return NextResponse.json(
        { error: 'Friend not found' },
        { status: 404 }
      )
    }

    // Remove friend from current user's friends
    currentUser.friends = currentUser.friends.filter(
      (id: { toString: () => string }) => id.toString() !== friendId
    )

    // Remove current user from friend's friends
    friendUser.friends = friendUser.friends.filter(
      (id: { toString: () => string }) => id.toString() !== auth._id.toString()
    )

    await currentUser.save()
    await friendUser.save()

    return NextResponse.json(
      { data: null, message: 'Friend removed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Remove friend error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
