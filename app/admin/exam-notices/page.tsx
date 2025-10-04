// app/admin/exam-notices/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ExamNotice = {
  id: string;
  text: string;
  active: boolean;
  start_at: string;   // ISO
  end_at?: string | null;
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
        className="fixed inset-0 z-[140] bg-black/50 p-4
                   pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
                   pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <motion.div
          className="mx-auto mt-24 w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 18, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-base font-semibold">{title}</div>
          {message && <p className="mt-1 text-sm text-zinc-600 break-words">{message}</p>}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="h-10 rounded border px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className={`h-10 rounded px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 ${
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

  // helpers
  async function fetchJSON(url: string, init?: RequestInit) {
    const r = await fetch(url, init);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || "Request failed");
    return data;
  }

  async function revalidatePublic() {
    try {
      await fetch("/api/revalidate", { method: "POST" });
    } catch {
      /* non-blocking */
    }
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = (await fetchJSON(BASE)) as ExamNotice[];
      data.sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
      setItems(data);
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
        body: JSON.stringify({ text: v }),
      });
      setText("");
      await load();
      await revalidatePublic();
      setBanner({ type: "success", msg: "Notice published and live on public page." });
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
    // Optimistic: if setting active true, demote others; if false, just toggle this one.
    setItems((list) =>
      list.map((n) => (n.id === id ? { ...n, active } : active ? { ...n, active: false } : n)),
    );
    try {
      await fetchJSON(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
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
    <div className="mx-auto w-full max-w-5xl px-3 sm:px-4 lg:px-6 py-4">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            ← Back to Dashboard
          </Link>
          <h2 className="text-lg sm:text-xl font-semibold truncate">
            Exam Notices (Ticker)
          </h2>
        </div>
        <button
          onClick={load}
          className="h-10 rounded border px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>

      {/* Inline banner */}
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.msg}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`mb-3 rounded-md px-3 py-2 text-sm shadow-sm ${
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
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Publish new */}
      <form onSubmit={add} className="mb-4 rounded-2xl border bg-white p-3 sm:p-4">
        <label className="text-sm text-zinc-600">New notice (publishes live)</label>
        <div className="mt-1 flex flex-col sm:flex-row gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter exam notice text"
            className="flex-1 rounded border border-zinc-300 bg-white px-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-emerald-300"
            aria-label="Exam notice text"
          />
          <button
            type="submit"
            disabled={publishing || !text.trim()}
            className="h-11 rounded bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Publishing creates the latest <b>active</b> notice and replaces the previous one on the public page
          (header “Latest Exam” in red).
        </p>
      </form>

      {/* Older dropdown */}
      <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <label className="text-sm text-zinc-600 shrink-0">Older notices:</label>
        <select
          className="w-full sm:w-auto min-w-[240px] sm:min-w-[280px] rounded border border-zinc-300 bg-white px-2 py-2 text-sm"
          onChange={(e) => {
            const id = e.target.value;
            const n = items.find((x) => x.id === id);
            if (n) openEdit(n);
            e.currentTarget.selectedIndex = 0;
          }}
          aria-label="Select older notice to view or edit"
        >
          <option value="">Select to view/edit…</option>
          {older.map((n) => (
            <option key={n.id} value={n.id}>
              {`${whenLabel(n.start_at)} — ${n.text.slice(0, 40)}${n.text.length > 40 ? "…" : ""}`}
            </option>
          ))}
        </select>
      </div>

      {/* Latest 5 list */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="sticky top-0 z-10 border-b bg-zinc-50/70 px-3 py-2 text-sm text-zinc-600 backdrop-blur">
          Latest 5 — click a row to edit / manage
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded border bg-zinc-100" />
              ))}
            </div>
          ) : latest5.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">No notices yet.</div>
          ) : (
            <ul className="divide-y">
              {latest5.map((n) => (
                <li
                  key={n.id}
                  className="cursor-pointer px-3 py-3 hover:bg-zinc-50"
                  onClick={() => openEdit(n)}
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
                      <span className="text-zinc-800">{n.text}</span>
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

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/50 p-4
                       pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
                       pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditing(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Edit notice"
          >
            <motion.div
              className="mx-auto mt-16 w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold">Edit Notice</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Started: {whenLabel(editing.start_at)}
                  </div>
                </div>
                <div className="shrink-0 space-x-2">
                  <button
                    onClick={() => setActive(editing.id, !editing.active)}
                    className={`h-9 rounded border px-2 py-1 text-xs hover:bg-zinc-50 ${
                      editing.active ? "text-zinc-700" : "text-emerald-700"
                    }`}
                    title={editing.active ? "Set inactive" : "Set live"}
                  >
                    {editing.active ? "Set Inactive" : "Set Live"}
                  </button>
                  <button
                    onClick={() => askDelete(editing)}
                    className="h-9 rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={5}
                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-300"
              />

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="h-10 rounded px-3 py-1.5 text-sm hover:bg-zinc-100"
                >
                  Close
                </button>
                <button
                  onClick={saveEdit}
                  className="h-10 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
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
        message={
          toDelete
            ? `"${toDelete.text.slice(0, 80)}${toDelete.text.length > 80 ? "…" : ""}"`
            : ""
        }
        danger
        busy={deleting}
        onCancel={() => (deleting ? null : setToDelete(null))}
        onConfirm={reallyDelete}
      />
    </div>
  );
}
