// app/api/public/stats/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function monthBounds(ym: string) {
  // ym = "2025-09"
  const [yStr, mStr] = ym.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  if (!year || !month || month < 1 || month > 12) {
    throw new Error("Invalid ym");
  }
  // JS Date uses local tz; we want clean ISO date boundaries.
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  return { startIso, endIso };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ym = searchParams.get("ym");
    if (!ym) {
      return NextResponse.json({ error: "Missing ym" }, { status: 400 });
    }
    const { startIso, endIso } = monthBounds(ym);

    // 1) total active students
    const studentsRes = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("active", true);

    const studentsTotal = studentsRes.count ?? 0;

    // 2) attended in month (distinct student_id with a non-null score on a test in that month)
    // Join marks -> tests and filter by tests.test_date.
    const attendedRes = await supabase
      .from("marks")
      .select("student_id, tests!inner(test_date)")
      .not("score", "is", null)
      .gte("tests.test_date", startIso)
      .lt("tests.test_date", endIso);

    let attendedInMonth = 0;
    if (!attendedRes.error && attendedRes.data) {
      const distinct = new Set(attendedRes.data.map((r: any) => r.student_id));
      attendedInMonth = distinct.size;
    }

    // 3) tests in month
    const testsRes = await supabase
      .from("tests")
      .select("id", { count: "exact", head: true })
      .gte("test_date", startIso)
      .lt("test_date", endIso);

    const testsInMonth = testsRes.count ?? 0;

    // 4) live notices as of now
    const nowIso = new Date().toISOString();
    const noticesRes = await supabase
      .from("notices")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .lte("release_at", nowIso)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

    const noticesLive = noticesRes.count ?? 0;

    return NextResponse.json({
      studentsTotal,
      attendedInMonth,
      testsInMonth,
      noticesLive,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
