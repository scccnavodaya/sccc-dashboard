// app/api/auth/change-credentials/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

// ---- Helpers ----
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT secret missing");
  return new TextEncoder().encode(secret);
}

async function getAuth() {
  const cookieStore = await cookies(); // 👈 await
  const token = cookieStore.get("sccc_token")?.value;
  if (!token) throw new Error("UNAUTHENTICATED");

  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });
  return { token, payload };
}

async function signJWT(payload: Record<string, unknown>, expiresIn = "7d") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

// Same rules as UI: 8–64, 1 lower, 1 upper, 1 number, 1 special
const PASSWORD_RX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,64}$/;

// ---- Handler ----
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username: string | undefined =
      typeof body?.username === "string" && body.username.trim()
        ? body.username.trim()
        : undefined;
    const currentPassword: string = body?.currentPassword ?? "";
    const newPassword: string | undefined =
      typeof body?.newPassword === "string" && body.newPassword
        ? body.newPassword
        : undefined;

    if (!currentPassword || (!username && !newPassword)) {
      return NextResponse.json(
        {
          error:
            "Provide current password and at least one change (username or password).",
        },
        { status: 400 }
      );
    }

    // Auth (from cookie)
    const { payload } = await getAuth();
    const adminId = String(payload.sub ?? "");

    // Supabase (service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch admin
    const { data: admin, error: fetchErr } = await supabase
      .from("admins")
      .select("*")
      .eq("id", adminId)
      .single();

    if (fetchErr || !admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Verify current password
    const ok = await compare(currentPassword, admin.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Build updates
    const updates: Record<string, any> = {};
    let usernameChanged = false;

    if (username && username !== admin.username) {
      updates.username = username;
      usernameChanged = true;
    }

    if (newPassword) {
      if (!PASSWORD_RX.test(newPassword)) {
        return NextResponse.json(
          {
            error:
              "Password must be 8–64 chars and include 1 lowercase, 1 uppercase, 1 number, and 1 special.",
          },
          { status: 400 }
        );
      }
      updates.password_hash = await hash(newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: "No changes" });
    }

    // Update in DB
    const { error: updErr } = await supabase
      .from("admins")
      .update(updates)
      .eq("id", adminId);

    if (updErr) {
      // e.g., unique violation on username
      return NextResponse.json({ error: updErr.message }, { status: 400 });
    }

    // If username changed, refresh JWT so /api/auth/me reflects it
    if (usernameChanged) {
      const token = await signJWT({
        sub: adminId,
        username: updates.username,
      });

      const cookieStore = await cookies(); // 👈 await
      cookieStore.set("sccc_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e?.message || "Server error";
    const code = msg === "UNAUTHENTICATED" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
