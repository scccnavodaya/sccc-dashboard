// components/AdminHeader.tsx
"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
// import MonthPicker from "@/components/MonthPicker"; // removed

const ADDRESS = "Moirang Phiwangbam Leikai";

export default function AdminHeader({
  month,
  onMonthChange,
}: {
  month: string;
  onMonthChange: (ym: string) => void;
}) {
  const router = useRouter();
  const { scrollY } = useScroll();
  const h = useTransform(scrollY, [0, 200], [112, 92]);
  const logo = useTransform(scrollY, [0, 200], [56, 42]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <motion.div style={{ height: h }} className="flex flex-col">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4">
          <div className="rounded-b-2xl border border-emerald-100 bg-white/70 backdrop-blur-md shadow-sm">
            {/* Top row */}
            <div className="grid grid-cols-3 items-center px-3 sm:px-4" style={{ height: "100%" }}>
              {/* LEFT: logo (month picker removed) */}
              <div className="flex items-center justify-start gap-4 py-2">
                <motion.div
                  style={{ width: logo, height: logo }}
                  className="overflow-hidden rounded-xl bg-white shadow"
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

                {/* MonthPicker removed */}
                {/* <div className="min-w-[180px]">
                  <MonthPicker value={month} onChange={onMonthChange} />
                </div> */}
              </div>

              {/* CENTER: name + address */}
              <div className="flex flex-col items-center justify-center text-center py-2">
                <h1 className="brand-title text-lg md:text-xl">
                  Success Career Coaching Center
                </h1>
                <p className="text-xs md:text-sm text-emerald-900/80">{ADDRESS}</p>
              </div>

              {/* RIGHT: actions (Change Password removed) */}
              <div className="flex items-center justify-end gap-2 py-2 pr-2 sm:pr-3">
                {/* <button
                  onClick={() => router.push("/admin/settings")}
                  className="rounded-md px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
                >
                  Change Password
                </button> */}
                <button
                  onClick={logout}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
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
