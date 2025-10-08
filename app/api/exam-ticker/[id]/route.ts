import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const TABLE = "exam_notices";

// ✅ PATCH — update a specific notice
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();

    const fields: Record<string, any> = {};
    if (typeof body.text === "string") fields.text = body.text.trim();
    if (typeof body.is_active === "boolean") fields.is_active = body.is_active;

    // If setting one active → deactivate others
    if (fields.is_active === true) {
      await supabaseAdmin.from(TABLE).update({ is_active: false }).eq("is_active", true);
    }

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(fields)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✅ DELETE — remove a notice
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
