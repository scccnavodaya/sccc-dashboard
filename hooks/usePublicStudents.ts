// hooks/usePublicStudents.ts
"use client";

import useSWR from "swr";

export type PublicStudent = {
  id: string;
  name: string;
  photo: string | null; // fully-qualified public URL or null
};

// SWR v2 fetcher supports { signal }
async function swrFetcher(key: string, { signal }: { signal?: AbortSignal }) {
  const res = await fetch(key, {
    credentials: "include",
    cache: "no-store",
    signal,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse error; will handle below
  }

  if (!res.ok) {
    const msg = data?.error || `Failed to load students (status ${res.status})`;
    console.error("[usePublicStudents] fetch failed:", msg);
    throw new Error(msg);
  }

  // tiny shape guard
  if (!Array.isArray(data)) {
    console.error("[usePublicStudents] Invalid students payload:", data);
    throw new Error("Invalid students payload");
  }

  return data as PublicStudent[];
}

/**
 * Optionally pass { q } to filter server-side (if your API supports it).
 * Example: usePublicStudents({ q: search })
 */
export function usePublicStudents(opts?: { q?: string }) {
  const key = opts?.q?.trim()
    ? `/api/public/students?q=${encodeURIComponent(opts.q.trim())}`
    : "/api/public/students";

  const { data, error, isLoading, mutate } = useSWR<PublicStudent[]>(
    key,
    swrFetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      focusThrottleInterval: 10_000,
      keepPreviousData: true,
      errorRetryCount: 2,
      errorRetryInterval: 5_000,
    }
  );

  return {
    students: data ?? [],
    isLoading,
    isError: Boolean(error),
    error: error as Error | undefined,
    refetch: mutate,
  };
}
