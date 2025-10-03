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

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const startISO = start.toISOString().slice(0, 10); // YYYY-MM-DD
    const endISO = end.toISOString().slice(0, 10);

    // 1) Tests in the month
    const { data: tests, error: tErr } = await supabase
      .from("tests")
      .select("id, section, test_date")
      .gte("test_date", startISO)
      .lt("test_date", endISO)
      .order("test_date", { ascending: true });

    if (tErr) {
      return NextResponse.json({ error: tErr.message }, { status: 400 });
    }

    // 2) Marks for those tests
    const testIds = (tests ?? []).map((t) => t.id);
    let marks: Array<{ test_id: string; student_id: string; score: number | null }> = [];

    if (testIds.length > 0) {
      const { data: marksRows, error: mErr } = await supabase
        .from("marks")
        .select("test_id, student_id, score")
        .in("test_id", testIds);

      if (mErr) {
        return NextResponse.json({ error: mErr.message }, { status: 400 });
      }
      marks = (marksRows ?? []).map((m) => ({
        test_id: m.test_id,
        student_id: m.student_id,
        score: m.score, // may be null => absent
      }));
    }

    return new NextResponse(
      JSON.stringify({
        tests: tests ?? [],
        marks,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, s-maxage=60, stale-while-revalidate=60",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
