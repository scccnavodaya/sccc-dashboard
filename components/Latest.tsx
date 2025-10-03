"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type LatestItem = {
  title: string;          // e.g., "Exam Results Published"
  category?: "exam" | "notice" | "event";
  // optional: createdAt ISO string if you later pull from DB
  createdAt?: string;
};

function formatIST(date: Date) {
  // Asia/Kolkata time with day + time
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

  // tick every 30s to keep clock fresh
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // If you later pass items from DB with createdAt, you can sort by createdAt desc here.
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
      className="relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/60 via-transparent to-emerald-50/60" />
      <div className="relative flex flex-wrap items-center gap-2 px-3 py-2">
        <span className="inline-flex select-none items-center rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
          Latest {badge}
        </span>
        <span className="text-sm text-emerald-900">{latest.title}</span>
        <span className="ml-auto text-xs text-emerald-700">
          {formatIST(now)} IST
        </span>
      </div>
    </motion.div>
  );
}
