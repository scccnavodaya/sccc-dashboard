import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ym = searchParams.get("ym");
  const section = searchParams.get("section"); // "MAT"/"ENGLISH"/"MATHS"
  const testId = searchParams.get("testId");

  if (!ym || !section) {
    return NextResponse.json({ error: "Missing ym or section" }, { status: 400 });
  }

  const [year, month] = ym.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  if (testId) {
    // specific test/date view
    const { data, error } = await supabase
      .from("students")
      .select(
        `
        id, name, photo_url,
        marks:marks(score, test_id)
        `
      )
      .eq("active", true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const list = (data || []).map((s: any) => {
      const m = (s.marks || []).find((x: any) => x.test_id === testId);
      return {
        id: s.id,
        name: s.name,
        photo_url: s.photo_url,
        score: m ? m.score : null,
        absent: m == null, // absent if no mark for this test
      };
    });

    return NextResponse.json(list);
  } else {
    // month aggregate per section
    const { data, error } = await supabase
      .from("students")
      .select(
        `
        id, name, photo_url,
        marks:marks(score, tests(test_date, section))
        `
      )
      .eq("active", true);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const list = (data || []).map((s: any) => {
      const scores = (s.marks || [])
        .filter((m: any) => {
          if (!m.tests) return false;
          const d = new Date(m.tests.test_date);
          return m.tests.section === section && d >= start && d < end;
        })
        .map((m: any) => m.score);
      const score = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) : null;
      return { id: s.id, name: s.name, photo_url: s.photo_url, score };
    });

    return NextResponse.json(list);
  }
}
