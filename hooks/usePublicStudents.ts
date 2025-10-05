// hooks/usePublicStudents.ts
"use client";

import useSWR from "swr";
import { useEffect, useMemo, useRef, useState } from "react";

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

  // Ensure shape is an array
  if (!Array.isArray(data)) {
    console.error("[usePublicStudents] Invalid students payload:", data);
    throw new Error("Invalid students payload");
  }

  return data as PublicStudent[];
}

/**
 * Fetch public student list (optionally filtered by query).
 * Automatically revalidates and supports Supabase realtime.
 */
export function usePublicStudents(opts?: { q?: string; realtime?: boolean }) {
  const { q, realtime = true } = opts ?? {};

  const key = q?.trim()
    ? `/api/public/students?q=${encodeURIComponent(q.trim())}`
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

  // Supabase client (browser-only dynamic import)
  const [supabase, setSupabase] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;
    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
          console.warn("[usePublicStudents] Missing NEXT_PUBLIC_SUPABASE_URL or KEY");
          return;
        }
        const mod = await import("@supabase/supabase-js");
        const client = mod.createClient(url, key, {
          realtime: { params: { apikey: key } },
        });
        if (mounted) setSupabase(client);
      } catch (e) {
        console.error("[usePublicStudents] failed to init supabase client", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Realtime channel subscription for "students" table
  const channelRef = useRef<any | null>(null);

  useEffect(() => {
    if (!realtime || !supabase) return;

    try {
      const ch = supabase
        .channel("public-students")
        .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
          console.log("[usePublicStudents] realtime change detected → refetching");
          mutate();
        })
        .subscribe();

      channelRef.current = ch;
    } catch (e) {
      console.warn("[usePublicStudents] realtime subscription failed:", e);
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
  }, [realtime, supabase, mutate]);

  return {
    students: data ?? [],
    isLoading,
    isError: Boolean(error),
    error: error as Error | undefined,
    refetch: mutate,
  };
}
