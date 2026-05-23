import { NextRequest, NextResponse } from "next/server";
import { verifyJWT, getAuthCookie } from "./auth";
import { connectDB } from "./db";
import User from "@/models/User";
import type { IUser } from "@/types";

/**
 * API route auth middleware.
 *
 * Reads the JWT from the `sk_token` cookie, verifies it, and returns the
 * full user document. Returns a 401 JSON response if auth fails.
 *
 * Usage in API routes:
 * ```ts
 * const result = await authMiddleware(request);
 * if (result instanceof NextResponse) return result;
 * const user = result;
 * ```
 */
export async function authMiddleware(
  request: NextRequest
): Promise<IUser | NextResponse> {
  const token = getAuthCookie(request);

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { userId } = verifyJWT(token);
    await connectDB();

    const user = await User.findById(userId).lean<IUser>();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    return user;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
