"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type LatestExamItem = {
  id: string;
  text: string;       // one-line announcement
  startAt?: string;   // ISO; shows NEW if within last 24h
};

function isFresh(startAt?: string) {
  if (!startAt) return false;
  const now = Date.now();
  const then = new Date(startAt).getTime();
  return now - then < 24 * 60 * 60 * 1000; // 24h
}

export default function LatestExamTicker({
  items = [],
  intervalMs = 30000,
  className = "",
}: {
  items?: LatestExamItem[];
  intervalMs?: number;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const hasItems = items.length > 0;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasItems || paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(id);
  }, [hasItems, paused, items.length, intervalMs]);

  useEffect(() => {
    const onBlur = () => setPaused(true);
    const onFocus = () => setPaused(false);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!hasItems) {
    return (
      <div
        className={`flex min-h-[36px] items-center rounded-lg bg-gradient-to-r from-emerald-50/70 to-teal-50/70 px-2.5 text-xs text-zinc-600 ${className}`}
      >
        No notice yet
      </div>
    );
  }

  const current = items[idx];

  return (
    <div
      ref={ref}
      className={`relative flex min-h-[36px] items-center overflow-hidden rounded-lg bg-gradient-to-r from-emerald-50/70 to-teal-50/70 px-2.5 text-sm ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-live="polite"
      role="region"
      aria-label="Latest exam notices"
      tabIndex={0}
    >
      {/* Label chip */}
      <span className="mr-2 shrink-0 rounded-md bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
        Latest Exam
      </span>

      {/* Animated text */}
      <div className="relative flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <span className="truncate">{current.text}</span>
            {isFresh(current.startAt) && (
              <span className="shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                NEW
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tiny nav dots */}
      <div className="ml-2 flex shrink-0 items-center gap-1">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Show notice ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-1.5 w-1.5 rounded-full transition ${
              i === idx ? "bg-emerald-700" : "bg-emerald-300 hover:bg-emerald-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
