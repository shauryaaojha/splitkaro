import bcrypt from "bcryptjs";
import { randomInt } from "crypto";

const SALT_ROUNDS = 10;

/**
 * Generate a cryptographically random 6-digit OTP string.
 */
export function generateOTP(): string {
  return randomInt(100_000, 1_000_000).toString();
}

/**
 * Hash an OTP using bcrypt so the plaintext is never stored.
 */
export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, SALT_ROUNDS);
}

/**
 * Compare a plaintext OTP against its bcrypt hash.
 */
export async function verifyOTP(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Returns true if the OTP has expired.
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}
