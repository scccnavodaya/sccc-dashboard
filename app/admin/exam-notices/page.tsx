// app/admin/exam-notices/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Edit as EditIcon,
  Trash2,
  X,
} from "lucide-react";

type ExamNotice = {
  id: string;
  text: string;
  active: boolean;
  start_at: string;
  end_at?: string | null;
  is_active?: boolean;
  release_at?: string | null;
};

const BASE = "/api/exam-ticker";

function whenLabel(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso ?? "-";
  }
}

/* ---------- Robust fetch helper (handles empty/non-json responses) ---------- */
async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  const status = res.status;

  // Try to read body as text first (safe). If empty, return {} for non-JSON.
  const txt = await res.text().catch(() => "");
  if (!res.ok) {
    // If server returned HTML error page (like Next error), show meaningful snippet.
    const snippet = txt.length > 0 ? ` - ${txt.slice(0, 1024)}` : "";
    throw new Error(`Request failed (${status})${snippet}`);
  }

  if (!txt) {
    // No body (204 or empty), return empty object
    return {};
  }

  // If JSON-like content-type, parse; otherwise try parse but fall back to text
  if (contentType.includes("application/json") || contentType.includes("application/ld+json")) {
    try {
      return JSON.parse(txt);
    } catch (e) {
      // If JSON parse fails, include the body in the error to debug server-side HTML
      throw new Error(`Invalid JSON response (${status}) - ${String((e as Error).message)}: ${txt.slice(0, 1024)}`);
    }
  }

  // Not JSON — attempt parse, otherwise return raw text
  try {
    return JSON.parse(txt);
  } catch {
    return txt;
  }
}

/* ---------- Reusable small confirm dialog ---------- */
function ConfirmDialog({
  open,
  title,
  message,
  danger,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message?: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[140] bg-black/40 p-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <motion.div
          className="mx-auto mt-20 w-full max-w-md rounded-xl bg-white p-3 shadow"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-semibold">{title}</div>
          {message && <p className="mt-1 text-xs text-zinc-600 break-words">{message}</p>}
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
              className={`h-8 rounded px-2.5 py-0.5 text-xs font-medium text-white disabled:opacity-60 ${
                danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {busy ? "Please wait…" : "Confirm"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ExamNoticesPage() {
  const [items, setItems] = useState<ExamNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // create form
  const [text, setText] = useState("");
  const [publishing, setPublishing] = useState(false);

  // banners
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(t);
  }, [banner]);

  // edit
  const [editing, setEditing] = useState<ExamNotice | null>(null);
  const [editText, setEditText] = useState("");

  // delete confirm
  const [toDelete, setToDelete] = useState<ExamNotice | null>(null);
  const [deleting, setDeleting] = useState(false);

  // UI: single vertical card tab
  const [activeTab, setActiveTab] = useState<"new" | "recent">("new");

  // Normalize raw DB rows -> UI shape (ensures `.active` exists)
  function normalizeRow(n: any): ExamNotice {
    const id = String(n?.id ?? n?.uuid ?? crypto.randomUUID());
    const text = String(n?.text ?? n?.body ?? n?.title ?? "");
    const isActive = (n?.is_active ?? n?.active ?? n?.isActive ?? false) === true;
    const startAt = n?.start_at ?? n?.release_at ?? n?.releaseAt ?? n?.created_at ?? "";
    return {
      id,
      text,
      active: Boolean(isActive),
      start_at: startAt,
      end_at: n?.end_at ?? null,
      is_active: n?.is_active,
      release_at: n?.release_at ?? null,
    };
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = (await fetchJSON(BASE)) as any[];
      const normalized = (Array.isArray(data) ? data : []).map(normalizeRow);
      normalized.sort((a, b) => {
        const ta = a.start_at ? new Date(a.start_at).getTime() : 0;
        const tb = b.start_at ? new Date(b.start_at).getTime() : 0;
        return tb - ta;
      });
      setItems(normalized);
    } catch (e: any) {
      setErr(e?.message || "Failed to load notices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // latest 5 vs older
  const latest5 = useMemo(() => items.slice(0, 5), [items]);
  const older = useMemo(() => items.slice(5), [items]);

  async function revalidatePublic() {
    try {
      await fetch("/api/revalidate", { method: "POST" });
    } catch {
      // non-blocking
    }
  }

  // ---- create (publish new) ----
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) {
      setBanner({ type: "error", msg: "Please enter a notice text." });
      return;
    }
    setPublishing(true);
    setBanner(null);
    try {
      await fetchJSON(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: v,
          is_active: true,
          start_at: new Date().toISOString(),
          release_at: new Date().toISOString(),
        }),
      });
      setText("");
      await load();
      await revalidatePublic();
      setBanner({ type: "success", msg: "Notice published and live on public page." });
      setActiveTab("recent");
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Failed to publish notice." });
    } finally {
      setPublishing(false);
    }
  }

  // ---- set active (manual promote) ----
  async function setActive(id: string, active: boolean) {
    setBanner(null);
    const prev = items;
    setItems((list) =>
      list.map((n) => (n.id === id ? { ...n, active } : active ? { ...n, active: false } : n)),
    );
    try {
      await fetchJSON(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: active }),
      });
      await revalidatePublic();
      setBanner({ type: "success", msg: active ? "Notice set live." : "Notice set inactive." });
    } catch (e: any) {
      setItems(prev);
      setBanner({ type: "error", msg: e?.message || "Failed to update status." });
    }
  }

  // ---- edit ----
  function openEdit(n: ExamNotice) {
    setEditing(n);
    setEditText(n.text);
  }
  async function saveEdit() {
    if (!editing) return;
    const v = editText.trim();
    if (!v) {
      setBanner({ type: "error", msg: "Text cannot be empty." });
      return;
    }
    setBanner(null);
    const id = editing.id;
    const prev = items;
    setItems((list) => list.map((n) => (n.id === id ? { ...n, text: v } : n)));
    try {
      await fetchJSON(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: v }),
      });
      setEditing(null);
      await revalidatePublic();
      setBanner({ type: "success", msg: "Notice updated." });
    } catch (e: any) {
      setItems(prev);
      setBanner({ type: "error", msg: e?.message || "Failed to update." });
    }
  }

  // ---- delete ----
  function askDelete(n: ExamNotice) {
    setToDelete(n);
  }
  async function reallyDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setBanner(null);

    const id = toDelete.id;
    const prev = items;
    setItems((list) => list.filter((n) => n.id !== id));

    try {
      await fetchJSON(`${BASE}/${id}`, { method: "DELETE" });
      await revalidatePublic();
      setBanner({ type: "success", msg: "Notice deleted." });
    } catch (e: any) {
      setItems(prev);
      setBanner({ type: "error", msg: e?.message || "Failed to delete." });
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-4">
      {/* compact header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded border px-2 py-1 text-xs hover:bg-zinc-50"
          >
            ← Back
          </Link>
          <h2 className="text-sm font-semibold">Exam Ticker</h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              load();
              setActiveTab("recent");
            }}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-zinc-50"
            title="Refresh & show recent"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${
              activeTab === "new" ? "bg-emerald-50" : ""
            }`}
          >
            <EditIcon size={14} />
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
            className={`mb-3 rounded-md px-2 py-2 text-xs ${
              banner.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
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

      {/* single vertical card */}
      <div className="rounded-xl border bg-white p-3 shadow-sm">
        {/* Tabs */}
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("new")}
            className={`rounded-full px-2.5 py-0.5 text-xs ${
              activeTab === "new" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
            aria-pressed={activeTab === "new"}
          >
            New
          </button>
          <button
            onClick={() => {
              setActiveTab("recent");
              load();
            }}
            className={`rounded-full px-2.5 py-0.5 text-xs ${
              activeTab === "recent" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
            aria-pressed={activeTab === "recent"}
          >
            Recent
          </button>
        </div>

        {/* NEW form view */}
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "new" && (
            <motion.form
              key="new"
              onSubmit={add}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="space-y-3"
            >
              <label className="text-xs text-zinc-600">New notice (publishes live)</label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter exam notice text"
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                aria-label="Exam notice text"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={publishing || !text.trim()}
                  className="h-9 rounded bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {publishing ? "Publishing…" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                  }}
                  className="h-9 rounded border px-3 text-sm hover:bg-zinc-50"
                >
                  Clear
                </button>
              </div>
              <p className="mt-0 text-xs text-zinc-500">
                Publishing becomes the active header ticker on the public page.
              </p>
            </motion.form>
          )}
        </AnimatePresence>

        {/* RECENT view */}
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "recent" && (
            <motion.div
              key="recent"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="space-y-3"
            >
              <div className="text-sm font-semibold">Recent Notices</div>

              {/* compact top list */}
              <div className="rounded-md border overflow-hidden">
                <div className="px-3 py-2 text-xs text-zinc-600 bg-zinc-50/70">Latest 5 — click to edit</div>
                <div className="max-h-[48vh] overflow-y-auto">
                  {loading ? (
                    <div className="p-3 space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded bg-zinc-100" />
                      ))}
                    </div>
                  ) : latest5.length === 0 ? (
                    <div className="p-4 text-xs text-zinc-500">No notices yet.</div>
                  ) : (
                    <ul className="divide-y">
                      {latest5.map((n) => (
                        <li
                          key={n.id}
                          className="cursor-pointer px-3 py-3 hover:bg-zinc-50"
                          onClick={() => openEdit(n)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 truncate">
                              <span
                                className={`mr-2 rounded-full px-2 py-[2px] text-[10px] ${
                                  n.active ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-700"
                                }`}
                                title={n.active ? "Currently live" : "Inactive"}
                              >
                                {n.active ? "LIVE" : "OLD"}
                              </span>
                              <span className="text-sm text-zinc-800 line-clamp-2">{n.text}</span>
                            </div>
                            <div className="shrink-0 text-[11px] text-zinc-500">
                              {whenLabel(n.start_at)}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* older accordion */}
              {older.length > 0 && (
                <div className="rounded-md border overflow-hidden">
                  <details className="group">
                    <summary className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer list-none">
                      <span className="text-sm">Older</span>
                      <span className="text-xs text-zinc-500 group-open:hidden">Show</span>
                      <span className="hidden group-open:inline-flex items-center gap-1 text-xs text-zinc-500">
                        <ChevronUp size={14} /> Hide
                      </span>
                    </summary>
                    <div className="px-2 pb-2 space-y-2">
                      {older.map((n) => (
                        <div key={n.id} className="rounded-md border p-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm text-zinc-800 line-clamp-2">{n.text}</div>
                              <div className="mt-1 text-xs text-zinc-500">{whenLabel(n.start_at)}</div>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <button
                                onClick={() => openEdit(n)}
                                className="h-8 rounded border px-2 text-xs hover:bg-zinc-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => askDelete(n)}
                                className="h-8 rounded border px-2 text-xs text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/50 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditing(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Edit notice"
          >
            <motion.div
              className="mx-auto mt-16 w-full max-w-xl rounded-xl bg-white p-3 shadow"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Edit Notice</div>
                  <div className="mt-1 text-xs text-zinc-500">Started: {whenLabel(editing.start_at)}</div>
                </div>
                <div className="shrink-0 space-x-1">
                  <button
                    onClick={() => setActive(editing.id, !editing.active)}
                    className={`h-8 rounded border px-2 text-xs hover:bg-zinc-50 ${editing.active ? "text-zinc-700" : "text-emerald-700"}`}
                    title={editing.active ? "Set inactive" : "Set live"}
                  >
                    {editing.active ? "Set Inactive" : "Set Live"}
                  </button>
                  <button
                    onClick={() => askDelete(editing)}
                    className="h-8 rounded border px-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={5}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="h-9 rounded px-3 text-sm hover:bg-zinc-50"
                >
                  Close
                </button>
                <button
                  onClick={saveEdit}
                  className="h-9 rounded bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete this notice?"
        message={toDelete ? `"${toDelete.text.slice(0, 80)}${toDelete.text.length > 80 ? "…" : ""}"` : ""}
        danger
        busy={deleting}
        onCancel={() => (deleting ? null : setToDelete(null))}
        onConfirm={reallyDelete}
      />
    </div>
  );
}
