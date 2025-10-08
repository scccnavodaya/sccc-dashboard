// components/AdminBottomBar.tsx
"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Newspaper,
  MessageSquare,
  Settings,
  Plus,
  LogOut,
  Rss,
} from "lucide-react";

/**
 * Mobile Admin Bottom Bar
 * - Tabs: Dashboard, Students, Tests, Notices, Feed, Ticker, Feedback, Settings
 * - Center FAB (Create) -> navigates to notices publish (adjust as needed)
 * - Logout button on the right
 *
 * Styling expectations: your globals.css contains styles for .admin-bottombar, .admin-bottom-inner, .admin-tabs, .tab, .fab etc.
 */

export default function AdminBottomBar() {
  const router = useRouter();
  const pathname = usePathname() ?? "/admin";

  const tabs = [
    { key: "dash", label: "Dashboard", href: "/admin", Icon: LayoutDashboard },
    { key: "students", label: "Students", href: "/admin/students", Icon: Users },
    { key: "tests", label: "Tests", href: "/admin/tests", Icon: ClipboardList },
    { key: "notices", label: "Notices", href: "/admin/notices", Icon: FileText },
    { key: "feed", label: "Feed", href: "/admin/feed", Icon: Rss },
    { key: "ticker", label: "Ticker", href: "/admin/exam-notices", Icon: Newspaper },
    { key: "feedback", label: "Feedback", href: "/admin/feedback", Icon: MessageSquare },
    { key: "settings", label: "Settings", href: "/admin/settings", Icon: Settings },
  ];

  function nav(href: string) {
    router.push(href);
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      /* ignore network errors — still navigate away */
    } finally {
      router.push("/");
    }
  }

  return (
    // wrapper — place this outside any scaled canvas so it appears at device pixel size
    <div
      className="admin-bottombar bottom-tabbar-wrapper"
      aria-label="Admin navigation"
      role="navigation"
      style={{ pointerEvents: "auto" }}
    >
      <div className="admin-bottom-inner bottom-tabbar" style={{ alignItems: "center" }}>
        {/* tabs: horizontally scrollable on narrow screens */}
        <div
          className="admin-tabs"
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
          role="menubar"
        >
          {tabs.map((t) => {
            const active = t.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(t.href);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => nav(t.href)}
                className={`tab ${active ? "active-icon" : ""}`}
                aria-current={active ? "page" : undefined}
                aria-label={t.label}
                title={t.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: "transparent",
                }}
              >
                <span className={active ? "active-icon" : "inactive-icon"}>
                  <t.Icon size={16} />
                </span>
                <span style={{ fontSize: 11, lineHeight: "11px", marginTop: 2 }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAB — center */}
        <div
          className="fab-wrap"
          style={{
            position: "relative",
            margin: "0 6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden
        >
          <button
            type="button"
            className="fab"
            onClick={() => {
              // Main action: open notices publish; adjust to your desired create route
              router.push("/admin/notices?focus=publish");
            }}
            title="Create"
            aria-label="Create new notice"
            style={{
              width: 46,
              height: 46,
              borderRadius: 9999,
              display: "grid",
              placeItems: "center",
              boxShadow: "0 8px 24px rgba(16,185,129,0.08)",
              border: "none",
              background: "linear-gradient(180deg,#10b981,#059669)",
              color: "white",
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Logout (separate from tab list) */}
        <div style={{ marginLeft: 4 }}>
          <button
            type="button"
            onClick={logout}
            className="tab"
            aria-label="Logout"
            title="Logout"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 8px",
              borderRadius: 8,
              background: "transparent",
            }}
          >
            <span className="inactive-icon">
              <LogOut size={16} />
            </span>
            <span style={{ fontSize: 11, lineHeight: "11px", marginTop: 2 }}>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
