// app/api/admin/feed/[id]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function requireAdmin(req: Request) {
  // Implement real admin verification. Throw Error("Unauthorized") if not allowed.
  return;
}

function isValidId(id: any) {
  return typeof id === "string" && id.length > 0;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const id = params.id;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const updates: Record<string, any> = {};
    if ("content" in body) updates.content = String(body.content ?? "");
    if ("title" in body) updates.title = body.title != null ? String(body.title) : null;
    if ("is_html" in body) updates.is_html = Boolean(body.is_html);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const supabase = getSupabaseAdmin();
    // ask supabase to return updated row(s)
    const { data, error } = await supabase
      .from("site_feed")
      .update(updates)
      .eq("id", id)
      .select("id");

    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const status = e?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: e?.message || "Failed to update" }, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const id = params.id;
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Soft-delete and return the affected row(s)
    const { data, error } = await supabase
      .from("site_feed")
      .update({ deleted: true, updated_at: now })
      .eq("id", id)
      .select("id");

    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    const status = e?.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: e?.message || "Failed to delete" }, { status });
  }
}
