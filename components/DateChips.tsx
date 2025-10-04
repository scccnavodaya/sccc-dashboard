"use client";

import { motion, LayoutGroup } from "framer-motion";

export type Chip = { id: string; label: string; meta?: string };

export default function DateChips({
  chips,
  activeId,
  onSelect,
  pillClass,
}: {
  chips: Chip[];
  activeId: string;
  onSelect: (id: string) => void;
  pillClass: string; // e.g., "bg-amber-100"
}) {
  return (
    <div
      className="
        relative w-full max-w-full min-w-0
      "
    >
      <div
        className="
          flex gap-2 sm:gap-2.5
          overflow-x-auto
          py-1
          px-0.5
          scrollbar-thin scrollbar-thumb-zinc-200
          snap-x snap-mandatory
        "
        role="tablist"
        aria-label="Date chips"
      >
        <LayoutGroup id="date-chips">
          {chips.map((c) => {
            const active = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                role="tab"
                aria-selected={active}
                className={`
                  relative shrink-0 snap-start
                  whitespace-nowrap rounded-full
                  border border-zinc-200
                  px-3 sm:px-3.5
                  h-8 sm:h-9
                  text-xs sm:text-sm font-medium
                  transition-colors
                  ${active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"}
                `}
              >
                {c.label}
                {c.meta ? ` · ${c.meta}` : ""}
                {active && (
                  <motion.span
                    layoutId="chip-pill"
                    className={`absolute inset-0 -z-10 rounded-full ${pillClass} shadow-sm`}
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </LayoutGroup>
      </div>
    </div>
  );
}
