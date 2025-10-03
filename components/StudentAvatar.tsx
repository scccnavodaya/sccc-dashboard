"use client";

import { motion } from "framer-motion";

export default function StudentAvatar({
  name,
  src,
  topper = false,
  size = 28,
}: {
  name: string;
  src?: string;
  topper?: boolean;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={`Photo of ${name}`}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-700">
          {initials}
        </div>
      )}
      {topper && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-amber-500"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      )}
    </div>
  );
}
