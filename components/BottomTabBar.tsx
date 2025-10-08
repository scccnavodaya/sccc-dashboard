// components/BottomTabBar.tsx
"use client";

import React from "react";
import {
  Home,
  Trophy,
  FileText,
  Bell,
  MessageSquare,
  User,
} from "lucide-react";

export type BottomKey =
  | "home"
  | "leaderboard"
  | "scores"
  | "notices"
  | "feedback"
  | "admin";

export default function BottomTabBar({
  active,
  onNavigate,
}: {
  active: BottomKey;
  onNavigate: (k: BottomKey) => void;
}) {
  const items: { key: BottomKey; label: string; Icon: any }[] = [
    { key: "home", label: "Home", Icon: Home },
    { key: "leaderboard", label: "Top", Icon: Trophy },
    { key: "scores", label: "Scores", Icon: FileText },
    { key: "notices", label: "Notices", Icon: Bell },
    { key: "feedback", label: "Feedback", Icon: MessageSquare },
    { key: "admin", label: "Admin", Icon: User },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="w-full max-w-full bg-transparent"
    >
      <ul className="flex items-center justify-between gap-1 px-1">
        {items.map((it) => {
          const sel = active === it.key;
          return (
            <li key={it.key} className="flex-1">
              <button
                onClick={() => onNavigate(it.key)}
                aria-current={sel ? "page" : undefined}
                aria-label={it.label}
                className={`w-full flex flex-col items-center gap-0.5 py-2 transition-colors ${
                  sel ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {/* small circular icon background when active */}
                <span
                  className={`grid place-items-center rounded-full p-1.5 ${
                    sel ? "bg-emerald-100" : "bg-transparent"
                  }`}
                >
                  <it.Icon size={16} />
                </span>

                {/* compact label: very small to save vertical space */}
                <span
                  className={`block text-[10px] leading-[10px] mt-0.5 ${
                    sel ? "font-semibold" : "font-medium"
                  }`}
                >
                  {it.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
