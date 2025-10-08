// app/admin/feed/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trash2,
  Plus,
  Edit,
  Save,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/**
 * Admin Feed Editor — final version with reliable "Show X more" dropdown.
 *
 * Important:
 * - Dropdown is UI-only for admin. Public home remains unchanged.
 * - If you still don't see the button, check the small "Rules: N" debug count below Manage.
 */

type FetchJSONOptions = RequestInit | undefined;
async function fetchJSON(url: string, init?: FetchJSONOptions) {
  const res = await fetch(url, init);
  const text = await res.text().catch(() => "");
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }
  if (!res.ok) throw new Error(data?.error || "Request failed");
  return data;
}

function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  title: string;
  message?: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[140] bg-black/30 p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          if (!busy) onCancel();
        }}
      >
        <motion.div
          className="mx-auto mt-20 w-full max-w-[420px] rounded-xl bg-white p-3 shadow"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-semibold">{title}</div>
          {message && <p className="mt-1 text-xs text-zinc-600">{message}</p>}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="h-8 rounded border px-2 py-0.5 text-xs hover:bg-zinc-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="h-8 rounded bg-red-600 px-3 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? "Please wait…" : "Delete"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

type RuleItem = { id: string; text: string; created_at?: string | null };
type GkItem = { id?: string; text: string; is_html?: boolean };

export default function AdminFeedPage() {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [gk, setGk] = useState<GkItem>({ id: undefined, text: "" });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [activeTab, setActiveTab] = useState<"edit" | "recent">("edit");

  const [newRule, setNewRule] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const [gkSaving, setGkSaving] = useState(false);

  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // dropdown toggle state
  const [showOlder, setShowOlder] = useState(false);

  // load feed rows and normalize to rules/gk
  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const rows: any[] = await fetchJSON("/api/admin/feed");
      const fetchedRules: RuleItem[] = [];
      let fetchedGk: GkItem = { id: undefined, text: "" };

      for (const r of Array.isArray(rows) ? rows : []) {
        if (!r || r.deleted) continue;
        const section = String(r.section ?? "").toLowerCase();
        const content = r.content ?? r.text ?? "";
        if (section === "rules") {
          fetchedRules.push({
            id: String(r.id),
            text: String(content),
            created_at: r.created_at ?? r.updated_at ?? null,
          });
        } else if (section === "gk") {
          fetchedGk = {
            id: r.id ? String(r.id) : undefined,
            text: String(content),
            is_html: Boolean(r.is_html),
          };
        }
      }

      // sort by created_at descending (newest first). Fallback to original order if missing.
      fetchedRules.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });

      setRules(fetchedRules);
      setGk(fetchedGk);
      setShowOlder(false);
    } catch (e: any) {
      setErr(e?.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 2800);
    return () => clearTimeout(t);
  }, [banner]);

  async function addRule(e?: React.FormEvent) {
    e?.preventDefault?.();
    const t = newRule.trim();
    if (!t) {
      setBanner({ type: "error", msg: "Enter a rule." });
      return;
    }
    setAdding(true);
    try {
      await fetchJSON("/api/admin/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "rules", content: t }),
      });
      await load();
      setNewRule("");
      setBanner({ type: "success", msg: "Rule added." });
      setActiveTab("recent");
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Failed to add rule." });
    } finally {
      setAdding(false);
    }
  }

  function beginEditRule(id: string) {
    setEditingId(id);
    const r = rules.find((x) => x.id === id);
    setEditingText(r?.text ?? "");
  }
  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  async function saveEditRule() {
    if (!editingId) return;
    const t = editingText.trim();
    if (!t) {
      setBanner({ type: "error", msg: "Rule cannot be empty." });
      return;
    }
    const id = editingId;
    const prev = [...rules];
    setRules((r) => r.map((x) => (x.id === id ? { ...x, text: t } : x)));
    setEditingId(null);
    setEditingText("");
    try {
      await fetchJSON(`/api/admin/feed/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: t }),
      });
      setBanner({ type: "success", msg: "Rule updated." });
      await load();
      setActiveTab("recent");
    } catch (e: any) {
      setRules(prev);
      setBanner({ type: "error", msg: e?.message || "Failed to update rule." });
    }
  }

  async function confirmDelete() {
    if (!toDeleteId) return;
    setDeleting(true);
    const id = toDeleteId;
    const prev = [...rules];
    setRules((r) => r.filter((x) => x.id !== id));
    try {
      await fetchJSON(`/api/admin/feed/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setBanner({ type: "success", msg: "Rule deleted." });
      await load();
      setActiveTab("recent");
    } catch (e: any) {
      setRules(prev);
      setBanner({ type: "error", msg: e?.message || "Failed to delete rule." });
    } finally {
      setDeleting(false);
      setToDeleteId(null);
    }
  }

  async function saveGk() {
    const t = (gk.text || "").trim();
    setGkSaving(true);
    try {
      if (gk.id) {
        await fetchJSON(`/api/admin/feed/${encodeURIComponent(gk.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: t, is_html: Boolean(gk.is_html) }),
        });
      } else {
        await fetchJSON("/api/admin/feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: "gk", content: t, is_html: Boolean(gk.is_html) }),
        });
      }
      setBanner({ type: "success", msg: "GK updated." });
      await load();
      setActiveTab("recent");
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Failed to update GK." });
    } finally {
      setGkSaving(false);
    }
  }

  const rulesList = useMemo(() => rules.map((r) => r.text), [rules]);

  // visible vs older
  const visibleRules = rules.slice(0, 2); // newest two
  const olderRules = rules.slice(2);

  function renderRuleCard(r: RuleItem, globalIdx: number) {
    return (
      <div key={r.id} className="rounded-md border px-2 py-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {editingId === r.id ? (
              <div className="flex gap-2">
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  rows={2}
                  className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-emerald-300 resize-y"
                />
                <button
                  onClick={saveEditRule}
                  className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  <Save size={14} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-zinc-50"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="text-sm text-zinc-800" style={{ whiteSpace: "pre-wrap" }}>
                  {r.text}
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-500">#{globalIdx + 1}</div>
              </>
            )}
          </div>

          {editingId !== r.id && (
            <div className="flex-shrink-0 flex items-center gap-1">
              <button
                onClick={() => beginEditRule(r.id)}
                className="rounded border px-2 py-1 text-xs hover:bg-zinc-50"
                title="Edit"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => setToDeleteId(r.id)}
                className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="safe-x safe-y mx-auto w-full max-w-2xl px-3 py-4">
      {/* compact header row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded border px-2 py-1 text-xs hover:bg-zinc-50"
            aria-label="Back to Dashboard"
          >
            ← Back
          </Link>
          <h2 className="text-sm font-semibold">Home Feed</h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              load();
              setActiveTab("recent");
            }}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-zinc-50"
            title="Go to Recent & refresh"
          >
            <RefreshCw size={14} />
            <span className="sr-only">Recent</span>
          </button>
          <button
            onClick={() => {
              load();
              setActiveTab("edit");
            }}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-zinc-50 ${activeTab === "edit" ? "bg-emerald-50" : ""}`}
            title="Go to Edit"
          >
            <Edit size={14} />
            <span className="sr-only">Edit</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.msg}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`mb-3 rounded-md px-2 py-2 text-xs ${banner.type === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-red-200 bg-red-50 text-red-700"}`}
            aria-live="polite"
          >
            {banner.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {err && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-2 py-2 text-xs text-red-700">
          {err}
        </div>
      )}

      {/* compact card */}
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        {/* EDIT VIEW */}
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "edit" && (
            <motion.div key="edit" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }} className="space-y-3">
              {/* GK */}
              <div className="rounded-md border p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">🧩 GK / Quiz of the Day</div>
                    <div className="mt-0.5 text-xs text-zinc-500">Shown on public home</div>
                  </div>
                  <div className="text-[11px] text-zinc-500">Editable</div>
                </div>

                <textarea value={gk.text} onChange={(e) => setGk((prev) => ({ ...prev, text: e.target.value }))} rows={3} placeholder="Enter GK / Quiz / Trick of the day..." className="mt-2 w-full rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-emerald-300" />

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={() => { load(); setBanner({ type: "success", msg: "Reverted." }); }} className="rounded border px-2 py-1 text-xs hover:bg-zinc-50">Revert</button>
                  <button onClick={saveGk} disabled={gkSaving} className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                    <Save size={14} /> {gkSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              {/* Rules */}
              <div className="rounded-md border p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Rules & Regulations</div>
                    <div className="mt-0.5 text-xs text-zinc-500">Small list on public home</div>
                  </div>

                  {/* DEBUG: shows number of rules fetched */}
                  <div className="text-xs text-zinc-500">
                    <div className="text-right">Manage</div>
                    <div className="text-right mt-1">Rules: <span className="font-medium text-emerald-700">{rules.length}</span></div>
                  </div>
                </div>

                <form onSubmit={addRule} className="mt-2 flex gap-2">
                  <textarea value={newRule} onChange={(e) => setNewRule(e.target.value)} placeholder="Add rule..." rows={2} className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-emerald-300 resize-y" />
                  <button type="submit" disabled={adding} className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                    <Plus size={14} /> Add
                  </button>
                </form>

                <div className="mt-2 space-y-2">
                  {loading ? (
                    <div className="space-y-2 p-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-8 animate-pulse rounded bg-zinc-100" />
                      ))}
                    </div>
                  ) : rules.length === 0 ? (
                    <div className="p-2 text-xs text-zinc-500">No rules defined.</div>
                  ) : (
                    <>
                      {/* visible (newest two) */}
                      {visibleRules.map((r, i) => renderRuleCard(r, i))}

                      {/* older dropdown: always check rules.length > 2; visible green toggle */}
                      {rules.length > 2 && (
                        <div className="mt-2">
                          <button
                            onClick={() => setShowOlder((s) => !s)}
                            className="w-full inline-flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
                            aria-expanded={showOlder}
                            aria-controls="older-rules-list"
                            style={{ zIndex: 10 }}
                          >
                            <span>{showOlder ? "Hide older rules" : `Show ${rules.length - 2} more rule${rules.length - 2 > 1 ? "s" : ""}`}</span>
                            <span>{showOlder ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                          </button>

                          <AnimatePresence>
                            {showOlder && (
                              <motion.div id="older-rules-list" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-2 overflow-hidden">
                                {olderRules.map((r, j) => renderRuleCard(r, 2 + j))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RECENT VIEW */}
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "recent" && (
            <motion.div key="recent" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }} className="space-y-3">
              <div className="rounded-md border p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">🧩 GK / Quiz — Preview</div>
                    <div className="mt-0.5 text-xs text-zinc-500">Public home view</div>
                  </div>
                  <div className="text-[11px] text-zinc-500">Preview</div>
                </div>

                <div className="mt-2 rounded-md border bg-zinc-50 p-2 text-sm min-h-[48px]">
                  {loading ? "Loading…" : gk.text ? <div style={{ whiteSpace: "pre-wrap" }}>{gk.text}</div> : <span className="text-zinc-500">No GK set.</span>}
                </div>
              </div>

              <div className="rounded-md border p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Rules — Preview</div>
                    <div className="mt-0.5 text-xs text-zinc-500">Public home list</div>
                  </div>
                  <div className="text-[11px] text-zinc-500">Preview</div>
                </div>

                <div className="mt-2">
                  {loading ? (
                    <div className="space-y-2 p-1">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-6 animate-pulse rounded bg-zinc-100" />
                      ))}
                    </div>
                  ) : rulesList.length === 0 ? (
                    <div className="p-2 text-xs text-zinc-500">No rules published.</div>
                  ) : (
                    <ul className="list-disc pl-4 text-sm text-zinc-800 space-y-1">
                      {rulesList.map((r, i) => (
                        <li key={i} className="line-clamp-2 text-sm">
                          <div style={{ whiteSpace: "pre-wrap" }}>{r}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={() => { load(); setActiveTab("edit"); }} className="rounded border px-2 py-1 text-xs hover:bg-zinc-50">Edit</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog open={toDeleteId !== null} title="Delete rule?" message={toDeleteId !== null ? `Delete this rule? This cannot be undone.` : ""} onCancel={() => { if (!deleting) setToDeleteId(null); }} onConfirm={confirmDelete} busy={deleting} />
    </main>
  );
}
