"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
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
  // examTexts prop is kept for compatibility but no longer used (live data wins)
  examTexts = [],
  onOpenAdmin,
}: {
  month: string;
  onMonthChange: (ym: string) => void;
  examTexts?: LatestExamItem[]; // ignored; live data used instead
  onOpenAdmin?: () => void;
}) {
  const { scrollY } = useScroll();
  const h = useTransform(scrollY, [0, 200], [112, 92]);
  const logo = useTransform(scrollY, [0, 200], [56, 42]);

  // ---- LIVE ticker fetch ----
  const [notices, setNotices] = useState<ExamNotice[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function loadLive() {
    try {
      // Public read: no credentials needed
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
    // Optional: light polling so header updates if admin publishes while user sits on page
    const t = setInterval(loadLive, 60_000); // 60s
    return () => clearInterval(t);
  }, []);

  // pick active (or latest) and map to LatestExamTicker items
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
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div style={{ height: h }} className="flex flex-col">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4">
          <div className="rounded-b-2xl border border-emerald-100 bg-white/70 backdrop-blur-md shadow-sm">
            {/* Top row */}
            <div
              className="grid grid-cols-3 items-center px-3 sm:px-4"
              style={{ height: "100%" }}
            >
              {/* LEFT: hamburger trigger + logo */}
              <div className="flex items-center justify-start gap-6 py-2">
                <button
                  aria-label="Open admin"
                  onClick={() => onOpenAdmin?.()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white/90 hover:bg-white"
                >
                  <Menu size={18} />
                </button>

                <motion.div
                  style={{ width: logo, height: logo }}
                  className="overflow-hidden rounded-xl bg-white shadow"
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
              <div className="flex flex-col items-center justify-center text-center py-2">
                <h1 className="brand-title text-lg md:text-xl">
                  Success Career Coaching Center
                </h1>
                <p className="text-xs md:text-sm text-emerald-900/80">
                  {ADDRESS}
                </p>
              </div>

              {/* RIGHT: month picker */}
              <div className="flex items-center justify-end py-2 pr-2 sm:pr-3">
                <MonthPicker value={month} onChange={onMonthChange} />
              </div>
            </div>

            {/* Slim LatestExam strip (text-only, now LIVE) */}
            <div className="border-t border-emerald-100/80 px-3 pb-2 sm:px-4">
              <LatestExamTicker
                items={liveItems /* live from API */}
                intervalMs={30000}
                // If you want to show nothing until loaded, you can gate with loaded && liveItems
              />
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
