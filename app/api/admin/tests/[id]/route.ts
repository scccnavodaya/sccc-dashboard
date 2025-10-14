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

    // load current to derive existing mpq if needed
    const { data: current, error: curErr } = await sb
      .from("tests")
      .select("total_questions, questions, total_marks, section, test_date")
      .eq("id", id)
      .single();
    if (curErr) throw curErr;

    const oldTq = Number(current?.total_questions ?? current?.questions ?? 0);
    const oldTm = Number(current?.total_marks ?? 0);
    const derivedOldMpq = oldTq > 0 && Number.isFinite(oldTm) ? oldTm / oldTq : 0;

    // Accept a new MPQ if provided; otherwise keep derived one
    const mpqFromBody = Number(body.marks_per_question ?? body.mark_per_question ?? body.mpq ?? NaN);
    const newMpq =
      Number.isFinite(mpqFromBody) && mpqFromBody > 0
        ? mpqFromBody
        : (Number.isFinite(derivedOldMpq) && derivedOldMpq > 0 ? derivedOldMpq : 0);

    const patch: any = {};

    if (body.section) {
      const s = String(body.section).toUpperCase();
      if (!["MAT", "ENGLISH", "MATHS"].includes(s))
        return NextResponse.json({ error: "Invalid section." }, { status: 400 });
      patch.section = s;
    }
    if (body.test_date) patch.test_date = String(body.test_date);

    // If total_questions is supplied OR mpq is supplied, recompute totals & scores
    const totalQuestionsProvided = body.total_questions !== undefined || body.questions !== undefined;
    const mpqProvided = Number.isFinite(mpqFromBody) && mpqFromBody > 0;

    let newTq = oldTq;
    if (totalQuestionsProvided) {
      newTq = Number(body.total_questions ?? body.questions);
      if (!Number.isFinite(newTq) || newTq <= 0)
        return NextResponse.json({ error: "Total questions must be > 0." }, { status: 400 });
      patch.total_questions = newTq;
      patch.questions = newTq;
    }

    // If either TQ changed or MPQ changed, recompute total_marks and marks.score
    if ((totalQuestionsProvided || mpqProvided) && newMpq > 0) {
      patch.total_marks = newTq * newMpq;

      // Recompute marks scores using newMpq
      const { data: markRows, error: mErr } = await sb
        .from("marks")
        .select("id, wrong")
        .eq("test_id", id);
      if (mErr) throw mErr;

      if (markRows?.length) {
        const updates = markRows.map((r: any) => {
          const wrong = Math.max(0, Math.min(Number(r.wrong || 0), newTq));
          return { id: r.id, score: Math.max(0, (newTq - wrong) * newMpq) };
        });
        const { error: uErr } = await sb.from("marks").upsert(updates, { onConflict: "id" });
        if (uErr) throw uErr;
      }
    }

    if (Object.keys(patch).length) {
      const { error } = await sb.from("tests").update(patch).eq("id", id);
      if (error) throw error;
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/revalidate`, { method: "POST" });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update test." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const sb = adminClient();

    await sb.from("marks").delete().eq("test_id", id);
    const { error } = await sb.from("tests").delete().eq("id", id);
    if (error) throw error;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/revalidate`, { method: "POST" });
    } catch {}

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete test." }, { status: 500 });
  }
}
