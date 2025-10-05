// components/Header.tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu } from "lucide-react";
import MonthPicker from "@/components/MonthPicker";
import LatestExamTicker, { LatestExamItem } from "@/components/LatestExamTicker";

const ADDRESS = "Moirang Phiwangbam Leikai";

type ExamNotice = {
  id: string;
  text: string;
  active: boolean;
  start_at: string; // ISO
  end_at?: string | null;
};

export default function Header({
  month,
  onMonthChange,
  examTexts = [],
  onOpenAdmin,
}: {
  month: string;
  onMonthChange: (ym: string) => void;
  examTexts?: LatestExamItem[];
  onOpenAdmin?: () => void;
}) {
  const { scrollY } = useScroll();

  // animate header height and logo size on scroll (smooth, subtle)
  const headerHeight = useTransform(scrollY, [0, 200], [112, 88]); // tall -> compact
  const logoSize = useTransform(scrollY, [0, 200], [56, 42]);

  // Reference for header height observer (keeps --header-h accurate)
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!headerRef.current) return;
    const el = headerRef.current;
    const setVar = () => {
      // offsetHeight reads the computed pixel height (motion value is used for visual transform)
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- LIVE ticker fetch (keeps header fast to render) ----
  // note: we still honor examTexts prop — if not provided we fetch server list
  const liveItems = useMemo<LatestExamItem[]>(() => {
    if (Array.isArray(examTexts) && examTexts.length > 0) return examTexts;
    // fallback empty — the LatestExamTicker will show "No notice yet"
    return [];
  }, [examTexts]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 safe-x safe-y"
      role="banner"
      aria-label="Site header"
    >
      <motion.div
        ref={headerRef}
        // motion value used for visual height; ResizeObserver syncs real height into --header-h
        style={{ height: headerHeight } as any}
        className="flex flex-col"
      >
        <div className="mx-auto w-full max-w-screen-xl px-2.5 sm:px-4 lg:px-6">
          <div
            className="
              overflow-hidden rounded-b-2xl border border-emerald-100
              bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60
              shadow-sm
            "
          >
            {/* Top row: three-column grid */}
            <div
              className="
                grid items-center px-2 sm:px-3
                grid-cols-[auto_minmax(0,1fr)_auto]   /* L / fluid center / R */
              "
              style={{ height: "100%" }}
            >
              {/* LEFT: hamburger trigger + logo */}
              <div className="flex items-center justify-start gap-2.5 sm:gap-3 py-2 min-w-0">
                <button
                  aria-label="Open admin"
                  onClick={() => onOpenAdmin?.()}
                  className="
                    inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center
                    rounded-md border border-zinc-200 bg-white/90 hover:bg-white
                    shrink-0
                  "
                >
                  <Menu size={18} />
                </button>

                <motion.div
                  style={{ width: logoSize as any, height: logoSize as any }}
                  className="overflow-hidden rounded-xl bg-white shadow shrink-0"
                >
                  <Image
                    src="/logo.jpeg"
                    alt="SCCC Logo"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    priority
                  />
                </motion.div>
              </div>

              {/* CENTER: name + address (compact, wraps gracefully) */}
              <div className="flex flex-col items-center justify-center text-center py-2 min-w-0">
                <h1 className="brand-title text-[13px] sm:text-sm md:text-lg lg:text-xl leading-tight text-balance line-clamp-2">
                  Success Career Coaching Centre
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-emerald-900/80 truncate w-full">
                  {ADDRESS}
                </p>
              </div>

              {/* RIGHT: month picker (compact on mobile) */}
              <div className="flex items-center justify-end py-2 pr-1 sm:pr-2 min-w-0">
                <div
                  className="
                    min-w-0
                    text-[11px] sm:text-sm
                    scale-[0.95] sm:scale-100
                    origin-right
                  "
                  style={{
                    // cap real width to avoid overflow on tiny phones
                    maxWidth: "min(52vw, 260px)",
                  }}
                >
                  {/* MonthPicker should be responsive; we wrap it to constrain width and visual size */}
                  <MonthPicker value={month} onChange={onMonthChange} />
                </div>
              </div>
            </div>

            {/* Slim LatestExam strip (LIVE ticker) — smaller text on phones */}
            <div className="border-t border-emerald-100/80 px-2 sm:px-3 pb-2">
              <div className="min-w-0 overflow-hidden">
                <LatestExamTicker
                  items={liveItems}
                  intervalMs={30000}
                  className="text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
