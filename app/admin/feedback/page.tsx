"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Feedback = {
  id: string;
  parent_name: string;
  student_name: string;
  comment: string;
  created_at: string;
  read: boolean;
};

const ADMIN_BASE = "/api/admin/feedback";
const PUBLIC_BASE = "/api/feedback";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/* ---------- Small confirm dialog (no browser confirm) ---------- */
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
        className="fixed inset-0 z-[140] bg-black/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="mx-auto mt-24 w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 18, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-base font-semibold">{title}</div>
          {message && <p className="mt-1 text-sm text-zinc-600">{message}</p>}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="rounded border px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className={`rounded px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 ${
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

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Inline banner (success / error)
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(t);
  }, [banner]);

  // viewer
  const [openItem, setOpenItem] = useState<Feedback | null>(null);

  // delete confirm
  const [toDelete, setToDelete] = useState<Feedback | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -------- load ----------
  async function fetchJSON(url: string, init?: RequestInit) {
    const r = await fetch(url, init);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || "Request failed");
    return data;
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      let data: Feedback[] = [];
      try {
        data = await fetchJSON(ADMIN_BASE);
      } catch {
        data = await fetchJSON(PUBLIC_BASE);
      }
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // split into latest 5 and older
  const latest5 = useMemo(() => items.slice(0, 5), [items]);
  const older = useMemo(() => items.slice(5), [items]);

  // -------- actions ----------
  async function setRead(id: string, read: boolean) {
    setBanner(null);
    const prev = items;
    setItems((list) => list.map((f) => (f.id === id ? { ...f, read } : f)));
    if (openItem?.id === id) setOpenItem({ ...openItem, read });

    try {
      try {
        await fetchJSON(`${ADMIN_BASE}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read }),
        });
      } catch {
        await fetchJSON(`${PUBLIC_BASE}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read }),
        });
      }
      setBanner({ type: "success", msg: read ? "Marked as read." : "Marked as unread." });
    } catch (e: any) {
      setItems(prev);
      if (openItem?.id === id) setOpenItem(prev.find((x) => x.id === id) || null);
      setBanner({ type: "error", msg: e?.message || "Failed to update status." });
    }
  }

  // open custom confirm
  function askDelete(item: Feedback) {
    setToDelete(item);
  }

  // actually delete
  async function reallyDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setBanner(null);

    const id = toDelete.id;
    const prev = items;
    setItems((list) => list.filter((f) => f.id !== id));
    if (openItem?.id === id) setOpenItem(null);

    try {
      try {
        await fetchJSON(`${ADMIN_BASE}/${id}`, { method: "DELETE" });
      } catch {
        await fetchJSON(`${PUBLIC_BASE}/${id}`, { method: "DELETE" });
      }
      setBanner({ type: "success", msg: "Feedback deleted." });
    } catch (e: any) {
      setItems(prev);
      setOpenItem(prev.find((x) => x.id === id) || null);
      setBanner({ type: "error", msg: e?.message || "Failed to delete." });
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      {/* Top bar with Back to Dashboard */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            ← Back to Dashboard
          </Link>
          <h2 className="text-xl font-semibold">Parent Feedback</h2>
        </div>
        <button
          onClick={load}
          className="rounded border px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>

      {/* Inline banner messages */}
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

      {/* Top: Older feedback dropdown */}
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-zinc-600">Older feedback:</label>
        <select
          className="min-w-[260px] rounded border border-zinc-300 px-2 py-1 text-sm"
          onChange={(e) => {
            const id = e.target.value;
            const item = items.find((x) => x.id === id) || null;
            if (item) setOpenItem(item);
            e.currentTarget.selectedIndex = 0;
          }}
        >
          <option value="">Select to view…</option>
          {older.map((f) => (
            <option key={f.id} value={f.id}>
              {`${f.student_name} (${f.parent_name}) — ${new Date(f.created_at).toLocaleString()}`}
            </option>
          ))}
        </select>
      </div>

      {/* Latest 5 list (single-line rows) */}
      <div className="rounded-2xl border bg-white">
        <div className="sticky top-0 z-10 border-b bg-zinc-50/70 px-3 py-2 text-sm text-zinc-600 backdrop-blur">
          Latest 5 — click a row to view full
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded border bg-zinc-100" />
              ))}
            </div>
          ) : latest5.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">No feedback yet.</div>
          ) : (
            <ul className="divide-y">
              {latest5.map((f) => (
                <li
                  key={f.id}
                  className="cursor-pointer px-3 py-3 hover:bg-zinc-50"
                  onClick={() => setOpenItem(f)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate">
                      <span className="font-medium">{f.student_name}</span>{" "}
                      <span className="text-zinc-500">({f.parent_name}) — </span>
                      <span className="text-zinc-700">
                        {f.comment.replace(/\s+/g, " ").slice(0, 60)}
                        {f.comment.length > 60 ? "…" : ""}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500">
                        {new Date(f.created_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`rounded-full px-2 py-[2px] text-[10px] ${
                          f.read ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {f.read ? "READ" : "NEW"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Viewer modal */}
      <AnimatePresence>
        {openItem && (
          <motion.div
            className="fixed inset-0 z-[120] bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenItem(null)}
          >
            <motion.div
              className="mx-auto mt-16 w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold">
                    {openItem.student_name}{" "}
                    <span className="font-normal text-zinc-500">({openItem.parent_name})</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{formatWhen(openItem.created_at)}</div>
                </div>
                <div className="shrink-0 space-x-2">
                  <button
                    onClick={() => setRead(openItem.id, !openItem.read)}
                    className="rounded border px-2 py-1 text-xs hover:bg-zinc-50"
                  >
                    {openItem.read ? "Mark Unread" : "Mark Read"}
                  </button>
                  <button
                    onClick={() => askDelete(openItem)}
                    className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div
                className="rounded-md border bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-800
                           whitespace-pre-wrap break-words max-h-72 overflow-y-auto overflow-x-hidden"
              >
                {openItem.comment}
              </div>

              <div className="mt-3 flex items-center justify-end">
                <button
                  onClick={() => setOpenItem(null)}
                  className="rounded-md px-3 py-1.5 text-sm hover:bg-zinc-100"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom confirm dialog for delete */}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete this feedback?"
        message={toDelete ? `This will permanently remove feedback from ${toDelete.parent_name} about ${toDelete.student_name}.` : ""}
        danger
        busy={deleting}
        onCancel={() => (deleting ? null : setToDelete(null))}
        onConfirm={reallyDelete}
      />
    </div>
  );
}
