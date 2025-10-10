"use client";

import React, { useEffect } from "react";
import { useOverlay } from "./OverlayProvider";

/**
 * Click any <img> or element with [data-fullsrc] to open inside-card overlay
 */
export default function ImageClickBinder() {
  const { openImage } = useOverlay();

  useEffect(() => {
    // Prefer the nearest card; fallback to document
    const rootEl =
      (document.querySelector<HTMLElement>(".admin-card") as HTMLElement | null) ??
      (document.querySelector<HTMLElement>(".app-card") as HTMLElement | null) ??
      document.documentElement;

    const onClick = (evt: Event) => {
      const target = evt.target as HTMLElement | null;
      if (!target) return;

      const withAttr = target.closest<HTMLElement>("[data-fullsrc]");
      if (withAttr) {
        const src = withAttr.getAttribute("data-fullsrc") || "";
        if (src) {
          evt.preventDefault?.();
          openImage(src, withAttr.getAttribute("alt") || "");
          return;
        }
      }

      const img = target.closest("img");
      if (img?.src) {
        const rect = img.getBoundingClientRect();
        // ignore tiny icons
        if (rect.width >= 32 && rect.height >= 32) {
          evt.preventDefault?.();
          openImage(img.getAttribute("data-fullsrc") || img.src, img.alt || "");
        }
      }
    };

    rootEl.addEventListener("click", onClick as EventListener, { passive: false });
    return () => rootEl.removeEventListener("click", onClick as EventListener);
  }, [openImage]);

  return null;
}
