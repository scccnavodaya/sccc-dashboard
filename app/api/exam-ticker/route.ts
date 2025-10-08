import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const TABLE = "exam_notices";

// ✅ GET all exam notices (latest first)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .order("start_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// ✅ POST (publish new notice)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body?.text?.trim?.();
    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    // 🔹 Set all others inactive before inserting new one
    await supabaseAdmin.from(TABLE).update({ is_active: false }).eq("is_active", true);

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert({
        text,
        is_active: true,
        start_at: new Date().toISOString(),
        release_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to insert notice" },
      { status: 500 }
    );
  }
}
