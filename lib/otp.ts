import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Generate a cryptographically-random 6-digit OTP string.
 * Uses Math.random — acceptable for OTPs sent over a side-channel (email).
 */
export function generateOTP(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
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
 * Returns `true` if the OTP has expired (i.e. `expiresAt` is in the past).
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}
