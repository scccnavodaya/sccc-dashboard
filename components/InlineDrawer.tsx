// components/InlineDrawer.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Home, Trophy, FileText, Bell, MessageSquare, User } from "lucide-react";

export type DrawerKey = "home" | "leaderboard" | "scores" | "notices" | "feedback" | "admin";

type InlineDrawerProps = {
  active?: DrawerKey;
  onChange?: (k: DrawerKey) => void;
  compact?: boolean;
};

export default function InlineDrawer({ active, onChange, compact = true }: InlineDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { setOpen(false); }, [active]);

  const items: { key: DrawerKey; label: string; Icon: any; href?: string }[] = [
    { key: "home",        label: "Home",      Icon: Home },
    { key: "leaderboard", label: "Top",       Icon: Trophy },
    { key: "scores",      label: "Scores",    Icon: FileText },
    { key: "notices",     label: "Notices",   Icon: Bell },
    { key: "feedback",    label: "Feedback",  Icon: MessageSquare },
    { key: "admin",       label: "Admin",     Icon: User },
  ];

  function navigateTo(itKey: DrawerKey, href?: string) {
    setOpen(false);
    if (onChange) onChange(itKey);
    else if (href) router.push(href);
  }

  return (
    <div style={{ position: "relative", width: 44, height: 44 }}>
      {/* hamburger button */}
      <button
        ref={buttonRef}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid place-items-center rounded-full p-2 border border-zinc-100 bg-white shadow-sm"
        style={{ width: 40, height: 40, boxShadow: "0 6px 18px rgba(2,6,23,0.06)" }}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* animated popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Inline menu"
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: 0,
              bottom: 52,
              width: 260,
              maxWidth: "calc(100vw - 48px)",
              background: "white",
              borderRadius: 12,
              padding: 8,
              boxShadow: "0 12px 34px rgba(2,6,23,0.12)",
              border: "1px solid rgba(0,0,0,0.04)",
              zIndex: 40,
            }}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Menu</div>
              <div style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>Quick nav</div>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((it) => {
                const isActive = active === it.key;
                return (
                  <button
                    key={it.key}
                    onClick={() => navigateTo(it.key, it.href)}
                    className={`flex items-center gap-3 p-2 rounded transition-colors ${
                      isActive ? "bg-emerald-50" : "hover:bg-zinc-50"
                    }`}
                    style={{ textAlign: "left", border: "none", cursor: "pointer", background: "transparent" }}
                  >
                    <span
                      className={`grid place-items-center rounded-full p-2 ${
                        isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                      }`}
                      style={{ width: 36, height: 36 }}
                    >
                      <it.Icon size={16} />
                    </span>
                    <span
                      className={`text-[14px] ${isActive ? "text-emerald-700 font-medium" : "text-zinc-800"}`}
                      style={{ flex: 1 }}
                    >
                      {it.label}
                    </span>
                    {isActive && <span className="text-[11px] text-emerald-600">active</span>}
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
