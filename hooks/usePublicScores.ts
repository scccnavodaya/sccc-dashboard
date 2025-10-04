// hooks/usePublicScores.ts
"use client";

import useSWR from "swr";

export type PublicTest = {
  id: string;
  section: "MAT" | "ENGLISH" | "MATHS";
  test_date: string; // YYYY-MM-DD
};

export type PublicMark = {
  test_id: string;
  student_id: string;
  score: number | null; // null = absent
};

type ScoresResponse = {
  tests: PublicTest[];
  marks: PublicMark[];
};

// SWR v2 fetcher can accept (key, { signal })
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
    } catch {}
    throw new Error(msg);
  }
  const data = (await res.json()) as unknown;

  // tiny shape guard
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as any).tests) ||
    !Array.isArray((data as any).marks)
  ) {
    throw new Error("Invalid scores payload");
  }
  return data as ScoresResponse;
}

type Options = {
  /** refresh in ms (e.g. 60_000). Omit/0 to disable. */
  refreshInterval?: number;
};

export function usePublicScores(month: string, opts: Options = {}) {
  const { refreshInterval = 0 } = opts;
  const key = month ? `/api/public/scores?ym=${encodeURIComponent(month)}` : null;

  const {
    data,
    error,
    isLoading,
    mutate,            // call to refetch
  } = useSWR<ScoresResponse>(key, swrFetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    // Avoid hammering the server if you tab in/out quickly
    focusThrottleInterval: 10_000,
    // Keep previous month’s data visible while new month loads
    keepPreviousData: true,
    // Optional auto-refresh
    refreshInterval,
    // Don’t retry forever on hard errors (like 401/403)
    errorRetryCount: 2,
    errorRetryInterval: 5_000,
  });

  return {
    tests: data?.tests ?? [],
    marks: data?.marks ?? [],
    isLoading,
    isError: Boolean(error),
    error: error as Error | undefined,
    refetch: mutate,
  };
}
