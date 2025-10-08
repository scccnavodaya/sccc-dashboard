// app/api/admin/feed/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * TODO: implement a real admin/session verification here.
 * For now this is a no-op placeholder so your admin UI can work while
 * you implement auth. Replace it with proper checks that throw
 * Error("Unauthorized") when the request is not from an admin.
 */
async function requireAdmin(req: Request): Promise<void> {
  // Example:
  // const cookie = req.headers.get("cookie") || "";
  // const session = await verifySessionFromCookie(cookie);
  // if (!session?.isAdmin) throw new Error("Unauthorized");
  return;
}

export async function GET(req: Request) {
  try {
    await requireAdmin(req);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_feed")
      .select("id, section, title, content, is_html, created_at, updated_at, deleted")
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Return the raw rows (admin UI expects an array)
    return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 });
  } catch (err: any) {
    const message = err?.message ?? "Failed to fetch feed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * POST: add content.
 * - For section === "rules" we always INSERT a new row (rules are multiple).
 * - For other single sections (e.g. "gk") we upsert: if a non-deleted row exists, update it; otherwise insert.
 */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);

    const body = await req.json().catch(() => ({}));
    const section = String(body.section ?? "").trim();
    const content = String(body.content ?? "").trim();
    const title = body.title != null ? String(body.title) : null;
    const is_html = Boolean(body.is_html);

    if (!section || !content) {
      return NextResponse.json({ error: "Section and content required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    if (section.toLowerCase() === "rules") {
      // Always insert a new rule row
      const insertRes = await supabase.from("site_feed").insert([
        { section: "rules", title, content, is_html, created_at: now, updated_at: now, deleted: false },
      ]);

      if (insertRes.error) throw insertRes.error;
      return NextResponse.json({ ok: true }, { status: 201 });
    } else {
      // Single-row sections (e.g. 'gk') — upsert: update existing non-deleted row or insert new
      const existingRes = await supabase
        .from("site_feed")
        .select("id")
        .eq("section", section)
        .eq("deleted", false)
        .limit(1);

      if (existingRes.error) throw existingRes.error;

      if (Array.isArray(existingRes.data) && existingRes.data.length > 0) {
        const id = existingRes.data[0].id;
        const updateRes = await supabase
          .from("site_feed")
          .update({ content, title, is_html, updated_at: now })
          .eq("id", id);

        if (updateRes.error) throw updateRes.error;
        return NextResponse.json({ ok: true }, { status: 200 });
      } else {
        const insertRes = await supabase.from("site_feed").insert([
          { section, title, content, is_html, created_at: now, updated_at: now, deleted: false },
        ]);
        if (insertRes.error) throw insertRes.error;
        return NextResponse.json({ ok: true }, { status: 201 });
      }
    }
  } catch (err: any) {
    const message = err?.message ?? "Failed to save feed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
