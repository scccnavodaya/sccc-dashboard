// components/ClientBodyHydrator.tsx
"use client";

import { useEffect } from "react";

export default function ClientBodyHydrator() {
  useEffect(() => {
    // Safe client-only work (no class mutations to avoid hydration mismatches)

    // Example: set a CSS var for the real viewport height on mobile.
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", setVh);

    return () => {
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
    };
  }, []);

  return null;
}
