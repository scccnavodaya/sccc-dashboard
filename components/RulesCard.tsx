// components/RulesCard.tsx
"use client";

import { useEffect, useState } from "react";

/**
 * RulesCard
 * - Fetches rules from /api/rules (optional). If that route isn't present yet,
 *   you can supply `initial` prop to show content.
 */
export default function RulesCard({ initial }: { initial?: string }) {
  const [text, setText] = useState<string | null>(initial ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const r = await fetch("/api/rules", { cache: "no-store" });
        if (!r.ok) return;
        const data = await r.json();
        if (alive && data?.rules) setText(String(data.rules));
      } catch (err) {
        // ignore
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Rules &amp; Regulations</h3>
        <span className="text-xs text-zinc-500">Editable by admin</span>
      </div>

      <div className="mt-2 text-sm text-zinc-700 leading-relaxed max-h-40 overflow-y-auto pr-1">
        {loading ? <div className="text-zinc-400">Loading...</div> : null}
        {!loading && !text ? (
          <div className="text-zinc-500">No rules set yet. Admin can add rules from the dashboard.</div>
        ) : null}
        {!loading && text ? <div>{text}</div> : null}
      </div>
    </div>
  );
}
