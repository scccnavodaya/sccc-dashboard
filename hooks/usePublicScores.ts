// hooks/usePublicScores.ts
"use client";

import useSWR from "swr";
import { useEffect, useMemo, useRef, useState } from "react";

export type PublicTest = {
  id: string;
  section: "MAT" | "ENGLISH" | "MATHS";
  test_date: string; // YYYY-MM-DD
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

// SWR fetcher (supports AbortSignal)
async function swrFetcher(key: string, { signal }: { signal?: AbortSignal }) {
  const res = await fetch(key, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    let msg = "Failed to load scores";
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      // ignore JSON errors
    }
    console.error("[usePublicScores] fetch failed:", res.status, msg);
    throw new Error(msg);
  }

  const data = await res.json();
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as any).tests) ||
    !Array.isArray((data as any).marks)
  ) {
    console.error("[usePublicScores] Invalid scores payload:", data);
    throw new Error("Invalid scores payload");
  }

  return data as ScoresResponse;
}

type Options = {
  /** Auto-refresh interval in ms (default: disabled) */
  refreshInterval?: number;
  /** Enable realtime Supabase triggers (default: true) */
  realtime?: boolean;
};

export function usePublicScores(month: string, opts: Options = {}) {
  const { refreshInterval = 0, realtime = true } = opts;
  const key = month ? `/api/public/scores?ym=${encodeURIComponent(month)}` : null;

  const { data, error, isLoading, mutate } = useSWR<ScoresResponse>(key, swrFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    focusThrottleInterval: 10_000,
    keepPreviousData: true,
    refreshInterval,
    errorRetryCount: 2,
    errorRetryInterval: 5_000,
  });

  // Lazy-load Supabase client (browser-only)
  const [supabase, setSupabase] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
          console.warn("[usePublicScores] Missing NEXT_PUBLIC_SUPABASE_URL or KEY");
          return;
        }
        const mod = await import("@supabase/supabase-js");
        const client = mod.createClient(url, key, {
          realtime: { params: { apikey: key } },
        });
        if (mounted) setSupabase(client);
      } catch (e) {
        console.error("[usePublicScores] failed to init Supabase client", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to realtime updates (tests + marks tables)
  const channelRef = useRef<any | null>(null);

  useEffect(() => {
    if (!realtime || !month || !supabase) return;

    try {
      const ch = supabase
        .channel(`public-scores-${month}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "tests" }, () => {
          console.log("[usePublicScores] tests changed → refetching");
          mutate();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "marks" }, () => {
          console.log("[usePublicScores] marks changed → refetching");
          mutate();
        })
        .subscribe();

      channelRef.current = ch;
    } catch (e) {
      console.warn("[usePublicScores] realtime subscription failed:", e);
      channelRef.current = null;
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

  return {
    tests: data?.tests ?? [],
    marks: data?.marks ?? [],
    isLoading,
    isError: Boolean(error),
    error: error as Error | undefined,
    refetch: mutate,
  };
}
