"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AdminScreen(): React.ReactElement {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async function check() {
      try {
        const res = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!data?.authenticated) {
          router.replace("/admin/login");
          return;
        }
      } catch {
        /* ignore */
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-emerald-50 to-white text-sm text-zinc-600">
        Checking session…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200 shadow-md p-5 text-center"
      >
        {/* Logo and Info */}
        <div className="text-center">
          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-emerald-400 shadow-inner mx-auto">
            <img
              src="/logo.jpeg"
              alt="Coaching Logo"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="mt-3 text-base font-bold text-emerald-800 leading-tight">
            Success Career Coaching Centre
          </h1>
          <p className="text-[11px] text-zinc-600 leading-snug mt-1">
            Moirang Phiwangbam Leikai, Bishnupur District, Manipur
          </p>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-zinc-100" />

        {/* Dashboard Welcome */}
        <div className="text-sm text-zinc-700">
          Welcome to the{" "}
          <span className="font-semibold text-emerald-700">Admin Dashboard</span>.
          <br />
          Use the side menu to manage feeds, scores, notices, and more.
        </div>

        {/* Logout Button */}
        <div className="mt-5">
          <button
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              router.replace("/admin/login");
            }}
            className="rounded bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-8 text-[12px] text-zinc-500 text-center">
        Designed & Developed by{" "}
        <span className="font-semibold text-emerald-700">Karam Suresh</span>
      </footer>
    </div>
  );
}
