import { NextRequest, NextResponse } from 'next/server'
import { google } from '@/lib/config'
import {
  OAUTH_COOKIE_MAX_AGE_S,
  OAUTH_COOKIE_NAME,
  OAUTH_COOKIE_PATH,
  buildAuthUrl,
  createOAuthTransaction,
  safeRedirectPath,
} from '@/lib/google'

/**
 * Kicks off Google sign-in.
 *
 * Stores a CSRF nonce, the PKCE verifier and the post-login destination in a
 * short-lived HTTP-only cookie, then sends the browser to Google's consent
 * screen. Used for both login and signup — the callback decides which it was.
 */
export async function GET(request: NextRequest) {
  if (!google.isConfigured) {
    console.error('Google sign-in attempted without GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET')
    const loginUrl = new URL('/login', request.nextUrl.origin)
    loginUrl.searchParams.set('error', 'Google sign-in is not configured')
    return NextResponse.redirect(loginUrl)
  }

  const redirectTo = safeRedirectPath(request.nextUrl.searchParams.get('redirect'))
  const transaction = createOAuthTransaction(redirectTo)

  const response = NextResponse.redirect(buildAuthUrl(transaction))

  response.cookies.set(OAUTH_COOKIE_NAME, JSON.stringify(transaction), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // `lax` (not `strict`) so the cookie survives the redirect back from Google
    sameSite: 'lax',
    path: OAUTH_COOKIE_PATH,
    maxAge: OAUTH_COOKIE_MAX_AGE_S,
  })

  return response
}
