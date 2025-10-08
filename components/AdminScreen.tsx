// components/HomeScreen.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type RuleItem = { id?: string; content?: string; title?: string; is_html?: boolean };
type GkItem = { id?: string; content?: string; is_html?: boolean };

const FALLBACK_RULES = [
  "Maintain attendance and punctuality.",
  "Respect faculty and students.",
  "Keep phones off during class.",
];

export default function HomeScreen() {
  const [rules, setRules] = useState<string[]>(FALLBACK_RULES);
  const [gkText, setGkText] = useState<string>("(Admin will add content here)");
  const [gkIsHtml, setGkIsHtml] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // public endpoint (recommended)
        const res = await fetch("/api/feed", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        if (!mounted) return;
        // json shape: { rules: [{id, content, ...}], gk: {id, content, is_html } }
        const fetchedRules = Array.isArray(json?.rules)
          ? json.rules.map((r: any) => String(r.content ?? ""))
          : [];
        const fetchedGk = json?.gk ? String(json.gk.content ?? "") : "";

        if (fetchedRules.length) setRules(fetchedRules);
        else setRules([]);
        setGkText(fetchedGk || "");
        setGkIsHtml(Boolean(json?.gk?.is_html));
      } catch (err) {
        console.warn(err);
        if (mounted) setError("Failed to load content");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="h-full flex items-start justify-center px-3 pt-3">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26 }}
          className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-3 flex flex-col items-center justify-between"
          style={{
            minHeight: "calc(100vh - 160px)",
            maxHeight: "calc(100vh - 80px)",
          }}
        >
          {/* Logo + coaching info */}
          <div className="text-center mt-1">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-emerald-400 shadow-inner mx-auto">
              <img src="/logo.jpeg" alt="Coaching Logo" className="h-full w-full object-contain" />
            </div>

            <h1 className="mt-2 text-base font-bold text-emerald-800 leading-tight">
              Success Career Coaching Centre
            </h1>

            <p className="text-[11px] text-zinc-600 leading-snug mt-0.5">
              Moirang Phiwangbam Leikai, Bishnupur District, Manipur
            </p>
          </div>

          {/* Rules */}
          <div className="w-full mt-2 text-left">
            <h2 className="text-[13px] font-semibold text-emerald-700 mb-1">
              Rules & Regulations
            </h2>

            {loading ? (
              <div className="text-[11px] text-zinc-500">Loading rules…</div>
            ) : error ? (
              <div className="text-[11px] text-red-600">Unable to load rules</div>
            ) : rules.length ? (
              <ul className="list-disc pl-4 text-[11px] text-zinc-700 space-y-0.5">
                {rules.map((r, i) => (
                  // use pre-wrap on the content so newlines are shown as line breaks
                  <li key={i} className="text-[11px]">
                    <div style={{ whiteSpace: "pre-wrap" }}>{r}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[11px] text-zinc-500">No rules published.</div>
            )}

            <p className="text-[9.5px] text-zinc-400 italic mt-1">
              (Editable by Admin)
            </p>
          </div>

          {/* GK / Trick / Quiz */}
          <div className="w-full mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2 text-left">
            <h3 className="text-[13px] font-semibold text-emerald-800 mb-1">
              🧩 GK / Trick / Quiz of the Day
            </h3>

            {loading ? (
              <p className="text-[11px] text-zinc-500 min-h-[32px] leading-snug">Loading…</p>
            ) : error ? (
              <p className="text-[11px] text-red-600 min-h-[32px] leading-snug">Unable to load.</p>
            ) : gkText ? (
              gkIsHtml ? (
                // careful: only render HTML if server sanitized it
                <div className="text-[11px] text-zinc-700 min-h-[32px] leading-snug" dangerouslySetInnerHTML={{ __html: gkText }} />
              ) : (
                // preserve newlines for plain text using pre-wrap
                <p className="text-[11px] text-zinc-700 min-h-[32px] leading-snug" style={{ whiteSpace: "pre-wrap" }}>
                  {gkText}
                </p>
              )
            ) : (
              <p className="text-[11px] text-zinc-500 min-h-[32px] leading-snug">No GK set.</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 text-center border-t border-zinc-100 pt-1.5 w-full">
            <p className="text-[10px] text-zinc-500 leading-tight">
              Designed & Developed by <span className="font-medium text-emerald-700">Karam Suresh</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
