// hooks/usePublicScores.ts
"use client";

import useSWR from "swr";
import { useEffect, useRef, useState } from "react";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type PublicTest = {
  id: string;
  section: "MAT" | "ENGLISH" | "MATHS" | string;
  test_date: string; // normalized field name for consistency
  testDate?: string; // optional camelCase alias for UI compatibility
  // NEW: surface both total_marks and marks_per_question directly
  total_marks?: number | null;
  marks_per_question?: number | null;
  // Existing: keep max_marks for compatibility with older components/helpers
  max_marks?: number | null;
  total_questions?: number | null;
};

export type PublicMark = {
  test_id: string;
  student_id: string;
  score: number | null; // null = absent
};

export type ScoresResponse = {
  tests: PublicTest[];
  marks: PublicMark[];
};

// -----------------------------------------------------------------------------
// Normalization Helper
// -----------------------------------------------------------------------------
function normalizeScores(raw: unknown): ScoresResponse {
  const base: any = Array.isArray(raw)
    ? { tests: [], marks: raw }
    : (raw as any)?.data || raw;

  const tests: PublicTest[] = Array.isArray(base?.tests)
    ? base.tests.map((t: any) => {
        const testDateValue = String(t?.test_date ?? t?.testDate ?? t?.date ?? "");
        const total_questions =
          t?.total_questions != null
            ? Number(t.total_questions)
            : t?.questions != null
            ? Number(t.questions)
            : null;

        // Prefer explicit total_marks if present
        const total_marks =
          t?.total_marks != null
            ? Number(t.total_marks)
            : t?.max_marks != null
            ? Number(t.max_marks)
            : null;

        // Pass through marks_per_question if the API provided it
        const marks_per_question =
          t?.marks_per_question != null
            ? Number(t.marks_per_question)
            : t?.mark_per_question != null
            ? Number(t.mark_per_question)
            : t?.mpq != null
            ? Number(t.mpq)
            : null;

        return {
          id: String(t?.id ?? t?.test_id ?? ""),
          section: (t?.section ?? t?.subject ?? "MAT").toString().toUpperCase(),
          test_date: testDateValue,
          testDate: testDateValue, // ensure both are present

          // NEW: expose both explicitly for the UI
          total_marks: Number.isFinite(total_marks as number) ? (total_marks as number) : null,
          marks_per_question: Number.isFinite(marks_per_question as number)
            ? (marks_per_question as number)
            : null,

          // keep max_marks for backward compatibility with helpers that read it
          max_marks: Number.isFinite(total_marks as number) ? (total_marks as number) : null,

          total_questions: Number.isFinite(total_questions as number)
            ? (total_questions as number)
            : null,
        };
      })
    : [];

  const marks: PublicMark[] = Array.isArray(base?.marks)
    ? base.marks.map((m: any) => ({
        test_id: String(m?.test_id ?? m?.test ?? ""),
        student_id: String(m?.student_id ?? m?.student ?? ""),
        score:
          m?.score == null
            ? null
            : typeof m.score === "number"
            ? m.score
            : Number(m.score),
      }))
    : [];

  try {
    console.debug("[usePublicScores] normalized tests:", tests);
    console.debug("[usePublicScores] normalized marks:", marks);
  } catch {}

  return { tests, marks };
}

// -----------------------------------------------------------------------------
// SWR Fetcher (SWR v2-compatible)
// -----------------------------------------------------------------------------
async function swrFetcher(
  key: string,
  param?: { signal?: AbortSignal }
): Promise<ScoresResponse> {
  const signal = param?.signal;

  const res = await fetch(key, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (err) {
    console.error("[usePublicScores] parse error:", err);
    throw new Error("Invalid JSON response from scores API");
  }

  if (!res.ok) {
    const msg = data?.error || `Failed to load scores (status ${res.status})`;
    console.error("[usePublicScores] fetch failed:", msg);
    throw new Error(msg);
  }

  if (!data || typeof data !== "object") {
    console.error("[usePublicScores] Invalid payload:", data);
    return { tests: [], marks: [] };
  }

  return normalizeScores(data);
}

// -----------------------------------------------------------------------------
// Hook: usePublicScores
// -----------------------------------------------------------------------------
type Options = {
  /** Auto-refresh interval in ms (default: disabled) */
  refreshInterval?: number;
  /** Enable realtime Supabase triggers (default: true) */
  realtime?: boolean;
};

export function usePublicScores(month: string, opts: Options = {}) {
  const { refreshInterval = 0, realtime = true } = opts;
  const key = month ? `/api/public/scores?ym=${encodeURIComponent(month)}` : null;

  const { data, error, isLoading, mutate } = useSWR<ScoresResponse>(
    key,
    swrFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      focusThrottleInterval: 10_000,
      keepPreviousData: true,
      refreshInterval,
      errorRetryCount: 2,
      errorRetryInterval: 5_000,
    }
  );

  // ---------------------------------------------------------------------------
  // Supabase Realtime Setup (browser-only)
  // ---------------------------------------------------------------------------
  const [supabase, setSupabase] = useState<any | null>(null);
  const channelRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !realtime) return;

    let mounted = true;
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
          console.warn("[usePublicScores] Missing Supabase env vars");
          return;
        }
        const { createClient } = await import("@supabase/supabase-js");
        const client = createClient(url, key, {
          realtime: { params: { apikey: key } },
        });
        if (mounted) setSupabase(client);
      } catch (e) {
        console.error("[usePublicScores] supabase init error:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [realtime]);

  // ---------------------------------------------------------------------------
  // Realtime Subscriptions (tests & marks)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!realtime || !month || !supabase) return;

    try {
      const ch = supabase
        .channel(`public-scores-${month}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tests" },
          () => {
            console.log("[usePublicScores] tests changed → refetching");
            mutate();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "marks" },
          () => {
            console.log("[usePublicScores] marks changed → refetching");
            mutate();
          }
        )
        .subscribe();

      channelRef.current = ch;
    } catch (e) {
      console.warn("[usePublicScores] realtime subscription failed:", e);
    }

    return () => {
      if (channelRef.current && supabase?.removeChannel) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {
          /* ignore cleanup errors */
        }
        channelRef.current = null;
      }
    };
  }, [realtime, month, supabase, mutate]);

  // ---------------------------------------------------------------------------
  // Return structured hook output
  // ---------------------------------------------------------------------------
  return {
    tests: data?.tests ?? [],
    marks: data?.marks ?? [],
    isLoading,
    isError: Boolean(error),
    error: error as Error | undefined,
    refetch: mutate,
  };
}
