"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = { items?: string[] };

export default function Ticker({ items = [] }: Props) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="px-3 py-2 text-sm text-zinc-500">
          <span className="font-medium text-zinc-700">Latest:</span> —
        </div>
      </div>
    );
  }

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 4000);
    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="px-3 py-2 text-sm">
        <div className="flex gap-2 text-zinc-500">
          <span className="shrink-0 font-medium text-zinc-700">Latest:</span>
          <div className="relative h-5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute"
              >
                {items[idx]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
