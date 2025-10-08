// components/LatestExamTicker.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Public type you can import elsewhere:
 * import { LatestExamItem } from "@/components/LatestExamTicker";
 */
export type LatestExamItem = {
  id: string | number;
  text: string;
  startAt?: string | null;
  // normalized "live" flag
  is_live?: boolean;
  is_active?: boolean;
  active?: boolean;
  status?: string | null;
};

export type LatestExamTickerProps = {
  /** Optional preloaded items (LatestExamItem[]) */
  items?: LatestExamItem[];
  /** Legacy/alternate prop name: accepts arbitrary notice-like objects */
  notices?: any[];
  /** override fetch URL (defaults to /api/exam-ticker) */
  fetchUrl?: string;
  /** marquee speed heuristic (px per second). Larger → faster */
  pxPerSec?: number;
  /** Tailwind text color class (default blue) */
  textColorClass?: string;
  /** root className */
  className?: string;
};

/** normalize incoming array (notices / exam rows / custom shapes) */
function normalizeIncoming(incoming?: any[] | LatestExamItem[] | null): LatestExamItem[] {
  if (!Array.isArray(incoming)) return [];

  return incoming
    .map((d: any) => {
      if (!d) return null;

      // prefer explicit text field; fallbacks to title/body/message composition
      let text = "";
      if (typeof d.text === "string" && d.text.trim().length > 0) {
        text = d.text.trim();
      } else {
        // compose from common fields
        text =
          (d?.title ?? d?.headline ?? d?.message ?? d?.body ?? d?.note ?? "")
            .toString()
            .trim();
      }

      // If still no text, try to compose a generic exam message from exam_date etc.
      if (!text) {
        if (d?.exam_date) {
          try {
            const dt = new Date(d.exam_date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            text = `Exam scheduled on ${dt}`;
          } catch {
            /* ignore */
          }
        } else if (d?.release_at) {
          text = `Released at ${String(d.release_at).slice(0, 16)}`;
        }
      }

      if (!text) return null;

      const id =
        d?.id ?? d?._id ?? d?.notice_id ?? d?.uuid ?? d?.key ?? Math.random();
      const startAt = d?.startAt ?? d?.start_at ?? d?.created_at ?? null;

      // detect live variants: is_active (your table), is_live, active, live/status tags
      const isActive =
        d?.is_active === true ||
        d?.is_live === true ||
        d?.active === true ||
        d?.live === true ||
        ((typeof d?.status === "string") &&
          ["live", "active", "published"].includes(d.status.toLowerCase()));

      return {
        id,
        text,
        startAt,
        is_live: Boolean(d?.is_live),
        is_active: Boolean(d?.is_active ?? isActive),
        active: Boolean(d?.active ?? isActive),
        status: typeof d?.status === "string" ? d.status : null,
      } as LatestExamItem;
    })
    .filter(Boolean) as LatestExamItem[];
}

export default function LatestExamTicker({
  items: externalItems,
  notices,
  fetchUrl = "/api/exam-ticker",
  pxPerSec = 60,
  textColorClass = "text-blue-600",
  className = "",
}: LatestExamTickerProps) {
  // initial: prefer explicit items prop, then notices prop
  const [items, setItems] = useState<LatestExamItem[]>(
    externalItems && externalItems.length
      ? normalizeIncoming(externalItems)
      : normalizeIncoming(notices),
  );

  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [durationSec, setDurationSec] = useState(10);

  // keep in sync if caller updates props
  useEffect(() => {
    if (Array.isArray(externalItems) && externalItems.length > 0) {
      setItems(normalizeIncoming(externalItems));
      return;
    }
    const norm = normalizeIncoming(notices);
    if (norm.length > 0) setItems(norm);
  }, [externalItems, notices]);

  // fetch from fetchUrl only when no explicit items/notices provided
  useEffect(() => {
    if ((externalItems && externalItems.length > 0) || (notices && notices.length > 0)) return;
    let alive = true;

    async function load() {
      try {
        const res = await fetch(fetchUrl, { cache: "no-store" });
        if (!res.ok) {
          console.warn("[LatestExamTicker] fetch failed:", res.status);
          return;
        }
        const data = await res.json().catch(() => null);
        if (!alive) return;

        // accept array or object with fields
        const arr = Array.isArray(data) ? data : data?.notices ?? data?.data ?? data?.items ?? [];
        const normalized = normalizeIncoming(arr);
        setItems(normalized);
      } catch (err) {
        console.warn("[LatestExamTicker] fetch error:", err);
      }
    }

    load();
    const iv = setInterval(load, 60_000); // refresh every minute
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [externalItems, notices, fetchUrl]);

  // compute scroll duration based on text width so marquee feels steady
  useEffect(() => {
    function compute() {
      const c = containerRef.current;
      const t = contentRef.current;
      if (!c || !t) return;
      const cw = c.clientWidth || 1;
      const tw = t.scrollWidth || cw;
      // duration = distance / speed pxPerSec, clamp to [4,20]
      const dur = Math.max(4, Math.min(20, (tw + cw) / Math.max(10, pxPerSec)));
      setDurationSec(dur);
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [items, pxPerSec]);

  // Only include items that are live (check is_active / is_live / active)
  const liveItems = (items || []).filter((x) => Boolean(x.is_active || x.is_live || x.active));

  // join text pieces with bullet separator
  const text = liveItems.length ? liveItems.map((x) => x.text).join("  •  ") : "No live updates";

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-live="polite"
    >
      <style>{`
        @keyframes sccc-ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .sccc-ticker-track {
          white-space: nowrap;
          display: inline-block;
          will-change: transform;
          animation: sccc-ticker var(--sccc-duration, 10s) linear infinite;
        }
        .sccc-ticker-track.paused {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex items-center h-8">
        <div
          ref={contentRef}
          className={`sccc-ticker-track ${paused ? "paused" : ""} ${textColorClass}`}
          style={{
            fontSize: 14,       // medium font
            fontWeight: 500,
            lineHeight: "1.75rem",
            ["--sccc-duration" as any]: `${durationSec}s`,
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
