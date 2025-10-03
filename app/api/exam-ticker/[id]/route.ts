import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const body = await _req.json().catch(() => ({}));
    const updates: any = {};

    if (typeof body.text === "string") {
      const text = body.text.trim();
      if (!text) return NextResponse.json({ error: "Text cannot be empty" }, { status: 400 });
      updates.text = text;
    }

    if (typeof body.active === "boolean") {
      const makeActive = body.active === true;

      if (makeActive) {
        // set all others inactive
        const { error: deactErr } = await supabaseAdmin
          .from("exam_ticker")
          .update({ active: false, end_at: new Date().toISOString() })
          .eq("active", true)
          .neq("id", id);
        if (deactErr) throw deactErr;

        updates.active = true;
        updates.end_at = null; // live
        // keep start_at if already present
      } else {
        updates.active = false;
        updates.end_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("exam_ticker")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const { error } = await supabaseAdmin.from("exam_ticker").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to delete" }, { status: 500 });
  }
}
