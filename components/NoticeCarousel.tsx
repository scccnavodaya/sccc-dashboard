// components/NoticeCarousel.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type NoticeItem = {
  id: string;
  type: "image" | "video";
  title?: string | null;
  body?: string | null;
  src?: string | null;
  poster?: string | null;
  startAt?: string | null; // ISO – to show NEW badge within 24h
};

function isFresh(startAt?: string | null) {
  if (!startAt) return false;
  const now = Date.now();
  const then = Number(new Date(startAt));
  return Number.isFinite(then) && now - then < 24 * 60 * 60 * 1000; // < 24h
}

export default function NoticeCarousel({
  items = [],
  intervalMs = 30000,
  barClassName = "bg-emerald-600",
}: {
  items?: NoticeItem[];
  intervalMs?: number;
  barClassName?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewer, setViewer] = useState<NoticeItem | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const has = items.length > 0;
  const current = items[idx];

  // auto-advance (respect min 3s for UX)
  useEffect(() => {
    if (!has || paused || !!viewer) return;
    const id = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      Math.max(3000, intervalMs)
    );
    return () => clearInterval(id);
  }, [has, paused, items.length, intervalMs, viewer]);

  // keyboard arrows when focused
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + items.length) % items.length);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [items.length]);

  if (!has) {
    return (
      <div className="h-full w-full max-w-full overflow-hidden rounded-xl border border-zinc-200">
        <div className="flex h-full w-full items-center justify-center bg-zinc-50">
          <span className="text-zinc-400 text-sm">No active notices</span>
        </div>
      </div>
    );
  }

  // safe fallbacks pulled from current
  const title = (current?.title ?? "Notice").toString();
  const body = current?.body ?? "";
  const src = current?.src ?? "";
  const poster = current?.poster ?? null;

  return (
    <>
      <div
        ref={wrap}
        tabIndex={0}
        className="
          relative h-full w-full max-w-full overflow-hidden
          rounded-xl border border-zinc-200 outline-none
        "
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        aria-roledescription="carousel"
        aria-label="Notices"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id ?? idx}
            initial={{ opacity: 0.9, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.9, scale: 0.985 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative h-full w-full"
          >
            {/* slide media (fills container) */}
            {current?.type === "image" && src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={title}
                className="h-full w-full object-cover"
                loading="lazy"
                onClick={() => setViewer(current)}
              />
            ) : current?.type === "video" && (poster || src) ? (
              <div className="relative h-full w-full bg-black">
                {/* Show poster; open video in modal on click */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={poster || "/video-poster-fallback.jpg"}
                  alt={title}
                  className="h-full w-full object-cover opacity-90"
                  onClick={() => src && setViewer(current)}
                />
                {src && (
                  <button
                    onClick={() => setViewer(current)}
                    className="absolute inset-0 grid place-items-center"
                    aria-label="Play video"
                  >
                    <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold shadow">
                      ▶ Play
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-50">
                <span className="text-zinc-400">Notice</span>
              </div>
            )}

            {/* caption */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 to-black/0 px-2.5 sm:px-3 py-2">
              <div className="inline-flex items-center gap-2 rounded bg-white/90 px-2 py-1 max-w-full">
                <span className="text-xs sm:text-sm font-semibold text-zinc-900 truncate">
                  {title}
                </span>
                {isFresh(current?.startAt) && (
                  <span className="rounded bg-red-600 px-1.5 py-[1px] text-[10px] font-medium text-white shrink-0">
                    NEW
                  </span>
                )}
              </div>
              {body ? (
                <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-white/95 drop-shadow">
                  {body}
                </p>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-100">
          <motion.div
            key={`bar-${idx}-${paused}-${!!viewer}`}
            initial={{ width: "0%" }}
            animate={{ width: paused || !!viewer ? "0%" : "100%" }}
            transition={{ duration: Math.max(3, intervalMs / 1000), ease: "linear" }}
            className={`h-full ${barClassName}`}
          />
        </div>

        {/* dots */}
        <div className="absolute right-2 top-2 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`
                h-2.5 w-2.5 rounded-full transition
                ${i === idx ? "bg-emerald-600" : "bg-zinc-300 hover:bg-zinc-400"}
                focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300
              `}
            />
          ))}
        </div>
      </div>

      {/* viewer modal (image zoom / video playback) */}
      <AnimatePresence>
        {viewer && (
          <motion.div
            className="
              fixed inset-0 z-[120] bg-black/70
              pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
              pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]
              p-4
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewer(null)}
          >
            <motion.div
              className="mx-auto mt-10 w-full max-w-4xl rounded-2xl bg-black p-3 shadow-2xl"
              initial={{ y: 24, opacity: 0.95 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              {viewer.type === "image" && viewer.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewer.src}
                  alt={viewer.title ?? "Notice"}
                  className="max-h-[70svh] w-full object-contain"
                />
              ) : viewer.type === "video" && viewer.src ? (
                <video
                  src={viewer.src}
                  poster={viewer.poster ?? undefined}
                  controls
                  autoPlay
                  className="max-h-[70svh] w-full rounded-lg bg-black"
                />
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2 text-sm text-white/90">
                <div className="truncate">
                  <span className="font-semibold">{viewer.title ?? "Notice"}</span>
                  {viewer.body ? <span className="ml-2 opacity-80">— {viewer.body}</span> : null}
                </div>
                <button
                  onClick={() => setViewer(null)}
                  className="rounded bg-white/90 px-3 py-1 font-medium text-zinc-900 hover:bg-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
