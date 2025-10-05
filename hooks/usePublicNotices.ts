// hooks/usePublicNotices.ts
"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export type PublicNotice = {
  id: string;
  type: "image" | "video";
  title?: string | null;
  body?: string | null;
  src?: string | null;
  poster?: string | null;
  startAt?: string | null; // ISO timestamp
};

type Options = {
  /** Enable Supabase realtime updates (default: true) */
  realtime?: boolean;
  /** Auto-refresh interval in ms (default: 0 - disabled) */
  refreshInterval?: number;
};

export function usePublicNotices(opts: Options = {}) {
  const { realtime = true, refreshInterval = 0 } = opts;

  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch notices from API
  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/notices", { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid data format");

      // Basic shape normalization
      const normalized: PublicNotice[] = data.map((n) => ({
        id: String(n.id),
        type: n.type === "video" ? "video" : "image",
        title: n.title ?? null,
        body: n.body ?? null,
        src: n.src ?? null,
        poster: n.poster ?? null,
        startAt: n.start_at ?? n.startAt ?? null,
      }));

      setNotices(normalized);
    } catch (e: any) {
      console.error("[usePublicNotices] fetch error:", e);
      setError(e?.message || "Failed to load notices");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Initial fetch + optional auto-refresh
  useEffect(() => {
    fetchNotices();
    if (refreshInterval > 0) {
      const t = setInterval(fetchNotices, refreshInterval);
      return () => clearInterval(t);
    }
  }, [fetchNotices, refreshInterval]);

  // ✅ Lazy-load Supabase client (browser only)
  const [supabase, setSupabase] = useState<any | null>(null);

  useEffect(() => {
    if (!realtime || typeof window === "undefined") return;
    let mounted = true;

    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
          console.warn("[usePublicNotices] Missing Supabase env vars");
          return;
        }

        const mod = await import("@supabase/supabase-js");
        const client = mod.createClient(url, key, {
          realtime: { params: { apikey: key } },
        });

        if (mounted) setSupabase(client);
      } catch (err) {
        console.error("[usePublicNotices] failed to init Supabase client:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [realtime]);

  // ✅ Subscribe to realtime changes
  const channelRef = useRef<any | null>(null);

  useEffect(() => {
    if (!realtime || !supabase) return;

    try {
      const ch = supabase
        .channel("public-notices")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notices" },
          () => {
            console.log("[usePublicNotices] realtime change → refetching");
            fetchNotices();
          }
        )
        .subscribe();

      channelRef.current = ch;
    } catch (e) {
      console.warn("[usePublicNotices] realtime subscription failed:", e);
    }

    return () => {
      if (channelRef.current && supabase?.removeChannel) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch {}
        channelRef.current = null;
      }
    };
  }, [realtime, supabase, fetchNotices]);

  return {
    notices,
    loading,
    error,
    refetch: fetchNotices,
  };
}
