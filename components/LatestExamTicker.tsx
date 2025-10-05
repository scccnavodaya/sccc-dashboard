// components/LatestExamTicker.tsx
"use client";

import { useMemo, useState } from "react";

export type LatestExamItem = {
  id: string;
  text: string;       // one-line announcement
  startAt?: string;   // ISO; shows NEW if within last 24h (kept for API parity)
};

function isFresh(startAt?: string) {
  if (!startAt) return false;
  const now = Date.now();
  const then = new Date(startAt).getTime();
  return now - then < 24 * 60 * 60 * 1000; // 24h
}

function joinTexts(items: LatestExamItem[]) {
  return items
    .map((i) => (i?.text || "").trim())
    .filter(Boolean)
    .join("   •   ");
}

export default function LatestExamTicker({
  items = [],
  intervalMs = 30000, // kept for compatibility; marquee is time-based CSS
  className = "",
}: {
  items?: LatestExamItem[];
  intervalMs?: number;
  className?: string;
}) {
  const [paused, setPaused] = useState(false);
  const line = useMemo(() => joinTexts(items), [items]);

  if (!items.length || !line) {
    return (
      <div
        className={`flex items-center rounded-md border border-emerald-100 bg-emerald-50/70 px-2 py-1 text-[11px] sm:text-xs text-emerald-800 ${className}`}
        style={{ lineHeight: "1.25rem", minHeight: "1.25rem" }}
      >
        <span className="mr-2 shrink-0 rounded bg-emerald-600 px-1.5 py-[1px] text-[10px] font-semibold text-white">
          Latest
        </span>
        No exam notice yet
      </div>
    );
  }

  // Duplicate once so the marquee loops seamlessly
  const loopText = `${line}   •   ${line}`;

  // If ANY item is fresh, show a small NEW badge (optional, subtle)
  const anyFresh = items.some((i) => isFresh(i.startAt));

  return (
    <div
      className={`
        relative w-full overflow-hidden rounded-md
        border border-emerald-100 bg-emerald-50
        ${className}
      `}
      aria-label="Latest Exam Notice"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="
          flex items-center gap-2
          px-2 sm:px-3 py-1
          text-[11px] sm:text-xs font-medium text-emerald-800
        "
        style={{ lineHeight: "1.25rem", minHeight: "1.25rem" }}
      >
        {/* Fixed chip on the left so it doesn't scroll away */}
        <span className="mr-1 shrink-0 rounded bg-emerald-600 px-1.5 py-[1px] text-[10px] font-semibold text-white">
          Latest Exam
        </span>

        {/* Optional tiny NEW badge if something fresh exists */}
        {anyFresh && (
          <span className="mr-1 hidden sm:inline-block shrink-0 rounded bg-red-600 px-1.5 py-[1px] text-[10px] font-semibold text-white">
            NEW
          </span>
        )}

        {/* Marquee line */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="ticker inline-block whitespace-nowrap will-change-transform"
            // pause via inline style to avoid className thrash
            style={{
              animationPlayState: paused ? "paused" : "running",
            }}
            aria-live="polite"
          >
            {loopText}
          </div>
        </div>
      </div>

      {/* Local keyframes so no Tailwind config change is needed */}
      <style jsx>{`
        .ticker {
          animation: sccc-marquee 22s linear infinite;
          padding-left: 100%;
        }
        @keyframes sccc-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        /* Slightly slower on very small phones to improve legibility */
        @media (max-width: 420px) {
          .ticker {
            animation-duration: 26s;
          }
        }
      `}</style>
    </div>
  );
}
