// app/(public)/page.tsx
"use client";

import React from "react";
import type { Transition } from "framer-motion";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Home, BarChart3, Trophy, Images, MessageSquareHeart, Lock } from "lucide-react";

import HomeScreen from "@/components/HomeScreen";
import ScoresScreen from "@/components/ScoresScreen";
import LeaderboardScreen from "@/components/LeaderboardScreen";
import NoticesScreen from "@/components/NoticesScreen";
import FeedbackScreen from "@/components/FeedbackScreen";
import AdminScreen from "@/components/AdminScreen";

/* Fixed frame (matches admin) */
const FRAME_W = 360;
const FRAME_H = 600;
const TOPBAR_H = 44;

type TabKey = "home" | "scores" | "leaderboard" | "notices" | "feedback" | "admin";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "home",        label: "Home",        icon: Home },
  { key: "scores",      label: "Scores",      icon: BarChart3 },
  { key: "leaderboard", label: "Leaderboard", icon: Trophy },
  { key: "notices",     label: "Notices",     icon: Images },
  { key: "feedback",    label: "Feedback",    icon: MessageSquareHeart },
  { key: "admin",       label: "Admin",       icon: Lock },
];

/* Motion transitions */
const fadeSlide: Transition   = { duration: 0.16, ease: [0.16, 1, 0.3, 1] };
const drawerSlide: Transition = { duration: 0.12, ease: [0.2, 0.8, 0.2, 1] };

/* Hash-based tab */
function getHash(): TabKey {
  const raw = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  const k = raw as TabKey;
  return TABS.some(t => t.key === k) ? k : "home";
}

export default function PublicPhonePage() {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>(() => getHash());
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Single lightbox (only opens for images explicitly marked)
  const [photoSrc, setPhotoSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onHash = () => setTab(getHash());
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    if (tab !== "home" && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [tab]);

  const isScrollable = tab !== "home";

  function go(next: TabKey) {
    if (typeof window !== "undefined") {
      if (window.location.hash !== `#${next}`) {
        window.location.hash = next;
      } else {
        setTab(next);
        window.dispatchEvent(new CustomEvent("public-nav", { detail: next }));
      }
    }
    setOpen(false);
  }

  // Only open our lightbox when the clicked <img> has data-student-photo="1"
  function handleContentClick(e: React.MouseEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement | null;
    if (!t || !(t instanceof HTMLImageElement)) return;
    if (t.dataset.studentPhoto === "1") {
      e.preventDefault();
      e.stopPropagation(); // don’t bubble to components that might also listen
      const src = t.currentSrc || t.src;
      if (src) setPhotoSrc(src);
    }
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50 text-zinc-900 selection:bg-emerald-200/60">
      <div className="mx-auto my-6 flex items-start justify-center">
        {/* Fixed phone frame */}
        <div
          className="relative overflow-hidden rounded-2xl border bg-white shadow-sm"
          style={{ width: FRAME_W, height: FRAME_H }}
        >
          {/* Top bar */}
          <div
            className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-2 py-1.5"
            style={{ height: TOPBAR_H }}
          >
            <button
              onClick={() => setOpen(v => !v)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-zinc-700 hover:bg-zinc-50 active:scale-[0.99]"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="public-inset-drawer"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="pointer-events-none select-none text-[11px] text-zinc-500">SCCC</div>
            <div className="w-8" />
          </div>

          {/* Content area */}
          <div className="px-2 pb-2 pt-1" style={{ height: FRAME_H - TOPBAR_H }}>
            {isScrollable ? (
              <div
                ref={scrollRef}
                className="h-full w-full overflow-y-auto will-change-transform"
                onClick={handleContentClick}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={fadeSlide}
                    className="h-full w-full"
                  >
                    {tab === "scores"      && <ScoresScreen />}
                    {tab === "leaderboard" && <LeaderboardScreen />}
                    {tab === "notices"     && <NoticesScreen />}
                    {tab === "feedback"    && <FeedbackScreen />}
                    {tab === "admin"       && <AdminScreen />}
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              // HOME: no scroll
              <div className="h-full w-full overflow-hidden" onClick={handleContentClick}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={fadeSlide}
                    className="h-full w-full"
                  >
                    <HomeScreen />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Drawer */}
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
                  id="public-inset-drawer"
                  className="absolute left-0 top-0 z-50 h-full w-[78%] max-w-[300px] overflow-hidden rounded-r-2xl border-r bg-white shadow-md"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  exit={{ x: -20 }}
                  transition={drawerSlide}
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
                      const active = tab === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => go(t.key)}
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

          {/* Lightbox (only opens for data-student-photo="1") */}
          <AnimatePresence>
            {photoSrc && (
              <motion.div
                className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center p-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPhotoSrc(null)}
                role="dialog"
                aria-modal="true"
                aria-label="Photo viewer"
              >
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="max-w-full max-h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoSrc}
                    alt="Student photo"
                    className="max-h-[88vh] max-w-[88vw] object-contain rounded-lg shadow-2xl"
                  />
                  <div className="mt-2 text-center">
                    <button
                      onClick={() => setPhotoSrc(null)}
                      className="rounded bg-white/90 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-white"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
