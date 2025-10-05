// app/api/exam-ticker/latest/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Replace with real data or fetch from your DB / Supabase table
    const dummy = [
      { id: 1, text: "Latest Exam: MAT on Oct 10", start_at: new Date().toISOString() },
      { id: 2, text: "Upcoming Exam: English on Oct 15", start_at: new Date().toISOString() },
    ];

    return NextResponse.json(dummy);
  } catch (e: any) {
    console.error("[exam-ticker/latest] error:", e);
    return NextResponse.json({ error: e?.message || "Failed to fetch exam ticker" }, { status: 500 });
  }
}
