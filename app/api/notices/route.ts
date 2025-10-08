// app/api/notices/route.ts  (DEBUG version)
import { NextResponse } from "next/server";
import { getSupabaseAdmin, publicURL } from "@/lib/supabaseAdmin";

const BUCKET = "notices"; // adjust if your bucket name is different

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    // select all columns (for debugging) — adjust to specific columns later
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/notices] Supabase ERROR:", error);
      return NextResponse.json({ error: error.message, raw: [], notices: [] }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.warn("[api/notices] No rows returned from DB");
      return NextResponse.json({ raw: [], notices: [] }, { status: 200 });
    }

    // Log raw rows to server console for quick debugging
    console.log("[api/notices] Raw DB rows:", JSON.stringify(data, null, 2));

    // tolerant accessors
    const fileAccessor = (n: any) => n?.file_path ?? n?.filePath ?? n?.file ?? n?.url ?? null;
    const posterAccessor = (n: any) => n?.poster_path ?? n?.posterPath ?? n?.poster ?? n?.thumbnail ?? null;
    const kindAccessor = (n: any) => (String(n?.kind ?? n?.type ?? "image").toLowerCase() === "video" ? "video" : "image");
    const isLiveAccessor = (n: any) => {
      // supabase may return boolean or string 'TRUE'
      const v = n?.is_live ?? n?.isLive ?? n?.active ?? null;
      if (v === null || v === undefined) return false;
      if (typeof v === "boolean") return v;
      const s = String(v).toLowerCase();
      return s === "true" || s === "t" || s === "1" || s === "yes";
    };

    // normalize
    const notices = (data || [])
      .filter((n: any) => isLiveAccessor(n)) // keep only live rows for public
      .map((n: any) => {
        const fp = fileAccessor(n);
        const posterPath = posterAccessor(n);
        const srcUrl = fp ? publicURL(BUCKET, fp) : null;
        const posterUrl = posterPath ? publicURL(BUCKET, posterPath) : null;

        return {
          id: String(n.id ?? n.notice_id ?? n.uuid ?? Math.random()),
          type: kindAccessor(n),
          title: n.title ?? n?.headline ?? null,
          body: n.body ?? n?.description ?? null,
          src: srcUrl,
          poster: posterUrl,
          startAt: n.created_at ?? n.start_at ?? null,
          rawFilePath: fp ?? null,
        };
      });

    console.log(`[api/notices] Normalized notices count: ${notices.length}`);

    // return both raw and normalized — frontend can inspect notices array directly
    return NextResponse.json({ raw: data, notices }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown server error";
    console.error("[api/notices] Unexpected error:", msg);
    return NextResponse.json({ error: msg, raw: [], notices: [] }, { status: 200 });
  }
}
