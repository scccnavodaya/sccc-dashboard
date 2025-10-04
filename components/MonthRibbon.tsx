"use client";

import { motion } from "framer-motion";

export default function MonthRibbon({
  month,
  testsCount,
  matCount,
  engCount,
  mathsCount,
  accentClass, // e.g., "from-amber-50 to-white"
  textClass = "text-zinc-700",
}: {
  month: string;           // "2025-09"
  testsCount: number;      // total tests in month
  matCount: number;
  engCount: number;
  mathsCount: number;
  accentClass: string;     // Tailwind gradient classes
  textClass?: string;
}) {
  // Month label (e.g., "September 2025")
  const label = (() => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, (m ?? 1) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`mb-3 w-full max-w-full overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-r ${accentClass}`}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 min-w-0">
        {/* Month label: grows, truncates on tiny screens */}
        <span className={`text-sm sm:text-base font-semibold ${textClass} min-w-0 flex-1 truncate`}>
          {label}
        </span>

        {/* Divider: hide on small screens (when content wraps) */}
        <span className="hidden sm:block h-4 w-px bg-zinc-200/70" />

        <Badge>Tests: {testsCount}</Badge>
        <Badge>MAT: {matCount}</Badge>
        <Badge>ENGLISH: {engCount}</Badge>
        <Badge>MATHS: {mathsCount}</Badge>
      </div>
    </motion.div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
        shrink-0
        rounded-md border border-zinc-200 bg-white/60
        px-2.5 py-1
        text-[11px] sm:text-xs text-zinc-700
        backdrop-blur
      "
    >
      {children}
    </span>
  );
}
