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
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto py-1">
        <LayoutGroup id="date-chips">
          {chips.map((c) => {
            const active = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`relative whitespace-nowrap rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium transition ${
                  active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {c.label}
                {c.meta ? ` · ${c.meta}` : ""}
                {active && (
                  <motion.span
                    layoutId="chip-pill"
                    className={`absolute inset-0 -z-10 rounded-full ${pillClass}`}
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
