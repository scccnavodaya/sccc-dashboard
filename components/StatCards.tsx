"use client";

import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

type Stat = { label: string; value: number; sub?: string };

const nf = new Intl.NumberFormat();

/** Animated count-up that respects prefers-reduced-motion */
function CountUp({ to }: { to: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 120, damping: 20, mass: 0.6 });
  const rounded = useTransform(spring, (v) => nf.format(Math.round(v)));

  useEffect(() => {
    if (reduce) return; // static value if user prefers less motion
    mv.set(to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, reduce]);

  if (reduce) return <span>{nf.format(to)}</span>;
  return <motion.span>{rounded}</motion.span>;
}

export default function StatCards({
  stats,
  softBgClass,       // e.g., "bg-amber-50"
  primaryTextClass,  // e.g., "text-amber-900"
}: {
  stats: Stat[];
  softBgClass: string;
  primaryTextClass: string;
}) {
  return (
    <div
      className="
        grid gap-3 sm:gap-4
        [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]
        sm:[grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]
      "
      role="list"
    >
      {stats.map((s, i) => (
        <motion.div
          role="listitem"
          key={`${s.label}-${i}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.06, ease: "easeOut" }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="
            relative overflow-hidden rounded-2xl border border-zinc-200 bg-white
            p-3 sm:p-4 md:p-5 shadow-sm
          "
        >
          {/* soft decorative bubble */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full ${softBgClass}`}
          />
          <div className="text-[11px] sm:text-xs md:text-sm font-medium text-zinc-500 truncate">
            {s.label}
          </div>
          <div className={`mt-1 text-2xl sm:text-3xl font-semibold ${primaryTextClass}`}>
            <CountUp to={s.value} />
          </div>
          {s.sub && (
            <div className="mt-1 text-[11px] sm:text-xs md:text-sm text-zinc-500 truncate">
              {s.sub}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
