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
if (jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

/** JWT token lifetime (default 7d) */
export const jwtExpiresIn = env("JWT_EXPIRES_IN", "7d");

/** SMTP configuration */
export const smtp = {
  host: env("SMTP_HOST"),
  port: parseInt(env("SMTP_PORT", "587"), 10),
  user: env("SMTP_USER"),
  pass: env("SMTP_PASS"),
} as const;

/**
 * Sender address for outgoing emails.
 *
 * IMPORTANT: when sending through a personal Gmail SMTP account, this MUST use
 * the same gmail.com address that authenticates with SMTP (smtp.user) — or a
 * verified "Send mail as" alias. A mismatched From (e.g. a custom domain you
 * don't have SPF/DKIM/DMARC set up for) fails authentication alignment and
 * Gmail routes the message straight to spam.
 */
export const emailFrom = env("EMAIL_FROM", `SplitKaro <${smtp.user}>`);

/** Public-facing app URL (no trailing slash) */
export const appUrl = env("NEXT_PUBLIC_APP_URL", "http://localhost:3000").replace(
  /\/+$/,
  ""
);

/**
 * Google OAuth credentials.
 *
 * Optional: when either value is missing, `isConfigured` is false and the
 * sign-in routes fail gracefully instead of crashing the whole app at boot.
 */
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";

export const google = {
  clientId: googleClientId,
  clientSecret: googleClientSecret,
  /** Must match an authorised redirect URI in the Google Cloud Console */
  redirectUri: `${appUrl}/api/auth/google/callback`,
  isConfigured: Boolean(googleClientId && googleClientSecret),
} as const;
