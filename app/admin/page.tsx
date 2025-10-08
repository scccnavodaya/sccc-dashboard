// app/admin/page.tsx
"use client";

import React, { useState } from "react";
import AdminDrawer from "@/components/AdminDrawer";
import AdminCardLayout from "@/components/AdminCardLayout";
import { useRouter } from "next/navigation";

/**
 * Admin home card that uses the in-card AdminDrawer with wrapped hamburger.
 */
export default function AdminHomeCard() {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  async function doLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    } finally {
      router.push("/");
    }
  }

  return (
    <AdminCardLayout>
      {/* in-card drawer: hamburger is the wrapped control */}
      <AdminDrawer expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

      {/* top row: keep an explicit logout on right (hamburger is inside drawer component) */}
      <div className="w-full flex items-start justify-end">
        <button
          onClick={doLogout}
          aria-label="Logout"
          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          title="Logout"
        >
          Logout
        </button>
      </div>

      {/* center content */}
      <div className="w-full text-center mt-2">
        <div className="mx-auto h-20 w-20 rounded-full overflow-hidden border-2 border-emerald-400 shadow-inner">
          <img src="/logo.jpeg" alt="Coaching Logo" className="h-full w-full object-contain" draggable={false} />
        </div>

        <h1 className="mt-3 text-base font-bold text-emerald-800 leading-tight text-center">
          Success Career Coaching Centre
        </h1>

        <p className="text-[11px] text-zinc-600 leading-snug mt-1 text-center">
          Moirang Phiwangbam Leikai, Bishnupur District, Manipur
        </p>
      </div>

      {/* footer credit */}
      <div className="mt-3 text-center border-t border-zinc-100 pt-2 w-full">
        <p className="text-[10px] text-zinc-500 leading-tight">
          Designed &amp; Developed by <span className="font-medium text-emerald-700">Karam Suresh</span>
        </p>
      </div>
    </AdminCardLayout>
  );
}
