"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

/**
 * FitToViewport
 * - Supports fixedScale to force a constant scale (e.g., 0.6).
 * - Observes content size and window changes without flicker.
 * - Measures natural size using scrollHeight/Width (not transformed).
 * - Added `adminMode` for special mobile scaling in admin layout.
 */
export default function FitToViewport({
  children,
  headerH = "0px",
  bottomBarH = "0px",
  topOffsetPx = 0,
  minScale = 0.65,
  fixedScale,
  adminMode = false,          // 👈 added
}: {
  children: React.ReactNode;
  headerH?: string;
  bottomBarH?: string;
  topOffsetPx?: number;
  minScale?: number;
  fixedScale?: number;
  adminMode?: boolean;        // 👈 added
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(fixedScale ?? 1);

  function pxFromCssValue(val: string) {
    try {
      if (typeof window === "undefined") return 0;
      const temp = document.createElement("div");
      Object.assign(temp.style, { position: "absolute", visibility: "hidden", height: val });
      document.body.appendChild(temp);
      const pixels = temp.getBoundingClientRect().height;
      document.body.removeChild(temp);
      return pixels;
    } catch {
      return 0;
    }
  }

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const ro = new ResizeObserver(() => recompute());
    if (contentRef.current) ro.observe(contentRef.current);

    function recompute() {
      if (!wrapperRef.current || !contentRef.current) return;
      const wrapperEl = wrapperRef.current;
      const contentEl = contentRef.current;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const headerPx = pxFromCssValue(headerH);
      const bottomPx = pxFromCssValue(bottomBarH);
      const availableH = Math.max(60, vh - headerPx - bottomPx - topOffsetPx);

      // ✅ Admin special mobile scaling
      if (adminMode && vw <= 480) {
        // Scale slightly down, e.g., 0.9, to avoid overflow
        const mobileScale = 0.9;
        setScale(mobileScale);
        wrapperEl.style.height = `${availableH + topOffsetPx}px`;
        return;
      }

      // ✅ Fixed scale (unchanged)
      if (typeof fixedScale === "number") {
        setScale(Math.max(minScale, Math.min(1, fixedScale)));
        wrapperEl.style.height = `${availableH + topOffsetPx}px`;
        return;
      }

      // ✅ Auto scale (public mode, unchanged)
      const naturalHeight = contentEl.scrollHeight || contentEl.offsetHeight || 0;
      let newScale = 1;
      if (naturalHeight > availableH) {
        newScale = Number((availableH / naturalHeight).toFixed(3));
        if (newScale < minScale) newScale = minScale;
      }
      setScale(newScale);
      wrapperEl.style.height = `${availableH + topOffsetPx}px`;
    }

    recompute();
    window.addEventListener("resize", recompute);
    window.addEventListener("orientationchange", recompute);
    return () => {
      window.removeEventListener("resize", recompute);
      window.removeEventListener("orientationchange", recompute);
      ro.disconnect();
    };
  }, [headerH, bottomBarH, topOffsetPx, minScale, fixedScale, adminMode]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: `${topOffsetPx}px`,
      }}
    >
      <div
        ref={contentRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top center",
          width: "100%",
          display: "block",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
