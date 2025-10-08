"use client";

import useSWR from "swr";

export type ExamTicker = {
  id: string;
  text: string;
  active: boolean;
  start_at: string;
  end_at: string | null;
};

async function fetcher(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load exam ticker");
  return res.json() as Promise<ExamTicker[]>;
}

/** Fetch latest exam ticker from Supabase via /api/exam-ticker/latest */
export function useExamTicker() {
  const { data, error, isLoading } = useSWR<ExamTicker[]>("/api/exam-ticker/latest", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 15000, // 15s auto-refresh
  });

  return {
    items: data ?? [],
    isLoading,
    isError: !!error,
    error,
  };
}
