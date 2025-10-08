// app/api/public/scores/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/public/scores?ym=YYYY-MM
 * Returns:
 * {
 *   tests: [{ id, section, test_date }],
 *   marks: [{ test_id, student_id, score }]
 * }
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ym = searchParams.get("ym");
    if (!ym) {
      return NextResponse.json({ error: "Missing ym" }, { status: 400 });
    }

    const [yearStr, monthStr] = ym.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid ym" }, { status: 400 });
    }

    // Use start/end date strings (YYYY-MM-DD)
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    // Use only date portion (this is safe if test_date column is DATE)
    const startISO = start.toISOString().slice(0, 10);
    const endISO = end.toISOString().slice(0, 10);

    // 1) Tests in the month
    const { data: tests, error: tErr } = await supabase
      .from("tests")
      .select("id, section, test_date")
      .gte("test_date", startISO)
      .lt("test_date", endISO)
      .order("test_date", { ascending: true });

    if (tErr) {
      console.error("[api/public/scores] tests query error:", tErr);
      return NextResponse.json({ error: tErr.message, tests: [], marks: [] }, { status: 500 });
    }

    // 2) Marks for those tests
    const testIds = (tests ?? []).map((t: any) => t?.id).filter(Boolean);
    let marks: Array<{ test_id: string; student_id: string; score: number | null }> = [];

    if (testIds.length > 0) {
      const { data: marksRows, error: mErr } = await supabase
        .from("marks")
        .select("test_id, student_id, score")
        .in("test_id", testIds);

      if (mErr) {
        console.error("[api/public/scores] marks query error:", mErr);
        return NextResponse.json({ error: mErr.message, tests: tests ?? [], marks: [] }, { status: 500 });
      }

      marks = (marksRows ?? []).map((m: any) => ({
        test_id: String(m.test_id),
        student_id: String(m.student_id),
        score: m.score === null ? null : Number(m.score),
      }));
    }

    // Always return stable shape
    const payload = {
      tests: (tests ?? []).map((t: any) => ({
        id: String(t.id ?? ""),
        section: (t.section ?? "").toString(),
        test_date: String(t.test_date ?? ""),
      })),
      marks,
    };

    // Server-side log to help debugging
    console.log(`[api/public/scores] ym=${ym} -> tests=${payload.tests.length} marks=${payload.marks.length}`);

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        "content-type": "application/json",
        // short edge cache; adjust as needed
        "cache-control": "public, s-maxage=60, stale-while-revalidate=60",
      },
    });
  } catch (e: any) {
    console.error("[api/public/scores] unhandled error:", e);
    return NextResponse.json({ error: e?.message || "Server error", tests: [], marks: [] }, { status: 500 });
  }
}
