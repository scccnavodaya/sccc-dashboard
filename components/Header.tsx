// components/Header.tsx
"use client";

import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu } from "lucide-react";
import MonthPicker from "@/components/MonthPicker";
import LatestExamTicker, { LatestExamItem } from "@/components/LatestExamTicker";

const ADDRESS = "Moirang Phiwangbam Leikai";

type ExamNotice = {
  id: string;
  text: string;
  active: boolean;
  start_at: string;        // ISO
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
  const h = useTransform(scrollY, [0, 200], [112, 92]);
  const logo = useTransform(scrollY, [0, 200], [56, 42]);

  // Reference for header height observer
  const headerRef = useRef<HTMLDivElement | null>(null);

  // Keep CSS var --header-h in sync with real header height
  useEffect(() => {
    if (!headerRef.current) return;
    const el = headerRef.current;
    const setVar = () => {
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- LIVE ticker fetch ----
  const [notices, setNotices] = useState<ExamNotice[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function loadLive() {
    try {
      const res = await fetch("/api/exam-ticker", { cache: "no-store" });
      const data = (await res.json().catch(() => [])) as ExamNotice[] | any;
      if (!res.ok || !Array.isArray(data)) {
        setNotices([]);
      } else {
        setNotices(
          data.sort(
            (a, b) =>
              new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
          )
        );
      }
    } catch {
      setNotices([]);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    loadLive();
    const t = setInterval(loadLive, 60_000); // refresh every 60s
    return () => clearInterval(t);
  }, []);

  const liveItems: LatestExamItem[] = useMemo(() => {
    if (!notices.length) return [];
    const active = notices.find((n) => n.active) ?? notices[0];
    return [
      {
        id: active.id,
        text: active.text,
        startAt: active.start_at,
      },
    ];
  }, [notices]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 safe-x safe-y">
      <motion.div ref={headerRef} style={{ height: h }} className="flex flex-col">
        <div className="mx-auto w-full max-w-screen-xl px-2.5 sm:px-4 lg:px-6">
          <div
            className="
              rounded-b-2xl border border-emerald-100
              bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60
              shadow-sm overflow-hidden
            "
          >
            {/* Top row */}
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
                  style={{ width: logo, height: logo }}
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

              {/* CENTER: name + address */}
              <div className="flex flex-col items-center justify-center text-center py-2 min-w-0">
                {/* Allow text to wrap gracefully on very small devices */}
                <h1 className="brand-title text-[13px] sm:text-sm md:text-lg lg:text-xl leading-tight text-balance">
                  Success Career Coaching Centre
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-emerald-900/80 truncate w-full">
                  {ADDRESS}
                </p>
              </div>

              {/* RIGHT: month picker */}
              <div className="flex items-center justify-end py-2 pr-1 sm:pr-2 min-w-0">
                <div className="min-w-0">
                  <div className="max-w-[52vw] sm:max-w-none">
                    <MonthPicker value={month} onChange={onMonthChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Slim LatestExam strip (LIVE ticker) */}
            <div className="border-t border-emerald-100/80 px-2 sm:px-3 pb-2">
              <LatestExamTicker items={liveItems} intervalMs={30000} />
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
