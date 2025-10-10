// app/(public)/layout.tsx
import React from "react";
import ClientBodyHydrator from "@/components/ClientBodyHydrator";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body
        className="mobile-rescue min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden"
        suppressHydrationWarning
      >
        {/* Runs after hydration; ensure it doesn't remove classes added on the server */}
        <ClientBodyHydrator />
        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}
