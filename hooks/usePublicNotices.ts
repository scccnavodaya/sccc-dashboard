// hooks/usePublicNotices.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type NoticeItem = {
  id: string;
  type: "image" | "video";
  title?: string | null;
  body?: string | null;
  src?: string | null;
  poster?: string | null;
  startAt?: string | null; // ISO
  is_live?: boolean;
};

type Options = {
  realtime?: boolean;
  refreshInterval?: number; // ms
};

export function usePublicNotices(opts: Options = {}) {
  const { realtime = true, refreshInterval = 0 } = opts;

  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // normalize server responses to NoticeItem[]
  const normalize = (raw: unknown): NoticeItem[] => {
    if (!raw) return [];

    // Accept either an array or an object with `.notices` or `.data` or `.raw`
    let arr: any[] = [];
    if (Array.isArray(raw)) arr = raw;
    else if (raw && typeof raw === "object") {
      const r = raw as any;
      if (Array.isArray(r.notices)) arr = r.notices;
      else if (Array.isArray(r.data)) arr = r.data;
      else if (Array.isArray(r.raw)) arr = r.raw;
      else if (Array.isArray(r)) arr = r;
    }

    return arr
      .map((n: any) => {
        const id = String(n?.id ?? n?.notice_id ?? n?.uuid ?? crypto.randomUUID());
        const kind = String(n?.type ?? n?.kind ?? n?.media_type ?? "image").toLowerCase();
        const type: "image" | "video" = kind === "video" ? "video" : "image";
        const title = n?.title ?? n?.headline ?? null;
        const body = n?.body ?? n?.description ?? null;
        const src = n?.src ?? n?.file ?? n?.url ?? null;
        const poster = n?.poster ?? n?.poster_path ?? n?.thumbnail ?? null;
        const startAt = n?.startAt ?? n?.start_at ?? n?.created_at ?? null;
        const is_live =
          n?.is_live ?? n?.isLive ?? n?.active ?? n?.is_live === undefined ? true : Boolean(n?.is_live);

        return {
          id,
          type,
          title,
          body,
          src,
          poster,
          startAt,
          is_live: Boolean(is_live),
        } as NoticeItem;
      })
      // keep only items that at least have an id; allow src null (text-only) if needed
      .filter((x) => !!x.id);
  };

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notices", { cache: "no-store" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Request failed (${res.status}) ${txt ? "- " + txt : ""}`);
      }
      const raw = await res.json().catch(() => null);
      const normalized = normalize(raw);
      setNotices(normalized);
    } catch (e: any) {
      console.error("[usePublicNotices] fetch error:", e);
      setError(e?.message ?? "Failed to load notices");
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // initial fetch + optional polling
  useEffect(() => {
    fetchNotices();
    if (refreshInterval && refreshInterval > 0) {
      const t = setInterval(fetchNotices, refreshInterval);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchNotices, refreshInterval]);

  // realtime via Supabase (optional)
  const supabaseRef = useRef<any | null>(null);
  const channelRef = useRef<any | null>(null);

  useEffect(() => {
    if (!realtime || typeof window === "undefined") return;

    let mounted = true;
    let client: any = null;

    (async () => {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
          console.warn("[usePublicNotices] Missing Supabase env vars; skipping realtime");
          return;
        }
        const mod = await import("@supabase/supabase-js");
        client = mod.createClient(url, key, { realtime: { params: { apikey: key } } });
        if (!mounted) return;
        supabaseRef.current = client;

        // subscribe to changes on "notices" table (public schema)
        try {
          const ch = client
            .channel("public-notices")
            .on(
              "postgres_changes",
              { event: "*", schema: "public", table: "notices" },
              (payload: any) => {
                console.debug("[usePublicNotices] realtime event:", payload?.eventType ?? payload);
                // simply refetch on any change
                fetchNotices();
              }
            )
            .subscribe();

          channelRef.current = ch;
        } catch (e) {
          console.warn("[usePublicNotices] subscribe failed:", e);
        }
      } catch (err) {
        console.error("[usePublicNotices] supabase init err:", err);
      }
    })();

    return () => {
      mounted = false;
      try {
        if (channelRef.current && supabaseRef.current?.removeChannel) {
          supabaseRef.current.removeChannel(channelRef.current);
        }
      } catch {
        /* ignore */
      }
      channelRef.current = null;
      supabaseRef.current = null;
    };
    // intentionally only run when realtime flag changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtime, fetchNotices]);

  return { notices, loading, error, refetch: fetchNotices };
}
