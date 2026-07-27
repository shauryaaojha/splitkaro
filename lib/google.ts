import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { google } from "./config";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const VALID_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

/** Cookie holding the CSRF nonce + PKCE verifier while the user is at Google */
export const OAUTH_COOKIE_NAME = "sk_oauth";
/** Scoped so the cookie is only ever sent to the two Google auth routes */
export const OAUTH_COOKIE_PATH = "/api/auth/google";
/** The round-trip to Google should take seconds, not minutes */
export const OAUTH_COOKIE_MAX_AGE_S = 10 * 60;

export interface OAuthTransaction {
  /** CSRF nonce, echoed back by Google in the `state` param */
  n: string;
  /** PKCE code verifier */
  v: string;
  /** In-app path to land on after a successful sign-in */
  r: string;
}

/** The subset of Google ID-token claims we care about */
export interface GoogleProfile {
  /** Google's stable, unique account ID */
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

interface IdTokenClaims {
  iss?: string;
  aud?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  given_name?: string;
  picture?: string;
}

function base64url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

/** Start a new OAuth transaction: fresh CSRF nonce + PKCE verifier. */
export function createOAuthTransaction(redirectTo: string): OAuthTransaction {
  return {
    n: base64url(randomBytes(24)),
    v: base64url(randomBytes(48)),
    r: redirectTo,
  };
}

/** Constant-time comparison of the returned `state` against the stored nonce. */
export function isValidState(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Build the Google consent-screen URL.
 *
 * `prompt=select_account` lets a user pick which Google account to use rather
 * than being silently signed in with whichever one the browser remembers.
 */
export function buildAuthUrl(transaction: OAuthTransaction): string {
  const challenge = base64url(
    createHash("sha256").update(transaction.v).digest()
  );

  const params = new URLSearchParams({
    client_id: google.clientId,
    redirect_uri: google.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: transaction.n,
    code_challenge: challenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange an authorization code for the user's Google profile.
 *
 * The ID token comes straight from Google's token endpoint over TLS using our
 * client secret, so per Google's own guidance the signature does not need to be
 * re-verified locally — but we still check the issuer, audience and expiry to
 * guard against a misrouted or replayed token.
 */
export async function exchangeCodeForProfile(
  code: string,
  codeVerifier: string
): Promise<GoogleProfile> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: google.clientId,
      client_secret: google.clientSecret,
      redirect_uri: google.redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google token exchange failed (${response.status}): ${detail}`);
  }

  const payload = (await response.json()) as { id_token?: string };
  if (!payload.id_token) {
    throw new Error("Google token response did not include an id_token");
  }

  const claims = decodeIdToken(payload.id_token);

  if (!claims.iss || !VALID_ISSUERS.includes(claims.iss)) {
    throw new Error("ID token has an unexpected issuer");
  }
  if (claims.aud !== google.clientId) {
    throw new Error("ID token was issued for a different client");
  }
  if (!claims.exp || claims.exp * 1000 <= Date.now()) {
    throw new Error("ID token has expired");
  }
  if (!claims.sub || !claims.email) {
    throw new Error("ID token is missing the subject or email claim");
  }

  return {
    sub: claims.sub,
    email: claims.email.trim().toLowerCase(),
    // Google sends this as a boolean in ID tokens, but a string via some legacy
    // endpoints — normalise both.
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    name: claims.name ?? claims.given_name,
    picture: claims.picture,
  };
}

function decodeIdToken(idToken: string): IdTokenClaims {
  const segments = idToken.split(".");
  if (segments.length !== 3) {
    throw new Error("Malformed ID token");
  }
  return JSON.parse(
    Buffer.from(segments[1], "base64url").toString("utf8")
  ) as IdTokenClaims;
}

// ─── Email matching ─────────────────────────────────────────────────────────

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);
/** Gmail caps local parts at 30 chars; this is a generous safety bound */
const MAX_LOCAL_PART = 64;

/**
 * Reduce an address to the form Gmail actually delivers to.
 *
 * Gmail ignores dots and anything after a `+` in the local part, so
 * `john.doe+trips@googlemail.com` and `johndoe@gmail.com` are the same inbox.
 * Non-Gmail addresses are returned lower-cased and otherwise untouched, since
 * that equivalence is a Gmail-specific guarantee.
 */
export function canonicalizeEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const at = lower.lastIndexOf("@");
  if (at === -1) return lower;

  const local = lower.slice(0, at);
  const domain = lower.slice(at + 1);
  if (!GMAIL_DOMAINS.has(domain)) return lower;

  const bare = local.split("+")[0].replace(/\./g, "");
  return `${bare}@gmail.com`;
}

function escapeRegex(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * An anchored pattern matching every Gmail spelling of `email` — any dot
 * placement, either Gmail domain, with or without a `+tag`.
 *
 * Used to find a pre-existing SplitKaro account when someone signed up with,
 * say, `john.doe@gmail.com` but Google hands us back `johndoe@gmail.com`.
 * Returns `null` for non-Gmail addresses, where an exact match is the only
 * safe comparison.
 */
export function gmailVariantPattern(email: string): RegExp | null {
  const [local, domain] = canonicalizeEmail(email).split("@");
  if (domain !== "gmail.com") return null;
  if (!local || local.length > MAX_LOCAL_PART) return null;

  const spacedOutDots = local.split("").map(escapeRegex).join("\\.?");
  return new RegExp(`^${spacedOutDots}(\\+[^@]*)?@(gmail|googlemail)\\.com$`, "i");
}

// ─── Redirect safety ────────────────────────────────────────────────────────

/**
 * Only allow same-origin, single-slash paths through as post-login targets so
 * the OAuth flow can't be turned into an open redirect.
 */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
