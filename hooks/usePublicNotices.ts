// hooks/usePublicNotices.ts
import { useEffect, useState } from "react";

export type PublicNotice = {
  id: string;
  type: "image" | "video";
  title: string;
  body: string;
  src: string;
  poster?: string | null;
  startAt?: string;
};

export function usePublicNotices() {
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/notices", { cache: "no-store" });
        const data = await r.json();
        if (alive && r.ok) setNotices(data as PublicNotice[]);
      } catch {
        if (alive) setNotices([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { notices, loading };
}
