// app/api/admin/notices/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "notices";

// DELETE notice
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  const { data: row } = await supabaseAdmin
    .from("notices")
    .select("file_path, poster_path")
    .eq("id", id)
    .maybeSingle();

  await supabaseAdmin.from("notices").delete().eq("id", id);

  if (row) {
    const paths = [row.file_path, row.poster_path].filter(Boolean) as string[];
    if (paths.length) await supabaseAdmin.storage.from(BUCKET).remove(paths);
  }

  return NextResponse.json({ ok: true });
}

// PATCH update notice (toggle live, update text, etc.)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = await req.json().catch(() => ({}));

  const patch: Record<string, unknown> = {};
  if ("title" in body) patch.title = body.title || null;
  if ("body" in body) patch.body = body.body || null;
  if ("is_live" in body) patch.is_live = !!body.is_live;

  const { data, error } = await supabaseAdmin
    .from("notices")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
