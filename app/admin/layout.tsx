// app/admin/layout.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import AdminHeader from "@/components/AdminHeader";
import AdminFooter from "@/components/AdminFooter";

// Use the same desktop baseline width you designed for.
const DESIGN_WIDTH = 1200;

// Start month in IST (same helper you used before)
function ymNowIST() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "2025";
  const m = parts.find((p) => p.type === "month")?.value ?? "09";
  return `${y}-${m}`;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState<string>(() => ymNowIST());

  // Canvas scaling (same as public)
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [canvasH, setCanvasH] = useState<number | null>(null);

  useEffect(() => {
    function recalc() {
      const vw = window.innerWidth;
      const s = Math.min(1, vw / DESIGN_WIDTH);
      setScale(s);
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver(() => {
      const h = canvasRef.current?.offsetHeight ?? 0;
      setCanvasH(h);
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  const wrapStyle = useMemo<React.CSSProperties>(() => {
    const h = canvasH ? Math.ceil(canvasH * scale) : undefined;
    return {
      minHeight: "100svh",
      overflowX: "hidden",
      display: "flex",
      justifyContent: "center",
      background: "#f8fafc", // zinc-50-ish
      paddingTop: "env(safe-area-inset-top)",
      paddingBottom: "env(safe-area-inset-bottom)",
      height: h,
    };
  }, [canvasH, scale]);

  const canvasStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: DESIGN_WIDTH,
      transform: `scale(${scale})`,
      transformOrigin: "top center",
      willChange: "transform",
    };
  }, [scale]);

  return (
    <div className="admin-viewport" ref={wrapRef} style={wrapStyle}>
      <div className="admin-canvas flex min-h-screen flex-col" ref={canvasRef} style={canvasStyle}>
        {/* Fixed header in your design — keep spacer to prevent overlap */}
        <AdminHeader month={month} onMonthChange={setMonth} />
        <div className="h-14 sm:h-16 lg:h-20" />

        {/* Main content area: keep your preferred max width */}
        <main className="flex-1 mx-auto w-full max-w-screen-xl min-w-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </main>

        <div className="border-t">
          <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4">
            <AdminFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
