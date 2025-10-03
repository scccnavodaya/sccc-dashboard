import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!; // must exist in .env.local

// Sign a token (used in /api/auth/login)
export function sign(payload: object, options?: jwt.SignOptions) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d", ...options });
}

// Verify a token (used in middleware + /api/auth/me)
export function verify<T = any>(token: string): T {
  return jwt.verify(token, SECRET) as T;
}
