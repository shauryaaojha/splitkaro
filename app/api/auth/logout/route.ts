import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json(
      { data: null, message: 'Logged out successfully' },
      { status: 200 }
    )

    response.cookies.set('sk_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
