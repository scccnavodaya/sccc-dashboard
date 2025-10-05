// hooks/usePublicStats.ts
"use client";

import useSWR from "swr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef } from "react";

export type StatsResponse = {
  studentsTotal: number;
  attendedInMonth: number;
  testsInMonth: number;
  noticesLive: number;
};

// Abortable SWR fetcher (SWR v2 passes { signal })
async function fetcher(key: string, { signal }: { signal?: AbortSignal }) {
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

export function usePublicStats(ym: string, opts: Options = {}) {
  const {
    refreshInterval = 15_000,
    realtime = true,
  } = opts;

  const key = ym ? `/api/public/stats?ym=${encodeURIComponent(ym)}` : null;

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<StatsResponse>(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    focusThrottleInterval: 10_000,
    refreshInterval, // paused below when tab hidden
    errorRetryCount: 2,
    errorRetryInterval: 5_000,
  });

  // Pause/resume auto-refresh when tab is hidden/visible
  useEffect(() => {
    if (!refreshInterval) return;
    let paused = false;
    const onVis = () => {
      if (document.hidden) {
        if (!paused) {
          paused = true;
        }
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

  // Supabase realtime client created once
  const supabase: SupabaseClient | null = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn("[usePublicStats] Missing NEXT_PUBLIC_SUPABASE_URL or KEY");
      return null;
    }
    return createClient(url, key);
  }, []);

  // Subscribe to table changes for instant updates (if enabled)
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

  useEffect(() => {
    if (!realtime || !ym || !supabase) return;

    const ch = supabase
      .channel(`public-stats-${ym}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => mutate())
      .on("postgres_changes", { event: "*", schema: "public", table: "tests" }, () => mutate())
      .on("postgres_changes", { event: "*", schema: "public", table: "marks" }, () => mutate())
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => mutate())
      .subscribe();

    channelRef.current = ch;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [ym, realtime, supabase, mutate]);

  return {
    stats: data,
    isLoading,
    isError: Boolean(error),
    error: error as Error | undefined,
    refetch: mutate,
  };
}
