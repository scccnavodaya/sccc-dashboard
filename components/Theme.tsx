"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export type TabKey = "OVERALL" | "MAT" | "ENGLISH" | "MATHS";

export const colorMap: Record<TabKey, {
  name: string;
  // page bg gradient (tailwind classes)
  gradientFrom: string;
  gradientTo: string;
  // UI accents
  pill: string;
  text: string;
  border: string;
  chip: string;
  bar: string;
}> = {
  OVERALL: { name: "Overall", gradientFrom: "from-emerald-50", gradientTo: "to-white", pill: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200", chip: "bg-emerald-50", bar: "bg-emerald-500" },
  MAT:     { name: "MAT",     gradientFrom: "from-amber-50",   gradientTo: "to-white", pill: "bg-amber-100",   text: "text-amber-900",   border: "border-amber-200",   chip: "bg-amber-50",   bar: "bg-amber-500" },
  ENGLISH: { name: "ENGLISH", gradientFrom: "from-sky-50",     gradientTo: "to-white", pill: "bg-sky-100",     text: "text-sky-900",     border: "border-sky-200",     chip: "bg-sky-50",     bar: "bg-sky-500" },
  MATHS:   { name: "MATHS",   gradientFrom: "from-violet-50",  gradientTo: "to-white", pill: "bg-violet-100",  text: "text-violet-900",  border: "border-violet-200",  chip: "bg-violet-50",  bar: "bg-violet-500" },
};

export function GradientBackground({ tab, children }: { tab: TabKey; children: ReactNode }) {
  const t = colorMap[tab];

  return (
    <div className="relative">
      {/* animated gradient layer */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`absolute inset-0 bg-gradient-to-b ${t.gradientFrom} ${t.gradientTo}`}
          />
        </AnimatePresence>
      </div>
      {children}
    </div>
  );
}
