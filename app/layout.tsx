// app/layout.tsx
import React from "react";
import "./styles/globals.css"; // ✅ correct relative path

export const metadata = {
  title: "SCCC",
  description: "Success Career Coaching Centre",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        suppressHydrationWarning
        className="mobile-rescue min-h-screen bg-zinc-50 text-zinc-900 overflow-x-hidden"
      >
        {children}
      </body>
    </html>
  );
}
