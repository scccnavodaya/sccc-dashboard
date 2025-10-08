// app/api/public/stats/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ym = searchParams.get("ym");
    if (!ym) {
      return NextResponse.json({ error: "Missing ym parameter" }, { status: 400 });
    }

    const [yearStr, monthStr] = ym.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: "Invalid ym format" }, { status: 400 });
    }

    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const startISO = start.toISOString().slice(0, 10);
    const endISO = end.toISOString().slice(0, 10);

    // Total students
    const { count: studentsTotal, error: sErr } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true });

    if (sErr) throw sErr;

    // Tests in month
    const { count: testsInMonth, error: tErr, data: testsData } = await supabase
      .from("tests")
      .select("id", { count: "exact" })
      .gte("test_date", startISO)
      .lt("test_date", endISO);

    if (tErr) throw tErr;

    const testIds = (testsData ?? []).map((t: any) => t.id);

    // Distinct students who attended any test in the month
    let attendedInMonth = 0;
    if (testIds.length > 0) {
      const { data: marksRows, error: mErr } = await supabase
        .from("marks")
        .select("student_id")
        .in("test_id", testIds);

      if (mErr) throw mErr;

      const distinctStudents = new Set(marksRows?.map((m) => m.student_id));
      attendedInMonth = distinctStudents.size;
    }

    // Count live notices
    const { count: noticesLive, error: nErr } = await supabase
      .from("notices")
      .select("id", { count: "exact", head: true })
      .eq("is_live", true);

    if (nErr) throw nErr;

    return NextResponse.json({
      studentsTotal: studentsTotal ?? 0,
      attendedInMonth,
      testsInMonth: testsInMonth ?? 0,
      noticesLive: noticesLive ?? 0,
    });
  } catch (e: any) {
    console.error("[api/public/stats] Error:", e.message);
    return NextResponse.json(
      { error: e?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
