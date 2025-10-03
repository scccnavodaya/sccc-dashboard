// app/api/admin/tests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/admin/tests?section=MAT
export async function GET(req: NextRequest) {
  try {
    const sb = adminClient();
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");

    let q = sb
      .from("tests")
      .select("id, section, test_date, questions, total_questions, total_marks, created_at")
      .order("test_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (section) q = q.eq("section", section);

    const { data: tests, error } = await q;
    if (error) throw error;
    if (!tests?.length) return NextResponse.json([], { status: 200 });

    // count marks in JS (no .group())
    const ids = tests.map(t => t.id);
    const { data: markRows, error: mErr } = await sb.from("marks").select("test_id").in("test_id", ids);
    if (mErr) throw mErr;

    const countMap = new Map<string, number>();
    (markRows || []).forEach((r: any) => countMap.set(r.test_id, (countMap.get(r.test_id) ?? 0) + 1));

    const out = tests.map((t: any) => ({
      id: t.id,
      section: t.section,
      test_date: t.test_date,
      total_questions: t.total_questions ?? t.questions ?? 0,
      total_marks: t.total_marks ?? ((t.total_questions ?? t.questions ?? 0) * 1.25),
      created_at: t.created_at,
      marks_count: countMap.get(t.id) ?? 0,
    }));

    return NextResponse.json(out, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not load tests." }, { status: 500 });
  }
}

// POST /api/admin/tests
// body: { section, test_date, total_questions, marks: [{student_id, wrong}] }
export async function POST(req: NextRequest) {
  try {
    const sb = adminClient();
    const body = await req.json();

    const section = String(body.section || "").toUpperCase();
    const test_date = String(body.test_date || "");
    const total_questions = Number(body.total_questions ?? body.questions ?? 0);
    const marks = Array.isArray(body.marks) ? body.marks : [];

    if (!["MAT", "ENGLISH", "MATHS"].includes(section))
      return NextResponse.json({ error: "Invalid section." }, { status: 400 });
    if (!test_date) return NextResponse.json({ error: "Missing test date." }, { status: 400 });
    if (!Number.isFinite(total_questions) || total_questions <= 0)
      return NextResponse.json({ error: "Total questions must be > 0." }, { status: 400 });

    const perQ = 1.25;
    const total_marks = total_questions * perQ;

    // write BOTH columns to satisfy legacy NOT NULL on 'questions'
    const { data: testRow, error: tErr } = await sb
      .from("tests")
      .insert([{ section, test_date, questions: total_questions, total_questions, total_marks }])
      .select("id, total_questions")
      .single();
    if (tErr) throw tErr;

    const tq = testRow.total_questions;

    const cleanMarks = marks
      .filter((m: any) => m?.student_id)
      .map((m: any) => {
        const wrong = Math.max(0, Math.min(Number(m.wrong || 0), tq));
        const score = Math.max(0, (tq - wrong) * perQ);
        return { test_id: testRow.id, student_id: m.student_id, wrong, score };
      });

    if (cleanMarks.length) {
      const { error: mErr } = await sb.from("marks").insert(cleanMarks);
      if (mErr) throw mErr;
    }

    // kick public caches
    try { await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/revalidate`, { method: "POST" }); } catch {}

    return NextResponse.json({ id: testRow.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not save test." }, { status: 500 });
  }
}
