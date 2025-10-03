// lib/auth.ts
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"; // ✅ fallback for local dev

export type SessionPayload = {
  sub: string;        // user id
  username: string;   // admin username
  iat?: number;       // issued at (auto by jwt)
  exp?: number;       // expiry (auto by jwt)
};

/**
 * Sign a JWT session token
 */
export function signSession(
  payload: Omit<SessionPayload, "iat" | "exp">,
  days = 7
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: `${days}d` });
}

/**
 * Verify & decode a JWT session token
 * Throws if invalid or expired
 */
export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, JWT_SECRET) as SessionPayload;
}

/**
 * Build a Set-Cookie string for the session cookie.
 * Adds `Secure` only in production.
 */
export function getCookieHeader(
  name: string,
  value: string,
  maxAgeDays = 7,
  { isProd = process.env.NODE_ENV === "production" } = {}
): string {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  const parts = [
    `${name}=${value}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProd) parts.push("Secure"); // ❗ only add Secure in prod
  return parts.join("; ");
}

/**
 * Build a cookie-clearing header (Max-Age=0)
 */
export function getClearCookieHeader(
  name: string,
  { isProd = process.env.NODE_ENV === "production" } = {}
): string {
  const parts = [
    `${name}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}
