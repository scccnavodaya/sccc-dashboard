// app/api/admin/students/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireAuth() {
  const c = await cookies(); // Next 15 returns a promise
  const token = c.get("sccc_token")?.value;
  if (!token) throw new Error("UNAUTHENTICATED");
  const key = new TextEncoder().encode(process.env.JWT_SECRET!);
  await jwtVerify(token, key, { algorithms: ["HS256"] }); // throws if invalid
}

/**
 * GET /api/admin/students
 * Optional query params:
 *   - q=searchText
 *   - status=all|active|inactive  (default: all)
 *   - order=asc|desc              (default: asc => first-added-first)
 */
export async function GET(req: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const status = (searchParams.get("status") || "all") as
      | "all"
      | "active"
      | "inactive";
    const order = (searchParams.get("order") || "asc") as "asc" | "desc";

    let query = supabase
      .from("students")
      .select("id,name,active,photo_path,photo_url,created_at", { count: "exact" })
      .order("created_at", { ascending: order === "asc" });

    if (status !== "all") {
      query = query.eq("active", status === "active");
    }
    if (q) {
      // case-insensitive contains
      query = query.ilike("name", `%${q}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: e?.message === "UNAUTHENTICATED" ? 401 : 500 }
    );
  }
}

/**
 * POST /api/admin/students
 * body: { name: string }
 */
export async function POST(req: Request) {
  try {
    await requireAuth();
    const body = await req.json().catch(() => ({}));
    const name: string | undefined = body?.name;

    const trimmed = name?.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    if (trimmed.length > 100) {
      return NextResponse.json(
        { error: "Name is too long (max 100 chars)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("students")
      .insert({ name: trimmed, active: true })
      .select("id,name,active,photo_path,photo_url,created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: e?.message === "UNAUTHENTICATED" ? 401 : 500 }
    );
  }
}
