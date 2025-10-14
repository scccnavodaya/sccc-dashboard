// app/api/admin/tests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/admin/tests?section=MAT&month=YYYY-MM
export async function GET(req: NextRequest) {
  try {
    const sb = adminClient();
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");
    const month = searchParams.get("month"); // YYYY-MM

    // Build date range if month provided
    let from: string | null = null;
    let to: string | null = null;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1)); // first of next month
      from = start.toISOString().slice(0, 10);
      to = end.toISOString().slice(0, 10);
    }

    // No schema assumption about marks_per_question
    let q = sb
      .from("tests")
      .select("id, section, test_date, questions, total_questions, total_marks, created_at")
      .order("test_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (section) q = q.eq("section", section);
    if (from && to) q = q.gte("test_date", from).lt("test_date", to);

    const { data: tests, error } = await q;
    if (error) throw error;
    if (!tests?.length) return NextResponse.json([], { status: 200 });

    const ids = tests.map((t) => t.id);
    const { data: markRows, error: mErr } = await sb
      .from("marks")
      .select("test_id")
      .in("test_id", ids);
    if (mErr) throw mErr;

    const countMap = new Map<string, number>();
    (markRows || []).forEach((r: any) => {
      countMap.set(r.test_id, (countMap.get(r.test_id) ?? 0) + 1);
    });

    const out = tests.map((t: any) => {
      const tq = Number(t.total_questions ?? t.questions ?? 0);
      const tm = Number(t.total_marks ?? 0);
      return {
        id: t.id,
        section: t.section,
        test_date: t.test_date,
        total_questions: Number.isFinite(tq) && tq > 0 ? tq : 0,
        // Do NOT inject any default like 1.25 — return stored total_marks or 0
        total_marks: Number.isFinite(tm) && tm > 0 ? tm : 0,
        created_at: t.created_at,
        marks_count: countMap.get(t.id) ?? 0,
      };
    });

    return NextResponse.json(out, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Could not load tests." }, { status: 500 });
  }
}

// POST /api/admin/tests
// body: { section, test_date, total_questions, marks_per_question , marks: [{student_id, wrong}] }
export async function POST(req: NextRequest) {
  try {
    const sb = adminClient();
    const body = await req.json();

    const section = String(body.section || "").toUpperCase();
    const test_date = String(body.test_date || "");
    const total_questions = Number(body.total_questions ?? body.questions ?? 0);
    const mpq = Number(body.marks_per_question ?? body.mark_per_question ?? body.mpq ?? 0);
    const marks = Array.isArray(body.marks) ? body.marks : [];

    if (!["MAT", "ENGLISH", "MATHS"].includes(section))
      return NextResponse.json({ error: "Invalid section." }, { status: 400 });
    if (!test_date) return NextResponse.json({ error: "Missing test date." }, { status: 400 });
    if (!Number.isFinite(total_questions) || total_questions <= 0)
      return NextResponse.json({ error: "Total questions must be > 0." }, { status: 400 });
    if (!Number.isFinite(mpq) || mpq <= 0)
      return NextResponse.json({ error: "Marks per question must be > 0." }, { status: 400 });

    const total_marks = total_questions * mpq;

    // Insert test (no dependency on a marks_per_question column)
    const { data: testRow, error: tErr } = await sb
      .from("tests")
      .insert([{ section, test_date, questions: total_questions, total_questions, total_marks }])
      .select("id, total_questions, total_marks")
      .single();
    if (tErr) throw tErr;

    const tq = Number(testRow.total_questions);

    const cleanMarks = marks
      .filter((m: any) => m?.student_id)
      .map((m: any) => {
        const wrong = Math.max(0, Math.min(Number(m.wrong || 0), tq));
        const score = Math.max(0, (tq - wrong) * mpq);
        return { test_id: testRow.id, student_id: m.student_id, wrong, score };
      });

    if (cleanMarks.length) {
      const { error: mErr } = await sb.from("marks").insert(cleanMarks);
      if (mErr) throw mErr;
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/revalidate`, { method: "POST" });
    } catch {}

    return NextResponse.json({ id: testRow.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save test." }, { status: 500 });
  }
}
