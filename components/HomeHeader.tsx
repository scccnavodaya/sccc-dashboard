// components/LatestExamTicker.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

export type LatestExamItem = {
  id: string | number;
  text: string;
  startAt?: string | null;
  active?: boolean;
};

type Props = {
  /** Optional preloaded items (admin can pass) */
  items?: LatestExamItem[];
  /** Legacy: accept notices shaped differently */
  notices?: any[];
  /** override fetch URL (default /api/exam-ticker) */
  fetchUrl?: string;
  /** marquee speed: px per second heuristic (default 60) */
  pxPerSec?: number;
  /** Tailwind text color class to apply to the text (default blue) */
  textColorClass?: string;
  /** a classname to append to root container */
  className?: string;
};

function normalizeIncoming(incoming?: any[] | LatestExamItem[] | null): LatestExamItem[] {
  if (!Array.isArray(incoming)) return [];
  return incoming
    .map((d: any) => {
      if (!d) return null;
      // if already the right shape
      if (typeof d.text === "string" && (d.id || d.id === 0)) {
        return {
          id: d.id,
          text: String(d.text),
          startAt: d.startAt ?? d.start_at ?? null,
          active: !!d.active,
        } as LatestExamItem;
      }
      // fallback: try common fields
      const text =
        (d?.text ?? d?.title ?? d?.body ?? d?.headline ?? d?.message ?? "").toString().trim();
      const id = String(d?.id ?? d?._id ?? d?.notice_id ?? d?.uuid ?? Math.random());
      const startAt = d?.startAt ?? d?.start_at ?? d?.created_at ?? null;
      return text ? { id, text, startAt } : null;
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
}: Props) {
  // prefer explicit items prop, then notices prop, else fetch from fetchUrl
  const [items, setItems] = useState<LatestExamItem[]>(
    externalItems && externalItems.length ? externalItems : normalizeIncoming(notices),
  );

  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [durationSec, setDurationSec] = useState(10);

  // Keep in sync if caller updates props
  useEffect(() => {
    if (Array.isArray(externalItems) && externalItems.length > 0) {
      setItems(externalItems);
      return;
    }
    const norm = normalizeIncoming(notices);
    if (norm.length > 0) setItems(norm);
  }, [externalItems, notices]);

  // fetch from fetchUrl only when no items passed
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
        // support array or object wrappers
        const arr = Array.isArray(data) ? data : data?.notices ?? data?.data ?? [];
        const normalized = normalizeIncoming(arr);
        if (normalized.length) setItems(normalized);
      } catch (err) {
        console.warn("[LatestExamTicker] fetch error:", err);
      }
    }

    load();
    const iv = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [externalItems, notices, fetchUrl]);

  // compute duration based on text width
  useEffect(() => {
    function compute() {
      const c = containerRef.current;
      const t = contentRef.current;
      if (!c || !t) return;
      const cw = c.clientWidth || 1;
      const tw = t.scrollWidth || cw;
      // duration = distance / pxPerSec, ensure sane bounds
      const dur = Math.max(4, Math.min(20, (tw + cw) / Math.max(10, pxPerSec)));
      setDurationSec(dur);
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [items, pxPerSec]);

  // build joined text (keeps simple presentation)
  const text = items.length ? items.map((x) => x.text).join("  •  ") : "No updates";

  // simple inline style + keyframes for marquee
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
            fontSize: 14,
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
