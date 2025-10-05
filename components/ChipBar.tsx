// components/ChipBar.tsx
"use client";

import { motion, LayoutGroup } from "framer-motion";

export type ChipKey = "OVERALL" | "MAT" | "ENGLISH" | "MATHS" | "FEEDBACK";

export default function ChipBar({
  active,
  onChange,
  colorByKey,
}: {
  active: ChipKey;
  onChange: (k: ChipKey) => void;
  colorByKey: Record<ChipKey, { pill: string; text: string }>;
}) {
  const items: { key: ChipKey; label: string }[] = [
    { key: "OVERALL", label: "Overall" },
    { key: "MAT", label: "MAT" },
    { key: "ENGLISH", label: "ENGLISH" },
    { key: "MATHS", label: "MATHS" },
    { key: "FEEDBACK", label: "Feedback" },
  ];

  return (
    <div
      className="
        w-full max-w-full min-w-0
        rounded-2xl border border-zinc-200 bg-white p-1
        overflow-x-auto
        [scrollbar-width:thin]
      "
      role="tablist"
      aria-label="Sections"
    >
      {/* scrollable row; uses snap for nicer touch UX */}
      <div
        className="
          flex items-center gap-1 px-1 w-max min-w-full
          snap-x snap-mandatory
          -mx-1
        "
      >
        <LayoutGroup id="section-chips">
          {items.map((it, idx) => {
            const isActive = active === it.key;
            const theme = colorByKey[it.key];
            return (
              <motion.button
                key={it.key}
                onClick={() => onChange(it.key)}
                whileTap={{ scale: 0.98 }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${it.key}`}
                tabIndex={0}
                // snap align makes the clicked/active chip center when scrolled programmatically by user agent
                className={`
                  snap-center
                  relative rounded-full
                  h-9 sm:h-10
                  px-3 sm:px-4
                  text-sm sm:text-sm font-medium
                  whitespace-nowrap
                  transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300
                  ${isActive ? theme.text : "text-zinc-500 hover:text-zinc-800"}
                `}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {it.label}

                {isActive && (
                  <motion.span
                    layoutId="chip-pill-active"
                    className={`pointer-events-none absolute inset-0 -z-10 rounded-full ${theme.pill} shadow-sm`}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </motion.button>
            );
          })}
        </LayoutGroup>
      </div>
    </div>
  );
}
