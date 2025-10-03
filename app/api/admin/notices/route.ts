// app/api/admin/notices/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "notices";

type Kind = "image" | "video";

function boolish(v: FormDataEntryValue | null): boolean {
  if (v == null) return false;
  const s = String(v).toLowerCase().trim();
  return ["1", "true", "yes", "on"].includes(s);
}

function extFromMime(mime: string, fallback = ""): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
  };
  return map[mime] ?? fallback;
}

function yyyymm() {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function publicUrl(path?: string | null) {
  if (!path) return null;
  return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// GET all notices (admin side)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("notices")
    .select("id, kind, title, body, file_path, poster_path, is_live, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((n) => ({
      ...n,
      file_url: publicUrl(n.file_path),
      poster_url: publicUrl(n.poster_path),
    }))
  );
}

// POST upload new notice
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const kind = (form.get("kind") as Kind) || "image";
    const title = (form.get("title") as string) || null;
    const body = (form.get("body") as string) || null;
    const isLive = boolish(form.get("is_live"));

    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

    const id = crypto.randomUUID();
    const folder = yyyymm();
    const fileExt = extFromMime(file.type, kind === "image" ? ".jpg" : ".mp4");
    const mainPath = `${folder}/${id}${fileExt}`;

    // upload main
    {
      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(mainPath, file, { contentType: file.type || "application/octet-stream" });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // optional poster
    let posterPath: string | null = null;
    const poster = form.get("poster") as File | null;
    if (poster) {
      posterPath = `${folder}/${id}_poster.jpg`;
      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(posterPath, poster, { contentType: poster.type || "image/jpeg" });
      if (error) {
        await supabaseAdmin.storage.from(BUCKET).remove([mainPath]).catch(() => {});
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // insert row
    const { data, error: insErr } = await supabaseAdmin
      .from("notices")
      .insert({
        id,
        kind,
        title,
        body,
        file_path: mainPath,
        poster_path: posterPath,
        is_live: isLive,
      })
      .select("*")
      .single();

    if (insErr) {
      await supabaseAdmin.storage.from(BUCKET).remove([mainPath, posterPath || ""].filter(Boolean));
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        ...data,
        file_url: publicUrl(data.file_path),
        poster_url: publicUrl(data.poster_path),
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
