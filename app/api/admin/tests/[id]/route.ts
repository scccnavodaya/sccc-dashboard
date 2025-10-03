// app/api/admin/tests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const sb = adminClient();
    const body = await req.json();

    const patch: any = {};
    if (body.section) {
      const s = String(body.section).toUpperCase();
      if (!["MAT","ENGLISH","MATHS"].includes(s)) return NextResponse.json({ error: "Invalid section." }, { status: 400 });
      patch.section = s;
    }
    if (body.test_date) patch.test_date = String(body.test_date);
    const perQ = 1.25;

    if (body.total_questions !== undefined || body.questions !== undefined) {
      const tq = Number(body.total_questions ?? body.questions);
      if (!Number.isFinite(tq) || tq <= 0) return NextResponse.json({ error: "Total questions must be > 0." }, { status: 400 });
      patch.total_questions = tq;
      patch.questions = tq; // keep legacy in sync
      patch.total_marks = tq * perQ;

      // Update marks.score with new total
      const { data: markRows, error: mErr } = await sb.from("marks").select("id, wrong").eq("test_id", id);
      if (mErr) throw mErr;
      if (markRows?.length) {
        const updates = markRows.map((r: any) => {
          const wrong = Math.max(0, Math.min(Number(r.wrong || 0), tq));
          return { id: r.id, score: Math.max(0, (tq - wrong) * perQ) };
        });
        const { error: uErr } = await sb.from("marks").upsert(updates, { onConflict: "id" });
        if (uErr) throw uErr;
      }
    }

    if (Object.keys(patch).length) {
      const { error } = await sb.from("tests").update(patch).eq("id", id);
      if (error) throw error;
    }

    try { await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/revalidate`, { method: "POST" }); } catch {}
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update test." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const sb = adminClient();

    // If FK is not ON DELETE CASCADE, delete marks first
    await sb.from("marks").delete().eq("test_id", id);
    const { error } = await sb.from("tests").delete().eq("id", id);
    if (error) throw error;

    try { await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/revalidate`, { method: "POST" }); } catch {}
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete test." }, { status: 500 });
  }
}
