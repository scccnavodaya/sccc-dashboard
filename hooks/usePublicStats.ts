// hooks/usePublicStats.ts
"use client";

import useSWR from "swr";
import { useEffect, useRef, useState } from "react";

export type StatsResponse = {
  studentsTotal: number;
  attendedInMonth: number;
  testsInMonth: number;
  noticesLive: number;
};

/**
 * Abortable SWR fetcher.
 * Accepts the second parameter optionally because SWR may call the fetcher
 * with no second argument in some edge cases.
 */
async function fetcher(
  key: string,
  opts?: { signal?: AbortSignal } // <-- make optional to avoid destructure errors
) {
  const signal = opts?.signal;
  const res = await fetch(key, { cache: "no-store", signal });

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    // ignore JSON parse error, leave data as {}
  }

  if (!res.ok) {
    const msg = data?.error || `Failed to load stats (status ${res.status})`;
    console.error("[usePublicStats] fetch failed:", msg);
    throw new Error(msg);
  }

  // Shape guard + backward-compat normalization
  const normalized: StatsResponse = {
    studentsTotal: data.studentsTotal ?? data.students ?? 0,
    attendedInMonth: data.attendedInMonth ?? data.attendedDistinct ?? 0,
    testsInMonth: data.testsInMonth ?? data.testsCount ?? 0,
    noticesLive: data.noticesLive ?? 0,
  };

  return normalized;
}

type Options = {
  /** Auto-refresh interval in ms; set 0 to disable (default 15s) */
  refreshInterval?: number;
  /** Enable realtime Supabase triggers (default true) */
  realtime?: boolean;
};

export function usePublicStats(ym: string | null | undefined, opts: Options = {}) {
  const { refreshInterval = 15_000, realtime = true } = opts;

  const key = ym ? `/api/public/stats?ym=${encodeURIComponent(ym)}` : null;

  const { data, error, isLoading, mutate } = useSWR<StatsResponse>(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    focusThrottleInterval: 10_000,
    refreshInterval,
    errorRetryCount: 2,
    errorRetryInterval: 5_000,
  });

  // Pause/resume auto-refresh when tab is hidden/visible
  useEffect(() => {
    if (!refreshInterval) return;
    let paused = false;
    const onVis = () => {
      if (document.hidden) {
        paused = true;
      } else {
        if (paused) {
          paused = false;
          mutate(); // grab fresh right after returning
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshInterval, mutate]);

  /**
   * Create Supabase client at runtime (browser only).
   * We dynamically import `@supabase/supabase-js` inside a useEffect so Turbopack / Next
   * does not include potentially server-only runtime code into server bundles.
   */
  const [supabase, setSupabase] = useState<any | null>(null);

  useEffect(() => {
    // only run in browser
    if (typeof window === "undefined") return;

    let mounted = true;
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
          // Do not spam console; but warn once
          console.warn("[usePublicStats] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
          return;
        }
        // dynamic import ensures server build doesn't pull supabase internals
        const mod = await import("@supabase/supabase-js");
        const client = mod.createClient(url, key, {
          realtime: { params: { apikey: key } }, // sensible default
        });
        if (mounted) setSupabase(client);
      } catch (e) {
        console.error("[usePublicStats] failed to init supabase client", e);
      }
    })();

    return () => {
      mounted = false;
      // do not call supabase cleanup here because we only stored client reference
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Keep reference to channel so we can remove on cleanup
  const channelRef = useRef<any | null>(null);

  useEffect(() => {
    if (!realtime || !ym || !supabase) return;

    try {
      // create unique channel for the month
      const ch = supabase
        .channel(`public-stats-${ym}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => mutate())
        .on("postgres_changes", { event: "*", schema: "public", table: "tests" }, () => mutate())
        .on("postgres_changes", { event: "*", schema: "public", table: "marks" }, () => mutate())
        .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => mutate())
        .subscribe();

      channelRef.current = ch;
    } catch (e) {
      // Supabase realtime may throw if not available; catch to avoid breaking UI
      console.warn("[usePublicStats] realtime subscription failed", e);
      channelRef.current = null;
    }

    return () => {
      if (channelRef.current && supabase?.removeChannel) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          // ignore errors during teardown
        }
        channelRef.current = null;
      }
    };
  }, [ym, realtime, supabase, mutate]);

  return {
    stats: data ?? undefined,
    isLoading,
    isError: Boolean(error),
    error: error as Error | undefined,
    refetch: mutate,
  };
}
