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
    <div className="rounded-2xl border border-zinc-200 bg-white p-1 overflow-x-auto">
      <div className="flex items-center gap-2">
        <LayoutGroup id="section-chips">
          {items.map((it) => {
            const isActive = active === it.key;
            const theme = colorByKey[it.key];
            return (
              <motion.button
                key={it.key}
                onClick={() => onChange(it.key)}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? theme.text : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {it.label}
                {isActive && (
                  <motion.span
                    layoutId="chip-pill-active"
                    className={`absolute inset-0 -z-10 rounded-full ${theme.pill} shadow-sm`}
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
