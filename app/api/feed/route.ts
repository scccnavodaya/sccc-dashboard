// app/api/feed/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Public feed endpoint — returns only non-deleted rows in a friendly shape:
 * {
 *   rules: [{ id, title, content, is_html, updated_at }, ...],
 *   gk: { id, title, content, is_html, updated_at } | null
 * }
 *
 * Use this from your public HomeScreen.
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("site_feed")
      .select("id, section, title, content, is_html, updated_at")
      .eq("deleted", false)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const rows = Array.isArray(data) ? data : [];

    const out: {
      rules: any[];
      gk: any | null;
      [k: string]: any;
    } = { rules: [], gk: null };

    for (const row of rows) {
      const section = String(row.section ?? "").toLowerCase();
      const item = {
        id: row.id,
        title: row.title ?? null,
        content: row.content ?? "",
        is_html: Boolean(row.is_html),
        updated_at: row.updated_at ?? null,
      };

      if (section === "rules") {
        out.rules.push(item);
      } else if (section === "gk") {
        // Keep only the first GK row (if multiple accidentally exist)
        if (!out.gk) out.gk = item;
      } else {
        // For other sections, expose as array under their name (useful if you have more)
        if (!out[section]) out[section] = [];
        out[section].push(item);
      }
    }

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 });
  }
}
