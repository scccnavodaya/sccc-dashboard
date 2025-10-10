// components/OverlayProvider.tsx
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type OverlayContent = { type: "image"; src: string; alt?: string } | null;
type Mode = "inCard" | "viewport";
type Ctx = { openImage: (src: string, alt?: string) => void; close: () => void };

const OverlayCtx = createContext<Ctx | null>(null);

export default function OverlayProvider({
  children,
  mode = "inCard",
}: {
  children: React.ReactNode;
  mode?: Mode;
}) {
  const [content, setContent] = useState<OverlayContent>(null);

  const value = useMemo<Ctx>(
    () => ({ openImage: (src, alt) => setContent({ type: "image", src, alt }), close: () => setContent(null) }),
    []
  );

  const containerClass =
    mode === "inCard"
      ? "overlay-in-card"
      : "fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2";

  return (
    <OverlayCtx.Provider value={value}>
      {children}
      <AnimatePresence>
        {content && (
          <motion.div
            key="ovl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={containerClass}
            onClick={() => setContent(null)}
          >
            {content.type === "image" && (
              <motion.img
                key={content.src}
                src={content.src}
                alt={content.alt ?? ""}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="overlay-media"
                style={{ objectFit: "contain", borderRadius: 10, background: "#fff", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />
            )}
            <button
              aria-label="Close"
              onClick={() => setContent(null)}
              className="absolute top-2 right-2 rounded-full bg-white/90 hover:bg-white border px-2 py-1 text-[11px]"
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </OverlayCtx.Provider>
  );
}

export function useOverlay() {
  const ctx = useContext(OverlayCtx);
  if (!ctx) throw new Error("useOverlay must be used inside <OverlayProvider>");
  return ctx;
}
