import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ym = searchParams.get("ym");
  if (!ym) return NextResponse.json({ error: "Missing ym" }, { status: 400 });

  const [year, month] = ym.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  // query scores for month
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id, name, photo_url, created_at, active,
      marks:marks(student_id, score, tests(test_date))
      `
    )
    .eq("active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = (data || []).map((s: any) => {
    const scores = (s.marks || [])
      .filter((m: any) => {
        const d = new Date(m.tests.test_date);
        return d >= start && d < end;
      })
      .map((m: any) => m.score);
    const total = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) : null;
    return { id: s.id, name: s.name, photo_url: s.photo_url, total };
  });

  // order by total desc (nulls last)
  list.sort((a, b) => {
    if (a.total == null && b.total == null) return a.name.localeCompare(b.name);
    if (a.total == null) return 1;
    if (b.total == null) return -1;
    return b.total - a.total || a.name.localeCompare(b.name);
  });

  return NextResponse.json(list);
}
