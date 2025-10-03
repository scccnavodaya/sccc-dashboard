// app/api/public/students/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Returns active students for the public site.
// Shape: [{ id, name, photo }]
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("id, name, photo_url, photo_path, active, created_at")
      .eq("active", true)
      // first-added-first (older first)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const rows =
      (data ?? []).map((s) => {
        const photo =
          s.photo_url ||
          (s.photo_path
            ? `${base}/storage/v1/object/public/student-photos/${s.photo_path}`
            : null);
        return { id: s.id, name: s.name, photo } as {
          id: string;
          name: string;
          photo: string | null;
        };
      }) ?? [];

    // 60s public cache hint (tweak if you like)
    return new NextResponse(JSON.stringify(rows), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, s-maxage=60, stale-while-revalidate=60",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
