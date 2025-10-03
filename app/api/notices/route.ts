// app/api/notices/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "notices";

function pub(path?: string | null) {
  if (!path) return null;
  return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("notices")
    .select("id, kind, title, body, file_path, poster_path, is_live, created_at")
    .eq("is_live", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map((n) => ({
    id: n.id,
    type: n.kind as "image" | "video",
    title: n.title ?? "",
    body: n.body ?? "",
    src: pub(n.file_path)!,            // public URL for the media
    poster: pub(n.poster_path),        // optional video poster
    startAt: n.created_at,             // used to show "NEW"
  }));

  // send at most 5 to the board (carousel handles 1..5)
  return NextResponse.json(items.slice(0, 5));
}
