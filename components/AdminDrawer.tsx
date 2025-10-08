// components/AdminDrawer.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Newspaper,
  MessageSquare,
  Settings,
  Rss,
  X,
  Menu,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const ITEMS = [
  { key: "dash", label: "Dashboard", href: "/admin", Icon: LayoutDashboard },
  { key: "students", label: "Students", href: "/admin/students", Icon: Users },
  { key: "tests", label: "Tests", href: "/admin/tests", Icon: ClipboardList },
  { key: "notices", label: "Notices", href: "/admin/notices", Icon: FileText },
  { key: "feed", label: "Feed", href: "/admin/feed", Icon: Rss },
  { key: "ticker", label: "Ticker", href: "/admin/exam-notices", Icon: Newspaper },
  { key: "feedback", label: "Feedback", href: "/admin/feedback", Icon: MessageSquare },
  { key: "settings", label: "Settings", href: "/admin/settings", Icon: Settings },
];

/**
 * In-card drawer:
 * - collapsed: single hamburger button
 * - expanded: slide-out panel with icons + labels (no middle vertical rail)
 *
 * Render this inside AdminCardLayout (position:relative).
 */
export default function AdminDrawer({
  expanded,
  onToggle,
  onNavigate,
}: {
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: (href: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && expanded) onToggle();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, onToggle]);

  useEffect(() => {
    if (expanded) panelRef.current?.focus();
  }, [expanded]);

  function nav(href: string) {
    if (onNavigate) onNavigate(href);
    else router.push(href);
    // close after navigate for compact flow
    onToggle();
  }

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    // positioned inside the card; keep z-index above content
    <div className="absolute left-3 top-6 z-30 flex items-start" aria-hidden={false}>
      {/* Wrapped hamburger (always visible) */}
      <div className="flex flex-col items-center">
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Close menu" : "Open menu"}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition shadow-sm ${
            expanded ? "bg-emerald-100 text-emerald-700" : "bg-white text-zinc-700 hover:bg-zinc-50"
          } border`}
          title={expanded ? "Close menu" : "Open menu"}
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Expanded: only the slide-out panel with labels. No middle rail icons. */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            ref={panelRef}
            tabIndex={-1}
            className="ml-3 w-64 bg-white border rounded-xl shadow-md p-3"
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Admin Menu</div>
              <button
                onClick={onToggle}
                className="rounded p-1 text-zinc-600 hover:bg-zinc-50"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {ITEMS.map((it) => {
                const isAct = active(it.href);
                return (
                  <button
                    key={it.key}
                    onClick={() => nav(it.href)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                      isAct ? "bg-emerald-50 border border-emerald-100 text-emerald-800" : "hover:bg-zinc-50"
                    }`}
                    aria-current={isAct ? "page" : undefined}
                  >
                    <span className="shrink-0 text-zinc-700">
                      <it.Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{it.label}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
