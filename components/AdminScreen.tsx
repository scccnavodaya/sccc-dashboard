// components/AdminScreen.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import ResetByUsername from "@/components/auth/ResetByUsername";

/**
 * AdminScreen — inline (non-modal) version
 * - Renders as a centered card INSIDE the public card, no overlay, no body scroll lock.
 * - This avoids covering the hamburger and prevents “stuck” behavior.
 */
export default function AdminScreen(): React.ReactElement {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [checking, setChecking] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Check session — if already authenticated redirect to /admin
  useEffect(() => {
    let mounted = true;
    (async function check() {
      try {
        const res = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (data?.authenticated) {
          router.replace("/admin");
          return;
        }
      } catch {
        /* ignore network errors */
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  function onLoginSuccess() {
    router.replace("/admin");
  }

  function onResetSuccess() {
    setMsg("Password updated. Please sign in with your new password.");
    setMode("login");
    setTimeout(() => setMsg(null), 5000);
  }

  return (
    <div className="w-full flex justify-center">
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="
          w-full max-w-[420px]
          rounded-2xl bg-white border border-zinc-200 shadow-md
          p-4 sm:p-5
        "
      >
        <div className="text-center mb-3">
          <h1 className="text-lg font-semibold text-emerald-700">Admin Portal</h1>
          <p className="text-xs text-zinc-500 mt-1">Sign in to manage the dashboard</p>
        </div>

        {checking ? (
          <div className="py-8 text-center text-sm text-zinc-500">Checking session…</div>
        ) : (
          <>
            {error && (
              <div className="rounded-md mb-3 px-3 py-2 text-xs text-center border border-red-200 bg-red-50 text-red-700">
                {error}
              </div>
            )}
            {msg && (
              <div className="rounded-md mb-3 px-3 py-2 text-xs text-center border border-emerald-200 bg-emerald-50 text-emerald-800">
                {msg}
              </div>
            )}
            {mode === "login" ? (
              <LoginForm onSuccess={onLoginSuccess} onForgot={() => setMode("reset")} />
            ) : (
              <ResetByUsername onBack={() => setMode("login")} onSuccess={onResetSuccess} />
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
