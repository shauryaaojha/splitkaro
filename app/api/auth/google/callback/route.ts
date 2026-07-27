import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { setAuthCookie, signJWT } from '@/lib/auth'
import {
  GoogleProfile,
  OAUTH_COOKIE_NAME,
  OAUTH_COOKIE_PATH,
  OAuthTransaction,
  exchangeCodeForProfile,
  gmailVariantPattern,
  isValidState,
  safeRedirectPath,
} from '@/lib/google'
import { google } from '@/lib/config'
import type { HydratedDocument } from 'mongoose'
import type { IUser } from '@/types'

type UserDoc = HydratedDocument<IUser>

/**
 * Google OAuth callback.
 *
 * Matches the Google account to an existing SplitKaro user wherever possible —
 * by a previously linked Google ID, then by email — so that someone who
 * originally signed up with an OTP keeps their groups, expenses and friends
 * when they switch to "Continue with Google". Only genuinely new emails get a
 * new account.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams

  // The user hit "Cancel", or Google rejected the request outright.
  const oauthError = params.get('error')
  if (oauthError) {
    return failure(
      request,
      oauthError === 'access_denied'
        ? 'Google sign-in was cancelled'
        : 'Google sign-in failed. Please try again.'
    )
  }

  if (!google.isConfigured) {
    return failure(request, 'Google sign-in is not configured')
  }

  const transaction = readTransaction(request)
  const code = params.get('code')
  const state = params.get('state')

  if (!transaction || !state || !isValidState(state, transaction.n)) {
    return failure(request, 'Sign-in session expired. Please try again.')
  }
  if (!code) {
    return failure(request, 'Google did not return an authorization code')
  }

  try {
    const profile = await exchangeCodeForProfile(code, transaction.v)

    // An unverified address proves nothing, so it must never be used to claim
    // an existing SplitKaro account.
    if (!profile.emailVerified) {
      return failure(
        request,
        'Your Google email is not verified. Verify it with Google, then try again.'
      )
    }

    await connectDB()

    const existing = await findLinkedUser(profile)

    if (existing?.googleId && existing.googleId !== profile.sub) {
      return failure(
        request,
        'This email is already linked to a different Google account.'
      )
    }

    const user = existing
      ? await linkGoogleAccount(existing, profile)
      : await createGoogleUser(profile)

    // New Google users have no UPI ID yet — collect it before they land in the
    // app, the same way the OTP signup form requires one.
    const destination = user.upiId
      ? safeRedirectPath(transaction.r)
      : `/complete-profile?redirect=${encodeURIComponent(safeRedirectPath(transaction.r))}`

    const response = NextResponse.redirect(new URL(destination, request.nextUrl.origin))
    setAuthCookie(response, signJWT(user._id.toString()))
    clearTransactionCookie(response)

    return response
  } catch (error) {
    console.error('Google callback error:', error)
    return failure(request, 'Could not complete Google sign-in. Please try again.')
  }
}

/**
 * Find the SplitKaro account this Google user should sign into.
 *
 * Order matters: the linked Google ID is authoritative, then an exact email
 * match, and finally — for Gmail only — a dot/plus-insensitive match, because
 * Gmail delivers every such spelling to the same inbox and an old signup may
 * have used a different one.
 */
async function findLinkedUser(profile: GoogleProfile): Promise<UserDoc | null> {
  const byGoogleId = await User.findOne({ googleId: profile.sub })
  if (byGoogleId) return byGoogleId

  const byEmail = await User.findOne({ email: profile.email })
  if (byEmail) return byEmail

  const gmailPattern = gmailVariantPattern(profile.email)
  if (!gmailPattern) return null

  const byGmailVariant = await User.findOne({ email: gmailPattern })
  if (byGmailVariant) {
    console.info(
      `Google sign-in matched existing account by Gmail alias: ${byGmailVariant.email}`
    )
  }
  return byGmailVariant
}

/**
 * Attach the Google identity to an existing account.
 *
 * The stored `email` is deliberately left untouched — it is what friends,
 * invites and group memberships already reference, and the user chose it.
 */
async function linkGoogleAccount(
  user: UserDoc,
  profile: GoogleProfile
): Promise<UserDoc> {
  user.googleId = profile.sub
  user.googleEmail = profile.email !== user.email ? profile.email : undefined
  user.googleLinkedAt ??= new Date()

  // Fill in gaps only; never overwrite something the user set themselves.
  if (!user.avatarUrl && profile.picture) user.avatarUrl = profile.picture
  if (!user.name && profile.name) user.name = profile.name

  // A pending OTP is moot now that Google has authenticated them.
  user.otp = undefined

  await user.save()
  return user
}

async function createGoogleUser(profile: GoogleProfile): Promise<UserDoc> {
  try {
    return await User.create({
      name: profile.name?.trim() || profile.email.split('@')[0],
      email: profile.email,
      upiId: '',
      avatarUrl: profile.picture,
      googleId: profile.sub,
      googleLinkedAt: new Date(),
    })
  } catch (error) {
    // Two tabs racing the same first-time sign-in: the loser re-reads the
    // winner's document instead of failing.
    if (isDuplicateKeyError(error)) {
      const existing = await User.findOne({
        $or: [{ googleId: profile.sub }, { email: profile.email }],
      })
      if (existing) return existing
    }
    throw error
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === 11000
  )
}

function readTransaction(request: NextRequest): OAuthTransaction | null {
  const raw = request.cookies.get(OAUTH_COOKIE_NAME)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as OAuthTransaction
    if (typeof parsed?.n !== 'string' || typeof parsed?.v !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

/** Send the user back to the login page with a readable reason. */
function failure(request: NextRequest, message: string): NextResponse {
  const loginUrl = new URL('/login', request.nextUrl.origin)
  loginUrl.searchParams.set('error', message)

  const response = NextResponse.redirect(loginUrl)
  clearTransactionCookie(response)
  return response
}

function clearTransactionCookie(response: NextResponse): void {
  response.cookies.set(OAUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: OAUTH_COOKIE_PATH,
    maxAge: 0,
  })
}
