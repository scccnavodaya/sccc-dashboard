// app/layout.tsx
import type { ReactNode } from "react";
import "@/app/styles/globals.css";

export const metadata = {
  title: "Success Career Coaching Center",
  description: "SCCC Dashboard (Admin + Parent)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* 👇 add suppressHydrationWarning to body as well */}
      <body suppressHydrationWarning className="min-h-screen bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
