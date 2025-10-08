// components/AdminCardLayout.tsx
"use client";

import React, { ReactNode } from "react";

/**
 * Mobile-first vertical invitation card wrapper used for Admin home & pages.
 * Keeps the card centered and reserves space so the small footer credit stays visible.
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
          className={`bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 flex flex-col items-center justify-between ${className}`}
          style={{
            minHeight: "calc(100vh - 160px)",
            maxHeight: "calc(100vh - 80px)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
