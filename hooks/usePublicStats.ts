// hooks/usePublicStats.ts
"use client";

import useSWR from "swr";
import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";

export type StatsResponse = {
  studentsTotal: number;
  attendedInMonth: number;
  testsInMonth: number;
  noticesLive: number;
};

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || "Failed to load stats");
    return data;
  });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function usePublicStats(ym: string) {
  const key = ym ? `/api/public/stats?ym=${encodeURIComponent(ym)}` : null;

  const { data, error, isLoading, mutate } = useSWR<StatsResponse>(key, fetcher, {
    refreshInterval: 15000, // auto-refresh every 15s
    revalidateOnFocus: true,
  });

  // Normalize in case API still returns old field names
  const normalized: StatsResponse | undefined = data
    ? {
        studentsTotal:
          (data as any).studentsTotal ?? (data as any).students ?? 0,
        attendedInMonth:
          (data as any).attendedInMonth ??
          (data as any).attendedDistinct ??
          0,
        testsInMonth:
          (data as any).testsInMonth ?? (data as any).testsCount ?? 0,
        noticesLive: (data as any).noticesLive ?? 0,
      }
    : undefined;

  // Realtime updates when underlying tables change
  useEffect(() => {
    if (!ym) return;
    const channel = supabase
      .channel(`public-stats-${ym}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => mutate())
      .on("postgres_changes", { event: "*", schema: "public", table: "tests" }, () => mutate())
      .on("postgres_changes", { event: "*", schema: "public", table: "marks" }, () => mutate())
      .on("postgres_changes", { event: "*", schema: "public", table: "notices" }, () => mutate())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ym, mutate]);

  return {
    stats: normalized,
    isLoading,
    isError: !!error,
    refetch: mutate,
  };
}
