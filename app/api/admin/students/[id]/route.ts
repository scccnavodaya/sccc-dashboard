// app/api/admin/students/[id]/route.ts
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
  const c = await cookies();
  const token = c.get("sccc_token")?.value;
  if (!token) throw new Error("UNAUTHENTICATED");
  const key = new TextEncoder().encode(process.env.JWT_SECRET!);
  await jwtVerify(token, key, { algorithms: ["HS256"] });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const updates: Record<string, any> = {};

    if (typeof body.name === "string") {
      const v = body.name.trim();
      if (!v) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      updates.name = v;
    }
    if (typeof body.active === "boolean") updates.active = body.active;

    if (!Object.keys(updates).length)
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });

    const { data, error } = await supabase
      .from("students")
      .update(updates)
      .eq("id", id)
      .select("id,name,active,photo_path,photo_url,created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: e?.message === "UNAUTHENTICATED" ? 401 : 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth();
    const { error } = await supabase.from("students").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: e?.message === "UNAUTHENTICATED" ? 401 : 500 }
    );
  }
}
