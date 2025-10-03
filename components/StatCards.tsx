"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

type Stat = { label: string; value: number; sub?: string };

function CountUp({ to }: { to: number }) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 120, damping: 20, mass: 0.6 });
  const rounded = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    mv.set(to);
  }, [to]); // eslint-disable-line

  return <motion.span>{rounded}</motion.span>;
}

export default function StatCards({
  stats,
  softBgClass, // e.g., "bg-amber-50"
  primaryTextClass, // e.g., "text-amber-900"
}: {
  stats: Stat[];
  softBgClass: string;
  primaryTextClass: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.06, ease: "easeOut" }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm`}
        >
          <div className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full ${softBgClass}`} />
          <div className="text-xs font-medium text-zinc-500">{s.label}</div>
          <div className={`mt-1 text-2xl font-semibold ${primaryTextClass}`}>
            <CountUp to={s.value} />
          </div>
          {s.sub && <div className="mt-1 text-xs text-zinc-500">{s.sub}</div>}
        </motion.div>
      ))}
    </div>
  );
}
