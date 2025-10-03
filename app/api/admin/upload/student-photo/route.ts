// app/api/admin/upload/student-photo/route.ts
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

function extFromMime(mime: string) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return null;
}

export async function POST(req: Request) {
  try {
    await requireAuth();
    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");
    if (!studentId) return NextResponse.json({ error: "studentId is required" }, { status: 400 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file is required" }, { status: 400 });

    const ext = extFromMime(file.type);
    if (!ext) return NextResponse.json({ error: "Only JPEG/PNG allowed" }, { status: 400 });
    if (file.size > 4 * 1024 * 1024) // 4MB
      return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });

    // Ensure student exists
    const { data: student, error: sErr } = await supabase
      .from("students").select("id").eq("id", studentId).single();
    if (sErr || !student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const path = `${studentId}.${ext}`;
    const { error: upErr } = await supabase
      .storage.from("student-photos")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

    const { data: pub } = supabase.storage.from("student-photos").getPublicUrl(path);
    const photo_url = pub.publicUrl;

    const { error: updErr } = await supabase
      .from("students").update({ photo_path: path, photo_url }).eq("id", studentId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, path, url: photo_url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: e?.message === "UNAUTHENTICATED" ? 401 : 500 }
    );
  }
}
