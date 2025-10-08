// components/ChipBar.tsx
"use client";

import { motion, LayoutGroup } from "framer-motion";
import React from "react";

export type ChipKey = "OVERALL" | "MAT" | "ENGLISH" | "MATHS" | "FEEDBACK";

type ColorEntry = { pill: string; text: string };

export default function ChipBar({
  active,
  onChange,
  colorByKey,
}: {
  active: ChipKey;
  onChange: (k: ChipKey) => void;
  colorByKey?: Partial<Record<ChipKey, ColorEntry>>;
}) {
  // label map for friendly display
  const labelMap: Record<ChipKey, string> = {
    OVERALL: "Overall",
    MAT: "MAT",
    ENGLISH: "English",
    MATHS: "Maths",
    FEEDBACK: "Feedback",
  };

  // derive keys from colorByKey if provided; otherwise fallback to sensible default (only subjects)
  const providedKeys = colorByKey && Object.keys(colorByKey).length > 0
    ? (Object.keys(colorByKey) as ChipKey[])
    : (["MAT", "ENGLISH", "MATHS"] as ChipKey[]);

  const items: { key: ChipKey; label: string }[] = providedKeys.map((k) => ({
    key: k,
    label: labelMap[k] ?? k,
  }));

  return (
    <div
      className="
        w-full max-w-full min-w-0
        rounded-2xl border border-zinc-200 bg-white p-1
        overflow-x-auto
        scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent
      "
      role="tablist"
      aria-label="Sections"
    >
      {/* Scrollable row — snap behavior for touch devices */}
      <div
        className="
          flex items-center gap-1 px-1 w-max min-w-full
          snap-x snap-mandatory
          -mx-1
        "
      >
        <LayoutGroup id="section-chips">
          {items.map((it) => {
            const isActive = active === it.key;
            const theme = (colorByKey && colorByKey[it.key]) ?? {
              pill: "bg-zinc-100",
              text: "text-zinc-800",
            };
            return (
              <motion.button
                key={it.key}
                onClick={() => onChange(it.key)}
                whileTap={{ scale: 0.96 }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${it.key}`}
                tabIndex={isActive ? 0 : -1}
                className={`
                  snap-center relative rounded-full
                  h-9 sm:h-10
                  px-3 sm:px-4
                  text-[13px] sm:text-sm font-medium
                  whitespace-nowrap truncate
                  transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300
                  ${
                    isActive
                      ? `${(theme as ColorEntry).text} z-10`
                      : "text-zinc-500 hover:text-zinc-800"
                  }
                `}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {it.label}

                {isActive && (
                  <motion.span
                    layoutId="chip-pill-active"
                    className={`pointer-events-none absolute inset-0 -z-10 rounded-full ${(theme as ColorEntry).pill} shadow-sm`}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                    }}
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
