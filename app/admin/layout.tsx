// components/AdminCardLayout.tsx
"use client";

import React, { ReactNode } from "react";

/**
 * Mobile-first vertical invitation card wrapper used for Admin home & pages.
 * - Position: relative so inner drawers/rails can be absolutely positioned inside the card.
 * - Inner scroll area ensures content never gets clipped on small screens.
 */
export default function AdminCardLayout({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="h-full flex items-start justify-center px-3 pt-3 mobile-rescue">
      <div className="w-full max-w-md">
        <div
          className={`relative bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden ${className}`}
          style={{
            minHeight: "calc(100vh - 160px)",
            maxHeight: "calc(100vh - 72px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Inner scroll area */}
          <div
            className="p-4 flex-1 overflow-y-auto -webkit-overflow-scrolling-touch"
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
