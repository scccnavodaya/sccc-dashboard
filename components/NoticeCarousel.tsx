// components/NoticeCarousel.tsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
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
  const then = Number(new Date(startAt));
  if (!Number.isFinite(then)) return false;
  return Date.now() - then < 24 * 60 * 60 * 1000;
}

export default function NoticeCarousel({
  items = [],
  intervalMs = 15000, // default to 15 seconds as requested
  barClassName = "bg-emerald-600",
}: {
  items?: any[] | NoticeItem[];
  intervalMs?: number;
  barClassName?: string;
}) {
  // Normalize incoming shapes to our NoticeItem shape
  const normalizedItems: NoticeItem[] = useMemo(() => {
    if (!Array.isArray(items)) {
      console.debug("[NoticeCarousel] items not array:", items);
      return [];
    }
    const out = items
      .map((n: any) => {
        const id = String(n?.id ?? n?.notice_id ?? n?.uuid ?? "");
        return {
          id,
          type:
            String(n?.type ?? n?.media_type ?? "image").toLowerCase() === "video"
              ? "video"
              : "image",
          title: n?.title ?? n?.headline ?? null,
          body: n?.body ?? n?.description ?? null,
          src: n?.src ?? n?.url ?? n?.file ?? null,
          poster: n?.poster ?? n?.thumbnail ?? null,
          startAt: n?.startAt ?? n?.start_at ?? null,
        } as NoticeItem;
      })
      .filter((x) => !!x.id);
    // console.debug("[NoticeCarousel] normalized items:", out);
    return out;
  }, [items]);

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [viewer, setViewer] = useState<NoticeItem | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);

  const has = normalizedItems.length > 0;
  const current = normalizedItems[idx];

  // Auto advance
  useEffect(() => {
    if (!has || paused || !!viewer) return;
    if (normalizedItems.length <= 1) return; // don't auto-cycle single item
    const effectiveMs = Math.max(3000, intervalMs);
    const id = setInterval(
      () => setIdx((i) => (i + 1) % normalizedItems.length),
      effectiveMs
    );
    return () => clearInterval(id);
  }, [has, paused, normalizedItems.length, intervalMs, viewer]);

  // touch-swipe handlers for mobile
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let startX = 0;
    let lastX = 0;
    let moved = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches?.length) {
        startX = e.touches[0].clientX;
        lastX = startX;
        moved = false;
        setPaused(true);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches?.length) return;
      const x = e.touches[0].clientX;
      if (Math.abs(x - startX) > 10) moved = true;
      lastX = x;
    };
    const onTouchEnd = (e: TouchEvent) => {
      setPaused(false);
      if (!moved) return;
      const dx = lastX - startX;
      if (dx < -40) {
        // swipe left -> next
        setIdx((s) => (s + 1) % normalizedItems.length);
      } else if (dx > 40) {
        // swipe right -> prev
        setIdx((s) => (s - 1 + normalizedItems.length) % normalizedItems.length);
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [normalizedItems.length]);

  // Keyboard navigation for focused carousel (left/right) and Esc to close viewer
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && normalizedItems.length > 0) {
        setIdx((i) => (i + 1) % normalizedItems.length);
      }
      if (e.key === "ArrowLeft" && normalizedItems.length > 0) {
        setIdx((i) => (i - 1 + normalizedItems.length) % normalizedItems.length);
      }
      if (e.key === "Escape") {
        setViewer(null);
      }
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [normalizedItems.length]);

  // Ensure idx stays valid when items change
  useEffect(() => {
    if (!has) {
      setIdx(0);
      return;
    }
    setIdx((i) => Math.min(i, Math.max(0, normalizedItems.length - 1)));
  }, [normalizedItems, has]);

  if (!has) {
    return (
      <div
        className="bg-white rounded-xl border border-zinc-200 overflow-hidden"
        role="region"
        aria-label="Notice board"
      >
        <div className="min-h-[100px] sm:min-h-[140px] flex items-center justify-center bg-zinc-50">
          <span className="text-zinc-400 text-sm">No active notices</span>
        </div>
      </div>
    );
  }

  const title = (current?.title ?? "Notice").toString();
  const body = current?.body ?? "";
  const src = current?.src ?? "";
  const poster = current?.poster ?? null;

  const progressDurationSec = Math.max(
    3,
    Math.round((Math.max(3000, intervalMs) / 1000) * 10) / 10
  );

  return (
    <>
      <div
        ref={wrap}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Notices"
        className="relative w-full min-h-[100px] sm:min-h-[140px] md:min-h-[180px] overflow-hidden rounded-xl border border-zinc-200 outline-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.id ?? idx}
            initial={{ opacity: 0.95, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.95, scale: 0.995 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative h-full w-full"
          >
            {/* media */}
            {current?.type === "image" && src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={title}
                loading="lazy"
                className="h-full w-full object-cover"
                onClick={() => {
                  // open viewer on click/tap
                  setViewer(current);
                }}
              />
            ) : current?.type === "video" && (poster || src) ? (
              <div className="relative h-full w-full bg-black">
                {/* poster */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={poster || "/video-poster-fallback.jpg"}
                  alt={title}
                  className="h-full w-full object-cover opacity-90"
                  onClick={() => {
                    if (src) setViewer(current);
                  }}
                />
                {src && (
                  <button
                    onClick={() => setViewer(current)}
                    className="absolute inset-0 grid place-items-center"
                    aria-label="Play video"
                  >
                    <span className="rounded-full bg-white/90 px-3 py-2 text-sm font-semibold shadow">
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
                <span className="text-[12px] sm:text-sm font-semibold text-zinc-900 truncate">
                  {title}
                </span>
                {isFresh(current?.startAt) && (
                  <span className="rounded bg-red-600 px-1.5 py-[1px] text-[10px] font-medium text-white shrink-0">
                    NEW
                  </span>
                )}
              </div>
              {body ? (
                <p className="mt-1 line-clamp-2 text-[11px] sm:text-sm text-white/95 drop-shadow">
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
            transition={{ duration: progressDurationSec, ease: "linear" }}
            className={`h-full ${barClassName}`}
          />
        </div>

        {/* dots (hidden for single item) */}
        {normalizedItems.length > 1 && (
          <div className="absolute right-2 top-2 flex gap-1.5">
            {normalizedItems.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i === idx ? "bg-emerald-600" : "bg-zinc-300 hover:bg-zinc-400"
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300`}
              />
            ))}
          </div>
        )}
      </div>

      {/* viewer modal */}
      <AnimatePresence>
        {viewer && (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/70 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewer(null)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="mx-auto mt-10 w-full max-w-4xl rounded-2xl bg-black p-3 shadow-2xl"
              initial={{ y: 24, opacity: 0.96 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0.96 }}
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
              ) : (
                <div className="p-6 text-center text-white/90">No media available</div>
              )}

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
