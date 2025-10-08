"use client";

import PublicFeedbackForm from "@/components/PublicFeedbackForm";
import { MessageSquareHeart } from "lucide-react";

/**
 * FeedbackScreen — footer moved higher by making the card shorter.
 * If you want it even higher, increase BOTTOM_RESERVE (px).
 */
export default function FeedbackScreen() {
  // How much vertical space to keep for bottom nav + safe area (increase to move footer up)
  const BOTTOM_RESERVE = 160; // px — raise this value to move footer higher

  return (
    <div className="h-full flex items-center justify-center px-3 py-2">
      <div className="w-full max-w-md">
        <div
          className="bg-white rounded-2xl border border-zinc-200 shadow-sm flex flex-col overflow-hidden"
          // card height reduced so footer sits higher
          style={{ height: `calc(100vh - ${BOTTOM_RESERVE}px)` }}
        >
          {/* header */}
          <div className="flex items-center justify-center gap-2 px-3 py-2 border-b border-zinc-100 bg-zinc-50">
            <MessageSquareHeart className="text-emerald-600" size={16} />
            <h2 className="text-sm font-semibold text-zinc-800">Parent Feedback</h2>
          </div>

          {/* scrollable content area (only this scrolls) */}
          <div className="flex-1 overflow-auto p-3">
            {/* Center the form, allow it to shrink */}
            <div className="mx-auto" style={{ maxWidth: 520 }}>
              <PublicFeedbackForm compact />
              <div className="h-1" />
            </div>
          </div>

          {/* footer (always visible) */}
          <div className="border-t border-zinc-100 bg-zinc-50 text-center text-[12px] text-zinc-500 py-2">
            Designed &amp; Developed by{" "}
            <span className="text-emerald-700 font-semibold">Karam Suresh</span>
          </div>
        </div>
      </div>
    </div>
  );
}
