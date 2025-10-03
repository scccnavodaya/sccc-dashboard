import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type ExamNotice = {
  id: string;
  text: string;
  active: boolean;
  start_at: string;
  end_at: string | null;
};

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("exam_ticker")
      .select("*")
      .order("start_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data as ExamNotice[]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to load" }, { status: 500 });
  }
}

/**
 * Create AND make it the active notice.
 * Server-side guarantees only one 'active' at a time.
 * Body: { text: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // 1) deactivate any current active
    const { error: deactErr } = await supabaseAdmin
      .from("exam_ticker")
      .update({ active: false, end_at: new Date().toISOString() })
      .eq("active", true);
    if (deactErr) throw deactErr;

    // 2) insert new as active
    const { data, error } = await supabaseAdmin
      .from("exam_ticker")
      .insert({ text, active: true, start_at: new Date().toISOString(), end_at: null })
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create" }, { status: 500 });
  }
}
