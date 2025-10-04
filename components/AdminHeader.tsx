// components/AdminHeader.tsx
"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";

const ADDRESS = "Moirang Phiwangbam Leikai";

export default function AdminHeader({
  month,               // kept for API compatibility (even if not used)
  onMonthChange,       // kept for API compatibility (even if not used)
}: {
  month: string;
  onMonthChange: (ym: string) => void;
}) {
  const router = useRouter();
  const { scrollY } = useScroll();
  const prefersReduced = useReducedMotion();

  // Animate header height and logo size on scroll; fall back if reduced motion
  const h = prefersReduced
    ? 96
    : useTransform(scrollY, [0, 200], [112, 88]);   // from tall to compact
  const logo = prefersReduced
    ? 48
    : useTransform(scrollY, [0, 200], [56, 42]);    // logo scales down slightly

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/");
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Wrapper that animates height; safe-area padding to avoid notch clipping */}
      <motion.div
        style={{ height: h as any }}
        className="flex flex-col safe-x safe-y"
      >
        <div className="mx-auto w-full max-w-screen-xl px-3 sm:px-4 lg:px-6">
          <div
            className="
              rounded-b-2xl border border-emerald-100
              bg-white/80 supports-[backdrop-filter]:bg-white/55
              backdrop-blur-md shadow-sm
              soft-shadow
            "
          >
            {/* 3-column grid: left (logo) / center (title) / right (actions) */}
            <div
              className="
                grid items-center px-3 sm:px-4
                grid-cols-[auto_minmax(0,1fr)_auto]
              "
              style={{ height: "100%" }}
            >
              {/* LEFT: Logo */}
              <div className="flex items-center justify-start gap-3 sm:gap-4 py-2 min-w-0">
                <motion.div
                  style={{ width: logo as any, height: logo as any }}
                  className="overflow-hidden rounded-xl bg-white shadow shrink-0 ring-1 ring-zinc-100"
                >
                  <Image
                    src="/logo.jpeg"
                    alt="SCCC Logo"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    priority
                  />
                </motion.div>
              </div>

              {/* CENTER: Name + address (centered, clamps to prevent wrap chaos) */}
              <div className="flex flex-col items-center justify-center text-center py-2 min-w-0">
                <h1 className="brand-title text-sm sm:text-base md:text-lg leading-tight line-clamp-1">
                  Success Career Coaching Centre
                </h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-emerald-900/80 truncate w-full">
                  {ADDRESS}
                </p>
              </div>

              {/* RIGHT: Actions */}
              <div className="flex items-center justify-end gap-2 py-2 pr-2 sm:pr-3">
                <button
                  onClick={logout}
                  className="
                    h-9 sm:h-10 rounded-md bg-emerald-600
                    px-3 sm:px-4 text-xs sm:text-sm font-medium text-white
                    hover:bg-emerald-700 active:scale-[0.99]
                  "
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
