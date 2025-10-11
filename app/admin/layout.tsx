// app/admin/layout.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Newspaper,
  Megaphone,
  Images,
  Users,
  ClipboardList,
  Settings,
  MessageSquareHeart, // ⬅️ added
} from "lucide-react";

const TABS = [
  { label: "Home", href: "/admin", icon: Home },
  { label: "Feed", href: "/admin/feed", icon: Newspaper },
  { label: "Exam", href: "/admin/exam-notices", icon: Megaphone },
  { label: "Notices", href: "/admin/notices", icon: Images },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Tests", href: "/admin/tests", icon: ClipboardList },
  { label: "Feedback", href: "/admin/feedback", icon: MessageSquareHeart }, // ⬅️ inserted here
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

// ⬇️ Choose your fixed frame size here
const FRAME_W = 360;    // px
const FRAME_H = 600;    // px  <-- make this smaller/bigger to taste
const TOPBAR_H = 44;    // px (matches the top bar padding/height)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const activeHref = useMemo(() => {
    const m = TABS.find(t => pathname === t.href || pathname?.startsWith(t.href + "/"));
    return m?.href ?? "/admin";
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    // @ts-ignore
    router.prefetch?.("/admin");
    TABS.forEach(t => router.prefetch?.(t.href));
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-zinc-50 text-zinc-900 selection:bg-emerald-200/60">
      <div className="mx-auto my-6 flex items-start justify-center">
        {/* Fixed-size phone frame */}
        <div
          className="relative overflow-hidden rounded-2xl border bg-white shadow-sm"
          style={{ width: FRAME_W, height: FRAME_H }}
        >
          {/* Top bar (height = TOPBAR_H) */}
          <div
            className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-2 py-1.5"
            style={{ height: TOPBAR_H }}
          >
            {/* Left: hamburger */}
            <button
              onClick={() => setOpen(v => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-zinc-700 hover:bg-zinc-50 active:scale-[0.99]"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="admin-inset-drawer"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Center: title */}
            <div className="pointer-events-none select-none text-[11px] text-zinc-500">Admin</div>

            {/* Right: Logout */}
            <button
              onClick={() => (window.location.href = "/")}
              className="inline-flex h-8 items-center justify-center rounded-md border px-2 text-[11px] text-red-600 hover:bg-red-50 active:scale-[0.99]"
              title="Logout"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>

          {/* Content area: fixed height = FRAME_H - TOPBAR_H */}
          <div className="px-2 pb-2 pt-2" style={{ height: FRAME_H - TOPBAR_H }}>
            <div className="h-full w-full overflow-y-auto will-change-transform">
              {children}
            </div>
          </div>

          {/* In-card drawer + backdrop (unchanged, still snappy) */}
          <AnimatePresence initial={false}>
            {open && (
              <>
                <motion.button
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="absolute inset-0 z-40 bg-black/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                />
                <motion.aside
                  id="admin-inset-drawer"
                  className="absolute left-0 top-0 z-50 h-full w-[78%] max-w-[300px] overflow-hidden rounded-r-2xl border-r bg-white shadow-md"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  exit={{ x: -20 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-emerald-400">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.jpeg" alt="Logo" className="h-full w-full object-contain" />
                      </div>
                      <div className="text-sm font-semibold text-emerald-800">Success Career</div>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-zinc-50"
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <nav className="px-2 py-2">
                    {TABS.map(t => {
                      const Icon = t.icon;
                      const active = activeHref === t.href;
                      return (
                        <button
                          key={t.href}
                          onClick={() => {
                            if (pathname !== t.href) router.push(t.href);
                            else setOpen(false);
                          }}
                          className={`mb-1 flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left ${
                            active ? "bg-emerald-50 text-emerald-800" : "text-zinc-700 hover:bg-zinc-50"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md">
                            <Icon size={18} />
                          </span>
                          <span className="text-sm">{t.label}</span>
                          {active && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="mt-auto border-t px-3 py-3 text-[11px] text-zinc-500">
                    Designed &amp; Developed by{" "}
                    <span className="font-medium text-emerald-700">Karam Suresh</span>
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Lightweight prefetch anchors for instant tab switches */}
          <div className="hidden">
            {TABS.map(t => (
              <a key={t.href} href={t.href} rel="prefetch" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
