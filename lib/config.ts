function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

/** MongoDB connection string */
export const mongoUri = env("MONGODB_URI");

/** JWT signing secret */
export const jwtSecret = env("JWT_SECRET");

/** JWT token lifetime (default 7d) */
export const jwtExpiresIn = env("JWT_EXPIRES_IN", "7d");

/** SMTP configuration */
export const smtp = {
  host: env("SMTP_HOST"),
  port: parseInt(env("SMTP_PORT", "587"), 10),
  user: env("SMTP_USER"),
  pass: env("SMTP_PASS"),
} as const;

/** Sender address for outgoing emails */
export const emailFrom = env("EMAIL_FROM", "SplitKaro <noreply@splitkaro.app>");

/** Public-facing app URL (no trailing slash) */
export const appUrl = env("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
