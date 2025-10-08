// app/(public)/page.tsx
"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomTabBar, { BottomKey } from "@/components/BottomTabBar";

import HomeScreen from "@/components/HomeScreen";
import LeaderboardScreen from "@/components/LeaderboardScreen";
import ScoresScreen from "@/components/ScoresScreen";
import NoticesScreen from "@/components/NoticesScreen";
import FeedbackScreen from "@/components/FeedbackScreen";
import AdminScreen from "@/components/AdminScreen";

/**
 * App shell:
 * - Full viewport background (no outer page scroll)
 * - Centered card (slightly shifted up) that fills viewport height
 * - Home tab is non-scrollable (so footer credit remains visible)
 * - Other tabs render in the inner-scroll area so only inner content scrolls
 * - Fixed bottom tab bar (styles in globals.css)
 */
export default function Page() {
  const [activeTab, setActiveTab] = useState<BottomKey>("home");

  const screens: Record<BottomKey, React.ReactNode> = {
    home: <HomeScreen />,
    leaderboard: <LeaderboardScreen />,
    scores: <ScoresScreen />,
    notices: <NoticesScreen />,
    feedback: <FeedbackScreen />,
    admin: <AdminScreen />,
  };

  const isHome = activeTab === "home";

  return (
    <div
      className="min-h-screen w-full flex items-start justify-start bg-gradient-to-b from-emerald-50 to-white safe-y"
      style={{ WebkitFontSmoothing: "antialiased" }}
    >
      {/* outer container centers the card horizontally and gives a small top offset */}
      <div className="w-full flex justify-center -mt-6 sm:-mt-8 pt-0">
        {/* App card - constrained width, fills viewport height; internal scroll handled by .inner-scroll */}
        <div
          className="app-card max-w-md w-full rounded-2xl bg-white/95 border border-zinc-100 shadow-lg overflow-hidden flex flex-col"
          role="application"
          aria-label="Public scoreboard app"
          style={{ height: "calc(100vh - 24px)" }} // small top gap preserved
        >
          {/* CONTENT AREA */}
          {isHome ? (
            // Home: render full-screen (no internal scroll). HomeScreen must be built to fit vertically.
            <div className="flex-1 w-full p-4 flex flex-col items-center justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="w-full flex flex-col items-center justify-between"
                >
                  {screens[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            // Non-home tabs: use an inner scroll area so page body never scrolls.
            <div className="app-card-body inner-scroll no-scrollbar p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {screens[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* visual divider — bottom tabbar is outside card but fixed on screen (CSS) */}
          <div className="w-full border-t border-zinc-100 bg-transparent" aria-hidden />
        </div>
      </div>

      {/* Fixed bottom tab bar wrapper (styles live in globals.css .bottom-tabbar-wrapper & .bottom-tabbar) */}
      <div className="bottom-tabbar-wrapper" aria-hidden>
        <div className="bottom-tabbar" role="navigation" aria-label="Bottom navigation">
          {/* BottomTabBar accepts only `active` and `onNavigate` according to your type */}
          <BottomTabBar
            active={activeTab}
            onNavigate={(k: BottomKey) => setActiveTab(k)}
          />
        </div>
      </div>
    </div>
  );
}
