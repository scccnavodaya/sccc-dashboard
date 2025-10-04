// hooks/usePublicNotices.ts
import { useEffect, useState, useCallback } from "react";

export type PublicNotice = {
  id: string;
  type: "image" | "video";
  title: string;
  body: string;
  src: string;
  poster?: string | null;
  startAt?: string;
};

type NoticesState = {
  notices: PublicNotice[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function usePublicNotices(): NoticesState {
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/notices", { cache: "no-store" });
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      const data = await r.json();

      if (Array.isArray(data)) {
        setNotices(data as PublicNotice[]);
      } else {
        throw new Error("Invalid data shape");
      }
    } catch (e: any) {
      setNotices([]);
      setError(e?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  return { notices, loading, error, refetch: fetchNotices };
}
