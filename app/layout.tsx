// app/layout.tsx
// app/layout.tsx
import "./styles/globals.css";
      // <— local to the /app folder
import React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="mobile-rescue min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
