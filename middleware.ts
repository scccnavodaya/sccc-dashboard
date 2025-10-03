// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

async function verifyJWT(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  const key = new TextEncoder().encode(secret);
  await jwtVerify(token, key, { algorithms: ["HS256"] }); // throws if invalid/expired
}

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // Guard both admin pages and admin API
  const protect =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (protect) {
    const token = req.cookies.get("sccc_token")?.value;
    if (!token) return NextResponse.redirect(`${origin}/`);

    try {
      await verifyJWT(token);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
