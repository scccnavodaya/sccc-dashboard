// app/admin/layout.tsx
"use client";

import { useState, type ReactNode } from "react";
import AdminHeader from "@/components/AdminHeader";
import AdminFooter from "../../components/AdminFooter";

// same util you used on public page to start in IST month
function ymNowIST() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "2025";
  const m = parts.find((p) => p.type === "month")?.value ?? "09";
  return `${y}-${m}`;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Admin header needs month + onMonthChange props
  const [month, setMonth] = useState<string>(() => ymNowIST());

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900">
      {/* Fixed header (like public) */}
      <AdminHeader month={month} onMonthChange={setMonth} />

      {/* Spacer so content doesn't hide under fixed header */}
      <div className="h-[128px]" />

      <main className="flex-1 pb-8 mx-auto max-w-6xl w-full px-3 sm:px-4 py-6">
        {children}
      </main>

      <AdminFooter />
    </div>
  );
}
