// components/NoticesScreen.tsx
"use client";

import React, { useMemo } from "react";
import LatestExamTicker from "@/components/LatestExamTicker";
import NoticeCarousel from "@/components/NoticeCarousel";
import { usePublicNotices } from "@/hooks/usePublicNotices";

/**
 * NoticesScreen
 * - Top: small exam ticker (LatestExamTicker -> /api/exam-ticker)
 * - Left/top stat card: Notices Live count
 * - Main: NoticeCarousel (images/videos/text) pulling from /api/notices via usePublicNotices()
 *
 * Layout is mobile-first and keeps the overall card non-scrolling — only carousel area scrolls internally.
 * Carousel height visually matches Scores table (~36vh) so it fits with your UI.
 */

export default function NoticesScreen(): React.ReactElement {
  const { notices = [], loading, error, refetch } = usePublicNotices({ realtime: true, refreshInterval: 0 });

  const liveCount = useMemo(() => (Array.isArray(notices) ? notices.length : 0), [notices]);

  return (
    <div className="w-full min-h-full flex flex-col gap-3 items-stretch">
      {/* Ticker + small actions */}
      <div className="rounded-2xl border bg-white p-3 flex items-center gap-3">
        <div className="text-xs font-semibold text-zinc-700 shrink-0">New</div>

        <div className="flex-1 overflow-hidden">
          <LatestExamTicker />
        </div>

        <div className="flex items-center gap-3 ml-2">
          <div className="text-xs text-zinc-600 text-center">
            <div className="text-[13px] font-semibold text-zinc-800">{liveCount}</div>
            <div className="text-[10px]">Notices Live</div>
          </div>
          <button
            onClick={() => refetch && refetch()}
            title="Refresh notices"
            className="h-8 rounded border px-2 text-xs hover:bg-zinc-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main area: carousel + small note */}
      <div className="rounded-2xl border bg-white p-3 flex flex-col min-h-0">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Notices</div>
          <div className="text-[11px] text-zinc-500">{loading ? "Loading…" : `${liveCount} live`}</div>
        </div>

        <div className="overflow-hidden">
          {/* Carousel uses similar visual height to Scores table (approximate) */}
          <NoticeCarousel items={notices} intervalMs={15000} barClassName="bg-emerald-600" />
        </div>

        {error && (
          <div className="mt-3 text-xs text-red-600">
            Error loading notices: {String((error as any)?.message ?? error)}
          </div>
        )}

        <div className="mt-3 text-xs text-zinc-500 text-center">
          Click an item to open it in a larger viewer. Carousel auto-advances every 15s and pauses on hover.
        </div>
      </div>
    </div>
  );
}
