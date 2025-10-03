// app/api/admin/upload/notice-media/route.ts
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

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
}
function extFromMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/webm") return "webm";
  return null;
}

export async function POST(req: Request) {
  try {
    await requireAuth();

    const form = await req.formData();
    const file = form.get("file") as File | null;
    const type = (form.get("type") as string | null)?.toLowerCase(); // image|video
    const title = (form.get("title") as string | null) || "Notice";
    const body = (form.get("body") as string | null) || null;
    const releaseAtStr = (form.get("release_at") as string | null) || null;
    const expiresAtStr = (form.get("expires_at") as string | null) || null;
    const isActiveStr = (form.get("is_active") as string | null) ?? "true";

    if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });
    if (!type || !["image", "video"].includes(type))
      return NextResponse.json({ error: "type must be 'image' or 'video'" }, { status: 400 });

    const ext = extFromMime(file.type);
    if (!ext) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });

    // size limits
    if (type === "image" && file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
    if (type === "video" && file.size > 120 * 1024 * 1024)
      return NextResponse.json({ error: "Video too large (max 120MB)" }, { status: 400 });

    const id = crypto.randomUUID();
    const filename = `${id}-${slugify(title)}.${ext}`;

    const { error: upErr } = await supabase
      .storage.from("notices")
      .upload(filename, file, { contentType: file.type, upsert: true });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    const { data: pub } = supabase.storage.from("notices").getPublicUrl(filename);
    const src = pub.publicUrl;

    const payload: any = {
      id,
      type,
      title,
      body,
      src,
      release_at: releaseAtStr ? new Date(releaseAtStr).toISOString() : new Date().toISOString(),
      expires_at: expiresAtStr ? new Date(expiresAtStr).toISOString() : null,
      is_active: isActiveStr === "true",
    };

    const { data, error } = await supabase
      .from("notices")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: data.id, path: filename, url: src });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: e?.message === "UNAUTHENTICATED" ? 401 : 500 }
    );
  }
}
