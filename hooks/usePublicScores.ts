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

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error("Failed to load scores");
    return r.json();
  });

export function usePublicScores(month: string) {
  const key = month ? `/api/public/scores?ym=${month}` : null;
  const { data, error, isLoading, mutate } = useSWR<ScoresResponse>(
    key,
    fetcher,
    { revalidateOnFocus: true }
  );

  return {
    tests: data?.tests ?? [],
    marks: data?.marks ?? [],
    isLoading,
    isError: !!error,
    refetch: mutate,
  };
}
