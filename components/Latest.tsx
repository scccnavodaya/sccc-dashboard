"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type LatestItem = {
  title: string;
  category?: "exam" | "notice" | "event";
  createdAt?: string;
};

function formatIST(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Latest({ items = [] as LatestItem[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const latest = useMemo<LatestItem>(() => {
    if (items.length > 0) return items[0];
    return { title: "Welcome! Stay tuned for updates.", category: "notice" };
  }, [items]);

  const badge =
    latest.category === "exam"
      ? "Exam"
      : latest.category === "event"
      ? "Event"
      : "Notice";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="relative w-full max-w-full overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/60 via-transparent to-emerald-50/60" />
      <div className="relative flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 min-w-0">
        <span className="inline-flex select-none items-center rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-white shrink-0">
          Latest {badge}
        </span>

        {/* Title: flexible, truncates on small screens */}
        <span
          className="text-sm sm:text-base text-emerald-900 min-w-0 flex-1 truncate"
          title={latest.title}
        >
          {latest.title}
        </span>

        {/* Time: keep from shrinking */}
        <span className="ml-auto text-[11px] sm:text-xs text-emerald-700 shrink-0">
          {formatIST(now)} IST
        </span>
      </div>
    </motion.div>
  );
}
