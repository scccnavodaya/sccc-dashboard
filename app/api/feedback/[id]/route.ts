// app/api/feedback/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

type Feedback = {
  id: string;
  parent_name: string;
  student_name: string;
  comment: string;
  read: boolean;
  created_at: string;
};

// Mark read/unread (accept PATCH or legacy PUT)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = (await req.json().catch(() => ({}))) as Partial<Feedback> & { read?: boolean };
  if (typeof body.read !== "boolean") {
    return NextResponse.json({ error: "read required (boolean)" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("feedback")
    .update({ read: body.read })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data as Feedback);
}

// Legacy support: PUT behaves like PATCH
export async function PUT(req: Request, ctx: { params: { id: string } }) {
  return PATCH(req, ctx);
}

// Delete a feedback row
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const { error } = await supabaseAdmin.from("feedback").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
