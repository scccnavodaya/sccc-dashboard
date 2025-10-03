"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import ResetByUsername from "@/components/auth/ResetByUsername";

type Tab = "login" | "reset";

export default function AdminDrawer({
  open,
  onClose,
  tab = "login",
  setTab,
}: {
  open: boolean;
  onClose: () => void;
  tab?: Tab;
  setTab: (t: Tab) => void;
}) {
  // Prevent background scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Close on route change
  const pathname = usePathname();
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (typeof window === "undefined" || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Drawer panel — FROM THE LEFT */}
      <div
        className="
          absolute left-0 top-0 h-full w-full max-w-md bg-white shadow-xl
          transform transition-transform duration-300 will-change-transform
        "
        style={{ translate: "0" }}
      >
        {/* Clean header (no tabs) */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm font-medium">Admin</div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {tab === "login" ? (
            <LoginForm
              onSuccess={onClose}
              onForgot={() => setTab("reset")}   // link inside form can switch to reset
            />
          ) : (
            <ResetByUsername
              onBack={() => setTab("login")}
              onSuccess={onClose}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
