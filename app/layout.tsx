// app/layout.tsx
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "@/app/styles/globals.css";

export const metadata: Metadata = {
  title: "Success Career Coaching Centre",
  description: "SCCC Dashboard (Admin + Parent)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="mobile-rescue min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden"
      >
        {children}
      </body>
    </html>
  );
}
