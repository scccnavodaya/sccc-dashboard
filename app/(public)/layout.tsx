// app/(public)/layout.tsx
import React from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // no <html> or <body> here — only in the root layout
  return <div className="min-h-screen text-zinc-900">{children}</div>;
}
