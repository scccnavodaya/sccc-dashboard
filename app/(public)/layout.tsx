// app/(public)/layout.tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Footer from "@/components/Footer";

const DESIGN_WIDTH = 1200; // 👈 Desktop design width (px). Adjust to your layout baseline.

export default function PublicLayout({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [canvasH, setCanvasH] = useState<number | null>(null);

  // Recompute scale on window resize
  useEffect(() => {
    function recalc() {
      const vw = window.innerWidth;
      const newScale = Math.min(1, vw / DESIGN_WIDTH);
      setScale(newScale);
    }
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  // Watch canvas height and update wrapper height accordingly
  useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver(() => {
      const h = canvasRef.current?.offsetHeight ?? 0;
      setCanvasH(h);
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  // Wrapper styles (outer container)
  const wrapStyle = useMemo<React.CSSProperties>(() => {
    const h = canvasH ? Math.ceil(canvasH * scale) : undefined;
    return {
      minHeight: "100vh",
      overflowX: "hidden",
      display: "flex",
      justifyContent: "center",
      background: "#ffffff",
      height: h, // ensures correct scroll height on mobile
    };
  }, [canvasH, scale]);

  // Canvas styles (scaled desktop content)
  const canvasStyle = useMemo<React.CSSProperties>(() => {
    return {
      width: DESIGN_WIDTH,
      transform: `scale(${scale})`,
      transformOrigin: "top center",
      willChange: "transform",
    };
  }, [scale]);

  return (
    <div className="app-viewport" ref={wrapRef} style={wrapStyle}>
      {/* Canvas: holds desktop layout, scaled down on smaller screens */}
      <div className="app-canvas" ref={canvasRef} style={canvasStyle}>
        <main className="flex-1 pb-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
