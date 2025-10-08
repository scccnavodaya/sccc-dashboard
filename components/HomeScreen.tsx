// components/HomeScreen.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type RuleRow = { id?: string; section?: string; content?: string; text?: string; deleted?: boolean };
type PublicShape = {
  rules?: { id?: string; content?: string; text?: string }[];
  gk?: { id?: string; content?: string; text?: string; is_html?: boolean } | null;
  [k: string]: any;
};

const FALLBACK_RULES = [
  "Maintain attendance and punctuality.",
  "Respect faculty and students.",
  "Keep phones off during class.",
];

export default function HomeScreen() {
  const [rules, setRules] = useState<string[]>(FALLBACK_RULES);
  const [gkText, setGkText] = useState<string>("(Admin will add content here)");
  const [gkIsHtml, setGkIsHtml] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const parseAndSet = (json: any) => {
      // Shape A: { rules: [{content|text}], gk: {content|text, is_html} }
      if (json && typeof json === "object" && (Array.isArray(json.rules) || json.gk !== undefined)) {
        const r = Array.isArray(json.rules)
          ? json.rules.map((x: any) => String((x?.content ?? x?.text ?? "").toString()))
          : [];
        if (mounted) setRules(r.length ? r : []);
        if (json.gk) {
          const t = String((json.gk.content ?? json.gk.text ?? "").toString());
          if (mounted) {
            setGkText(t || "");
            setGkIsHtml(Boolean(json.gk.is_html));
          }
        } else {
          if (mounted) {
            setGkText("");
            setGkIsHtml(false);
          }
        }
        return true;
      }

      // Shape B: array of DB rows [{ section, content, text, deleted }]
      if (Array.isArray(json)) {
        const fetchedRules: string[] = [];
        let fetchedGk = "";
        let fetchedGkIsHtml = false;
        for (const r of json) {
          if (!r) continue;
          if (r.deleted) continue;
          const section = String(r.section ?? "").toLowerCase();
          const content = (r.content ?? r.text ?? "") as string;
          if (section === "rules") {
            fetchedRules.push(String(content));
          } else if (section === "gk") {
            fetchedGk = String(content);
            fetchedGkIsHtml = Boolean(r.is_html);
          }
        }
        if (mounted) {
          setRules(fetchedRules.length ? fetchedRules : []);
          setGkText(fetchedGk || "");
          setGkIsHtml(fetchedGkIsHtml);
        }
        return true;
      }

      return false;
    };

    const fetchPublic = async () => {
      setLoading(true);
      setError(null);

      const endpoints = ["/api/feed", "/api/admin/feed"];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { cache: "no-store" });
          if (!res.ok) {
            // try next
            continue;
          }
          const json = await res.json().catch(() => null);
          const handled = parseAndSet(json);
          if (handled) return;
        } catch (e) {
          // try next
          continue;
        }
      }

      if (mounted) setError("Failed to load content");
    };

    fetchPublic().finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
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
                  <li key={i} className="whitespace-pre-line">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-[11px] text-zinc-500">No rules published.</div>
            )}
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
                // ⚠️ Only render HTML if you sanitize it on the server!
                <div
                  className="text-[11px] text-zinc-700 min-h-[32px] leading-snug"
                  dangerouslySetInnerHTML={{ __html: gkText }}
                />
              ) : (
                <p className="text-[11px] text-zinc-700 min-h-[32px] leading-snug whitespace-pre-line">
                  {gkText}
                </p>
              )
            ) : (
              <p className="text-[11px] text-zinc-500 min-h-[32px] leading-snug">No GK set.</p>
            )}
          </div>

          {/* Footer (kept small and visible) */}
          <div className="mt-2 text-center border-t border-zinc-100 pt-1.5 w-full">
            <p className="text-[10px] text-zinc-500 leading-tight">
              Designed & Developed by{" "}
              <span className="font-medium text-emerald-700">Karam Suresh</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
