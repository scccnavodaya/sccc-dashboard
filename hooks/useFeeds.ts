// hooks/useFeeds.ts
"use client";

import { useEffect, useState, useCallback } from "react";

export type FeedItem = {
  id: number | string;
  title: string;
  content: string;
};

export default function useFeeds() {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load feeds");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Ensure we have proper shape
        setFeeds(
          data.map((d: any) => ({
            id: d.id,
            title: String(d.title ?? ""),
            content: String(d.content ?? ""),
          }))
        );
      } else {
        setFeeds([]);
      }
    } catch (err) {
      console.warn("useFeeds load failed", err);
      setFeeds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // load on mount
    load();
  }, [load]);

  const refresh = useCallback(() => {
    load();
  }, [load]);

  return { feeds, loading, refresh, setFeeds };
}
