import { NextResponse } from "next/server";
import { getSupabaseAdmin, publicURL } from "@/lib/supabaseAdmin";

const BUCKET = "notices";

/** GET /api/admin/notices/[id] — fetch a single notice by id */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("notices")
      .select(
        "id, kind, title, body, file_path, poster_path, is_live, created_at"
      )
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    const item = {
      id: data.id,
      type: (data.kind as "image" | "video") ?? "image",
      title: data.title ?? "",
      body: data.body ?? "",
      src: publicURL(BUCKET, data.file_path),
      poster: publicURL(BUCKET, data.poster_path),
      startAt: data.created_at,
      is_live: !!data.is_live,
    };

    return NextResponse.json(item);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE /api/admin/notices/[id] — delete a notice by id */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("notices").delete().eq("id", params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
