"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, RotateCcw, Plus, Pencil, Check, X, Trash2, ImageIcon,
  Filter, Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ========================= Types & utils ========================= */

type Student = {
  id: string;
  name: string;
  active?: boolean;
  photo_path?: string | null;
  photo_url?: string | null;
  created_at?: string | null;
};

function buildPhotoUrl(s: Student) {
  if (s.photo_url) return s.photo_url;
  if (s.photo_path) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    return `${base}/storage/v1/object/public/student-photos/${s.photo_path}`;
  }
  return "/logo.jpeg";
}

function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <motion.span
      layout
      initial={false}
      animate={{ scale: active ? 1 : 1, opacity: 1 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs transition-colors ${
        active ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"
      }`}
    >
      {children}
    </motion.span>
  );
}

/* ===============================================================
   Scoring (public result display) — NEW (non-breaking) UTILITIES
   Usage example:
     const s = computeScore({ totalQuestions: 40, wrongAnswers: 4, marksPerQuestion: 1.25 });
     // s.display === "45/50"
   =============================================================== */

export type ScoreInput = {
  totalQuestions: number;     // e.g. 40
  wrongAnswers: number;       // e.g. 4
  marksPerQuestion: number;   // e.g. 1.25  (=> 40 * 1.25 = 50 max)
};

export function computeScore({ totalQuestions, wrongAnswers, marksPerQuestion }: ScoreInput) {
  const tq = Math.max(0, Number(totalQuestions) || 0);
  const wa = Math.max(0, Number(wrongAnswers) || 0);
  const mpq = Number(marksPerQuestion) || 0;

  const correct = Math.max(0, tq - wa);
  const maxMarks = tq * mpq;          // 40 * 1.25 = 50
  const obtained = correct * mpq;     // 36 * 1.25 = 45
  const percent = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0;

  return {
    correct,
    wrong: wa,
    maxMarks,
    obtained,
    percent: Number(percent.toFixed(2)),
    display: `${obtained}/${maxMarks}`, // "45/50"
  };
}

/* ========================= Confirm Dialog ========================= */

function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger,
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-[92vw] max-w-[440px] rounded-2xl bg-white p-4 shadow-xl"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <h3 className="text-base font-semibold">{title}</h3>
            {message && <p className="mt-1 text-sm text-zinc-600">{message}</p>}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                disabled={busy}
                className="rounded-md border px-3 py-1.5 text-sm transition hover:bg-zinc-50 disabled:opacity-60"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className={`rounded-md px-3 py-1.5 text-sm font-medium text-white transition disabled:opacity-60 ${
                  danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {busy ? "Please wait…" : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ========================= DP Modal ========================= */

function DpModal({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative rounded-2xl bg-black/20 p-3"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <div className="h=[320px] w-[320px] overflow-hidden rounded-2xl bg-black md:h-[360px] md:w-[360px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />
          </div>
          <button
            onClick={onClose}
            className="absolute -right-2 -top-2 rounded-full bg-white px-3 py-1 text-sm font-medium shadow transition hover:shadow-md"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ========================= Simple square Cropper ========================= */

function dataUrlFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function drawCropped(
  img: HTMLImageElement,
  opts: { scale: number; offsetX: number; offsetY: number; outSize: number }
): Promise<Blob> {
  const { scale, offsetX, offsetY, outSize } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, outSize, outSize);

  const maxSide = Math.max(img.width, img.height);
  const renderSize = maxSide * scale;
  const dx = (outSize - renderSize) / 2 + offsetX;
  const dy = (outSize - renderSize) / 2 + offsetY;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, dx, dy, renderSize, renderSize);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92));
}

function CropModal({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}) {
  const [src, setSrc] = useState<string>("");
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => { dataUrlFromFile(file).then(setSrc); }, [file]);

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    dragging.current = true;
    const p = "touches" in e ? e.touches[0] : (e as any);
    last.current = { x: p.clientX, y: p.clientY };
  }
  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!dragging.current) return;
    const p = "touches" in e ? e.touches[0] : (e as any);
    setOffset((prev) => ({
      x: prev.x + (p.clientX - last.current.x),
      y: prev.y + (p.clientY - last.current.y),
    }));
    last.current = { x: p.clientX, y: p.clientY };
  }
  function onUp() { dragging.current = false; }

  async function confirm() {
    if (!imgEl) return;
    const blob = await drawCropped(imgEl, {
      scale,
      offsetX: offset.x,
      offsetY: offset.y,
      outSize: 400,
    });
    onConfirm(blob);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[125] flex items-center justify-center bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-[92vw] max-w-[560px] rounded-2xl bg-white p-4 shadow-xl"
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-base font-semibold">Crop photo</h3>
          <p className="mt-1 text-xs text-zinc-600">Drag to position. Use the slider to zoom.</p>

          <div
            className="relative mx-auto mt-3 h-[300px] w-[300px] overflow-hidden rounded-xl bg-zinc-100"
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          >
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt="Crop"
                ref={setImgEl}
                draggable={false}
                className="select-none"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                  transformOrigin: "center center",
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-white/70" />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-zinc-500">Zoom</span>
            <input
              type="range" min={0.5} max={3} step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={onCancel} className="rounded-md border px-3 py-1.5 text-sm transition hover:bg-zinc-50">
              Cancel
            </button>
            <button onClick={confirm} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700">
              Use photo
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ========================= PhotoUploader (crop + replace) ========================= */

function PhotoUploader({
  studentId,
  onDone,
}: { studentId: string; onDone: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Only JPG/PNG allowed.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert("Image too large (max 8MB).");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFileToCrop(file);
  }

  async function uploadBlob(blob: Blob) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const res = await fetch(`/api/admin/upload/student-photo?studentId=${studentId}`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Upload failed");
      onDone(`${data.url}?v=${Date.now()}`); // cache-bust
    } catch (err: any) {
      alert(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-emerald-700">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={onChange}
          disabled={busy}
        />
        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 transition hover:bg-emerald-50 disabled:opacity-60">
          <ImageIcon size={14} />
          {busy ? "Uploading…" : "Change photo"}
        </span>
      </label>

      {fileToCrop && (
        <CropModal
          file={fileToCrop}
          onCancel={() => {
            setFileToCrop(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          onConfirm={async (blob) => {
            setFileToCrop(null);
            await uploadBlob(blob);
          }}
        />
      )}
    </>
  );
}

/* ========================= Main page ========================= */

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // add form
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  // inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // DP preview
  const [dp, setDp] = useState<{ src: string; alt: string } | null>(null);

  // delete dialog
  const [toDelete, setToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const total = students.length;
  const activeCount = students.filter((s) => s.active).length;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/students", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setStudents(data as Student[]);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: v }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add");
      setStudents((list) => [...list, data as Student]); // append → first added first
      setName("");
    } catch (e: any) {
      alert(e?.message || "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  async function rename(id: string, newName: string) {
    const prev = students;
    setStudents((list) => list.map((x) => (x.id === id ? { ...x, name: newName } : x)));
    const res = await fetch(`/api/admin/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStudents(prev);
      alert(data?.error || "Rename failed");
    }
  }

  async function toggleActive(s: Student) {
    const next = !s.active;
    const prev = students;
    setStudents((list) => list.map((x) => (x.id === s.id ? { ...x, active: next } : x)));
    const res = await fetch(`/api/admin/students/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStudents(prev);
      alert(data?.error || "Update failed");
    }
  }

  // open nice dialog instead of window.confirm
  function askDelete(s: Student) {
    setToDelete(s);
  }

  async function reallyDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const id = toDelete.id;
    const prev = students;
    setStudents((list) => list.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStudents(prev);
        alert(data?.error || "Delete failed");
      }
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  function applyNewPhoto(id: string, url: string) {
    setStudents((list) => list.map((x) => (x.id === id ? { ...x, photo_url: url } : x)));
  }

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const matchQ = (s: Student) => !text || s.name.toLowerCase().includes(text);
    const matchStatus = (s: Student) =>
      status === "all" || (status === "active" ? s.active : !s.active);

    const ordered = [...students].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return ta - tb; // oldest first
    });

    return ordered.filter((s) => matchQ(s) && matchStatus(s));
  }, [students, q, status]);

  useEffect(() => { load(); }, []);

  function beginEdit(s: Student) { setEditingId(s.id); setEditingName(s.name); }
  function cancelEdit() { setEditingId(null); setEditingName(""); }
  async function commitEdit(s: Student) {
    const v = editingName.trim();
    setEditingId(null);
    if (!v || v === s.name) return;
    await rename(s.id, v);
  }

  // === constants for "4-row fixed window" ===
  const LIST_BODY_4ROWS = "h-[224px]"; // 4 * 56px rows
  const ROW_HEIGHT_CLASS = "h-14";     // each row = 56px

  // row animation variants
  const rowVariants = {
    hidden: { opacity: 0, y: 6 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.18 } },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-2 md:py-4">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm transition hover:bg-zinc-50 active:scale-[0.99]"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h2 className="text-xl font-semibold">Students</h2>
        </div>
        <div className="flex items-center gap-2">
          <Chip active>{activeCount} active</Chip>
          <Chip>{total} total</Chip>
          <button
            onClick={load}
            className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm transition hover:bg-zinc-50 active:scale-[0.99]"
          >
            <RotateCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students…"
            className="w-56 rounded-md border border-zinc-300 py-1.5 pl-7 pr-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <div className="inline-flex items-center gap-1">
          <Filter size={14} className="text-zinc-500" />
          {(["all","active","inactive"] as const).map(k => (
            <motion.button
              key={k}
              onClick={() => setStatus(k)}
              whileTap={{ scale: 0.98 }}
              className={`rounded-full px-3 py-1 text-sm transition ${
                status === k ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              {k[0].toUpperCase()+k.slice(1)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Two-pane */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* LEFT: Add student */}
        <motion.div
          className="rounded-2xl border bg-white p-4"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Plus size={18} />
            </div>
            <div className="text-base font-medium">Add student</div>
          </div>
          <form onSubmit={add} className="mt-2">
            <label className="text-xs text-zinc-600">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student name"
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none transition focus:ring-2 focus:ring-emerald-300"
              required
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Press Enter to save</span>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </motion.div>

        {/* RIGHT: list */}
        <motion.div
          className="rounded-2xl border bg-white"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="sticky top-0 z-10 border-b bg-zinc-50/80 px-3 py-2 backdrop-blur">
                <div className="grid grid-cols-[56px_64px_minmax(220px,1fr)_120px_140px_180px] items-center gap-2 text-xs font-medium text-zinc-600">
                  <div>#</div>
                  <div>Photo</div>
                  <div>Name</div>
                  <div>Status</div>
                  <div>Created</div>
                  <div className="text-right">Actions</div>
                </div>
              </div>

              {/* === FIXED 4-ROW WINDOW + VERTICAL SCROLL === */}
              <div className={`${LIST_BODY_4ROWS} overflow-y-auto`}>
                {loading ? (
                  <div className="p-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={`grid ${ROW_HEIGHT_CLASS} grid-cols-[56px_64px_minmax(220px,1fr)_120px_140px_180px] items-center gap-2 border-b px-3`}
                      >
                        <div className="h-3 w-6 animate-pulse rounded bg-zinc-200" />
                        <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200" />
                        <div className="h-3 w-40 animate-pulse rounded bg-zinc-200" />
                        <div className="h-6 w-20 animate-pulse rounded bg-zinc-200" />
                        <div className="h-3 w-24 animate-pulse rounded bg-zinc-200" />
                        <div className="ml-auto h-6 w-28 animate-pulse rounded bg-zinc-200" />
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-sm text-zinc-500">No students found.</div>
                ) : (
                  <AnimatePresence initial={false}>
                    {filtered.map((s, idx) => (
                      <motion.div
                        key={s.id}
                        className={`grid ${ROW_HEIGHT_CLASS} grid-cols-[56px_64px_minmax(220px,1fr)_120px_140px_180px] items-center gap-2 border-b px-3 transition-colors hover:bg-zinc-50`}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0, y: -6 }}
                        layout
                      >
                        <div className="text-sm text-zinc-600">{idx + 1}</div>

                        {/* avatar → open DP modal */}
                        <button
                          className="h-10 w-10 overflow-hidden rounded-full border transition hover:ring-2 hover:ring-emerald-200"
                          onClick={() => setDp({ src: buildPhotoUrl(s), alt: s.name })}
                          title="View photo"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={buildPhotoUrl(s)} alt={s.name} className="h-full w-full object-cover" />
                        </button>

                        {/* Name (inline edit) */}
                        <div className="min-w-0">
                          {editingId === s.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => commitEdit(s)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitEdit(s);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                className="w-full rounded border border-zinc-300 px-2 py-1 text-sm outline-none transition focus:ring-2 focus:ring-emerald-300"
                              />
                              <button onClick={() => commitEdit(s)} className="rounded p-1 text-emerald-700 transition hover:bg-emerald-50" title="Save">
                                <Check size={14} />
                              </button>
                              <button onClick={cancelEdit} className="rounded p-1 text-zinc-600 transition hover:bg-zinc-100" title="Cancel">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium" title={s.name}>{s.name}</span>
                              <button
                                onClick={() => { beginEdit(s); }}
                                className="rounded p-1 text-zinc-600 transition hover:bg-zinc-100 active:scale-[0.98]"
                                title="Rename"
                              >
                                <Pencil size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <button
                            onClick={() => toggleActive(s)}
                            className={`rounded px-2 py-1 text-xs transition ${
                              s.active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                            }`}
                          >
                            {s.active ? "Active" : "Inactive"}
                          </button>
                        </div>

                        <div className="text-sm text-zinc-600">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : "-"}
                        </div>

                        <div className="ml-auto flex items-center justify-end gap-2">
                          <PhotoUploader studentId={s.id} onDone={(url) => applyNewPhoto(s.id, url)} />
                          <button
                            onClick={() => askDelete(s)}
                            className="rounded border px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              {/* === /FIXED WINDOW === */}
            </div>
          </div>
        </motion.div>
      </div>

      {/* modals */}
      <AnimatePresence>{dp && <DpModal src={dp.src} alt={dp.alt} onClose={() => setDp(null)} />}</AnimatePresence>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this student?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        danger
        busy={deleting}
        onConfirm={reallyDelete}
        onCancel={() => (deleting ? null : setToDelete(null))}
      />

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
    </div>
  );
}
