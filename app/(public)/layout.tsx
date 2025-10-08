// app/(public)/layout.tsx
import type { ReactNode } from "react";
import "../styles/globals.css";

export const metadata = {
  title: "Success Career Coaching Centre",
  description: "Public Dashboard - SCCC",
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      {/* 
        ✅ Fix hydration mismatch by:
        1. Adding suppressHydrationWarning
        2. Keeping className fully static and same for SSR + client
        3. Avoiding any mutation of <body> styles or className in client scripts
      */}
      <body
        className="antialiased bg-white text-zinc-900 overflow-x-hidden safe-x safe-y mobile-rescue"
        suppressHydrationWarning
        style={{ paddingTop: "var(--header-h, 80px)" }}
      >
        <main className="min-h-[80vh]">{children}</main>

        {/* Optional footer, if you want it on every public page */}
        <footer className="py-6 text-center text-[12px] text-zinc-500">
          Designed & Developed by{" "}
          <span className="font-semibold text-emerald-700">Karam Suresh</span>
        </footer>
      </body>
    </html>
  );
}
