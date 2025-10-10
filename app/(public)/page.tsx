// app/(public)/page.tsx
"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import InlineDrawer, { DrawerKey } from "@/components/InlineDrawer";
import HomeScreen from "@/components/HomeScreen";
import LeaderboardScreen from "@/components/LeaderboardScreen";
import ScoresScreen from "@/components/ScoresScreen";
import NoticesScreen from "@/components/NoticesScreen";
import FeedbackScreen from "@/components/FeedbackScreen";
import AdminScreen from "@/components/AdminScreen";

import PublicCardLayout from "@/components/PublicCardLayout";
import OverlayProvider from "@/components/OverlayProvider";

export default function Page() {
  const [activeTab, setActiveTab] = useState<DrawerKey>("home");

  const screens: Record<DrawerKey, React.ReactNode> = {
    home: <HomeScreen />,
    leaderboard: <LeaderboardScreen />,
    scores: <ScoresScreen />,
    notices: <NoticesScreen />,
    feedback: <FeedbackScreen />,
    admin: <AdminScreen />,
  };

  return (
    <div className="min-h-screen w-full flex items-start justify-start bg-white safe-y" style={{ WebkitFontSmoothing: "antialiased" }}>
      {/* scale=0.5 => 50% of original; adjust to taste (e.g. 0.55, 0.45) */}
      <PublicCardLayout scale={0.5}>
        <OverlayProvider>
          {/* Hamburger INSIDE the card */}
          <div style={{ position: "absolute", left: 12, bottom: 12, zIndex: 30 }}>
            <InlineDrawer active={activeTab} onChange={(k) => setActiveTab(k)} />
          </div>

          {/* Screen switcher */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {screens[activeTab]}
            </motion.div>
          </AnimatePresence>
        </OverlayProvider>
      </PublicCardLayout>
    </div>
  );
}
