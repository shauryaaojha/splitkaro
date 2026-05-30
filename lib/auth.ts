import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { jwtSecret, jwtExpiresIn } from "./config";
import { connectDB } from "./db";
import User from "@/models/User";
import type { IUser } from "@/types";

const COOKIE_NAME = "sk_token";
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

interface JwtPayload {
  userId: string;
}

/**
 * Create a signed JWT containing the user's ID.
 */
export function signJWT(userId: string): string {
  return jwt.sign({ userId } satisfies JwtPayload, jwtSecret, {
    expiresIn: jwtExpiresIn as SignOptions["expiresIn"],
  });
}

/**
 * Verify a JWT and return its payload.
 * Throws if the token is invalid or expired.
 */
export function verifyJWT(token: string): JwtPayload {
  return jwt.verify(token, jwtSecret) as JwtPayload;
}

/**
 * Write the auth token into an HTTP-only, secure cookie on the response.
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_S,
  });
}

/**
 * Read the auth token from the request cookies.
 */
export function getAuthCookie(request: NextRequest): string | undefined {
  return request.cookies.get(COOKIE_NAME)?.value;
}

/**
 * Full-stack helper: verify the cookie token and load the user document.
 * Returns `null` if the token is missing / invalid or the user doesn't exist.
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<IUser | null> {
  const token = getAuthCookie(request);
  if (!token) return null;

  try {
    const { userId } = verifyJWT(token);
    await connectDB();
    const user = await User.findById(userId).lean<IUser>();
    return user;
  } catch {
    return null;
  }
}
