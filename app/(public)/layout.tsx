// app/(public)/layout.tsx
import type { ReactNode } from "react";
import "../styles/globals.css";
import Footer from "@/components/Footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className="
          antialiased bg-white text-zinc-900
          overflow-x-hidden safe-x safe-y
        "
        // Header updates --header-h dynamically so content never sits under it.
        style={{ paddingTop: "var(--header-h, 112px)" }}
      >
        <main className="min-h-[80vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
