"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * AnimatedCardScreen — used for non-home tabs (Scores, Notices, Feedback)
 * Gives a floating card feel like iOS bottom sheet / Facebook tab switch.
 */
export default function AnimatedCardScreen({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="
        relative mx-auto mt-6 mb-4
        w-full max-w-md
        rounded-3xl border border-emerald-100
        bg-white shadow-xl
        overflow-hidden
        flex flex-col
      "
      style={{
        height: "calc(100vh - 110px)",
      }}
    >
      {title && (
        <div className="p-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 font-semibold text-center text-sm">
          {title}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
        {children}
      </div>
    </motion.div>
  );
}
