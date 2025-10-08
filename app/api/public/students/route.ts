// app/api/public/students/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/public/students?ym=YYYY-MM
 * Returns: [{ id, name, photo }]
 * - If `ym` provided → includes students who have marks in that month
 * - Otherwise → returns all active students
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ym = searchParams.get("ym");

    let studentsQuery = supabase
      .from("students")
      .select("id, name, photo_url, photo_path, active, created_at")
      .order("created_at", { ascending: true });

    if (!ym) {
      // default: only active students
      studentsQuery = studentsQuery.eq("active", true);
    } else {
      // include any students that have marks in that month
      const [yearStr, monthStr] = ym.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      if (!year || !month) {
        return NextResponse.json({ error: "Invalid ym" }, { status: 400 });
      }

      const start = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
      const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

      const { data: marks } = await supabase
        .from("marks")
        .select("student_id, created_at")
        .gte("created_at", start)
        .lt("created_at", end);

      const ids = (marks ?? []).map((m) => m.student_id);
      if (ids.length > 0) studentsQuery = studentsQuery.in("id", ids);
    }

    const { data, error } = await studentsQuery;
    if (error) throw error;

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const rows =
      (data ?? []).map((s) => {
        const photo =
          s.photo_url ||
          (s.photo_path
            ? `${base}/storage/v1/object/public/student-photos/${s.photo_path}`
            : null);
        return { id: s.id, name: s.name, photo };
      }) ?? [];

    return new NextResponse(JSON.stringify(rows), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=60",
      },
    });
  } catch (e: any) {
    console.error("[api/public/students] error:", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
