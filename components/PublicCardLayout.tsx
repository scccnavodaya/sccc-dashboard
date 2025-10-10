// components/PublicCardLayout.tsx
"use client";

import React, { ReactNode } from "react";

/**
 * PublicCardLayout
 * - Centers a rounded card on the page (mobile-first).
 * - Scales the ENTIRE card (including internals) via `scale` prop.
 * - Also applies a tiny typography/spacing compaction so text remains crisp at small scales.
 */
export default function PublicCardLayout({
  children,
  className = "",
  scale = 0.5, // 50% of original
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
}) {
  // A tiny type/spacing compaction to keep readability at small scale
  const compactStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    lineHeight: 1.25,
    letterSpacing: "-0.005em",
  };

  return (
    <div className="h-full flex items-start justify-center px-3 pt-3 mobile-rescue">
      <div className="w-full" style={{ maxWidth: 420 * scale }}>
        <div
          className={`relative bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col ${className}`}
          style={{
            // visually scale the entire card content
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            // reserve enough physical space so scaled content isn't clipped
            width: `${100 / scale}%`,
            minHeight: "calc(100vh - 160px)",
            maxHeight: "calc(100vh - 80px)",
          }}
        >
          {/* reserve room at bottom so footer + hamburger don’t overlap content */}
          <div className="app-card-body inner-scroll no-scrollbar p-4 pb-20" style={compactStyle}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
