"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  RotateCcw,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type SectionKey = "MAT" | "ENGLISH" | "MATHS";

type Student = {
  id: string;
  name: string;
  photo_url?: string | null;
  photo_path?: string | null;
  active?: boolean;
};

type Row = {
  student_id: string;
  name: string;
  present: boolean;
  wrongStr: string; // keep as string so user can clear it
};

type RecentTest = {
  id: string;
  section: SectionKey;
  test_date: string; // YYYY-MM-DD
  total_questions?: number | null;
  created_at?: string | null;
  marks_count: number;
};

function buildPhotoUrl(s?: Student) {
  if (!s) return "/logo.jpeg";
  if (s.photo_url) return s.photo_url;
  if (s.photo_path && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${base}/storage/v1/object/public/student-photos/${s.photo_path}`;
  }
  return "/logo.jpeg";
}

const fmt = (n: number) =>
  (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, "");

function ymNowIST() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "2025";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}
function ymFromISO(isoDate: string) {
  return (isoDate || "").slice(0, 7);
}

export default function AdminTestsPage() {
  // ── form state ────────────────────────────────────────────────
  const [section, setSection] = useState<SectionKey>("MAT");
  const [testDate, setTestDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  // questions as string (allows empty)
  const [totalQStr, setTotalQStr] = useState<string>("0");
  const totalQ = useMemo(
    () => Math.max(0, parseInt((totalQStr || "0").trim(), 10) || 0),
    [totalQStr]
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  // banners (inline, no alert/localhost text)
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ── right panel: recent ───────────────────────────────────────
  const [recent, setRecent] = useState<RecentTest[]>([]);
  const [recentFilter, setRecentFilter] = useState<SectionKey | "ALL">("ALL");
  const [recentMonth, setRecentMonth] = useState<string>(() => ymNowIST()); // YYYY-MM
  const [loadingRecent, setLoadingRecent] = useState(true);

  // edit/delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<RecentTest | null>(null);
  const [editDraft, setEditDraft] = useState<{ section: SectionKey; date: string; totalQStr: string; }>({
    section: "MAT",
    date: "",
    totalQStr: "0",
  });

  // derived
  const presentCount = useMemo(() => rows.filter((r) => r.present).length, [rows]);
  const maxMarks = useMemo(() => totalQ * 1.25, [totalQ]);

  // ── helpers ───────────────────────────────────────────────────
  function parseAndClampWrong(str: string): number {
    const n = parseInt((str || "").trim(), 10);
    const raw = Number.isFinite(n) ? n : 0;
    if (totalQ > 0) return Math.min(Math.max(raw, 0), totalQ);
    return Math.max(raw, 0);
  }

  function togglePresent(id: string) {
    setRows((list) =>
      list.map((r) => (r.student_id === id ? { ...r, present: !r.present } : r))
    );
  }

  function setWrongStr(id: string, v: string) {
    const cleaned = v.replace(/[^\d]/g, ""); // digits only, allow empty
    setRows((list) => list.map((r) => (r.student_id === id ? { ...r, wrongStr: cleaned } : r)));
  }

  function markAllPresent(v: boolean) {
    setRows((list) => list.map((r) => ({ ...r, present: v })));
  }

  async function revalidatePublic() {
    try {
      await fetch("/api/revalidate", { method: "POST" });
    } catch {
      /* non-blocking */
    }
  }

  // ── loaders ───────────────────────────────────────────────────
  async function loadStudents() {
    try {
      const r = await fetch("/api/admin/students", { credentials: "include" });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load students");
      const actives: Student[] = (data as Student[]).filter((s) => s.active !== false);
      setStudents(actives);
      setRows(
        actives.map((s) => ({
          student_id: s.id,
          name: s.name,
          present: true,
          wrongStr: "0",
        }))
      );
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Could not load students." });
    }
  }

  async function loadRecent() {
    setLoadingRecent(true);
    try {
      const params = new URLSearchParams();
      if (recentFilter !== "ALL") params.set("section", recentFilter);
      if (recentMonth) params.set("month", recentMonth); // YYYY-MM
      const r = await fetch(`/api/admin/tests${params.toString() ? `?${params.toString()}` : ""}`, {
        credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to load tests");
      setRecent(data as RecentTest[]);
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Could not load tests." });
    } finally {
      setLoadingRecent(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);
  useEffect(() => {
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentFilter, recentMonth]);

  // ── submit/save ────────────────────────────────────────────────
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBanner(null);

    if (!testDate) {
      setBanner({ type: "error", msg: "Please choose a test date." });
      return;
    }
    if (totalQ === 0) {
      setBanner({ type: "error", msg: "Total questions must be greater than 0." });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        section,
        test_date: testDate,
        total_questions: totalQ, // server mirrors to legacy 'questions' too
        marks: rows
          .filter((r) => r.present)
          .map((r) => ({
            student_id: r.student_id,
            wrong: parseAndClampWrong(r.wrongStr), // 0 allowed (full score)
          })),
      };

      const res = await fetch("/api/admin/tests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save test");

      // Reset wrong counts, keep present flags
      setRows((list) => list.map((r) => ({ ...r, wrongStr: "0" })));

      // Jump the Recent pane to this section+month
      setRecentFilter(section);
      setRecentMonth(ymFromISO(testDate));

      await loadRecent();
      await revalidatePublic();

      setBanner({ type: "success", msg: "Test saved & published to public page." });
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Could not save test." });
    } finally {
      setSaving(false);
    }
  }

  // ── recent actions ─────────────────────────────────────────────
  function openEdit(t: RecentTest) {
    setEditing(t);
    setEditDraft({
      section: t.section,
      date: t.test_date,
      totalQStr: String(t.total_questions ?? 0),
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setBanner(null);
    try {
      const tq = Math.max(0, parseInt((editDraft.totalQStr || "0").trim(), 10) || 0);
      if (tq <= 0) {
        setBanner({ type: "error", msg: "Total questions must be greater than 0." });
        return;
      }

      const r = await fetch(`/api/admin/tests/${editing.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: editDraft.section,
          test_date: editDraft.date,
          total_questions: tq,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Update failed");

      setEditing(null);
      // keep Recent on edited section + month
      setRecentFilter(editDraft.section);
      setRecentMonth(ymFromISO(editDraft.date));

      await loadRecent();
      await revalidatePublic();

      setBanner({ type: "success", msg: "Test updated & republished." });
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Could not update test." });
    }
  }

  async function doDelete(id: string) {
    setBanner(null);
    try {
      // optional: cascade marks first if DB doesn’t cascade
      await fetch(`/api/admin/marks/by-test/${id}`, { method: "DELETE", credentials: "include" }).catch(() => {});
      const r = await fetch(`/api/admin/tests/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Delete failed");

      setConfirmDeleteId(null);
      await loadRecent();
      await revalidatePublic();

      setBanner({ type: "success", msg: "Test deleted & removed from public page." });
    } catch (e: any) {
      setBanner({ type: "error", msg: e?.message || "Could not delete test." });
    }
  }

  // ── UI constants: same-size scroll windows (≈4 rows) ───────────
  const fixedScrollCls = "h-[224px] overflow-y-auto"; // ~56px/row, both panes equal

  // row fade/slide
  const rowVariants = {
    hidden: { opacity: 0, y: 4 },
    show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
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
          <h2 className="text-xl font-semibold">Tests</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <ClipboardList size={16} />
          <span>{presentCount} present</span>
        </div>
      </div>

      {/* Inline banner */}
      <AnimatePresence>
        {banner && (
          <motion.div
            key={banner.msg}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* LEFT: form */}
        <motion.form
          onSubmit={submit}
          className="rounded-2xl border bg-white p-4 shadow-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* inputs */}
          <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {/* Section */}
            <div>
              <label className="text-xs text-zinc-600">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as SectionKey)}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 transition focus:ring-2 focus:ring-emerald-300"
              >
                <option value="MAT">MAT</option>
                <option value="ENGLISH">ENGLISH</option>
                <option value="MATHS">MATHS</option>
              </select>
            </div>
            {/* Date */}
            <div>
              <label className="text-xs text-zinc-600">Test Date</label>
              <div className="relative mt-1">
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full rounded border border-zinc-300 px-3 py-2 pr-8 transition focus:ring-2 focus:ring-emerald-300"
                />
                <Calendar className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-400" />
              </div>
            </div>
            {/* Total Questions */}
            <div>
              <label className="text-xs text-zinc-600">Total Questions</label>
              <input
                inputMode="numeric"
                value={totalQStr}
                onChange={(e) => setTotalQStr(e.target.value.replace(/[^\d]/g, ""))}
                onFocus={() => {
                  if (totalQStr === "0") setTotalQStr("");
                }}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 transition focus:ring-2 focus:ring-emerald-300"
                placeholder="0"
              />
            </div>
          </div>

          {/* header actions */}
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium">Enter wrong counts (each Q = 1.25)</div>
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => markAllPresent(true)}
                className="rounded border px-2 py-1 transition hover:bg-zinc-50 active:scale-[0.99]"
              >
                Mark all present
              </button>
              <button
                type="button"
                onClick={() => markAllPresent(false)}
                className="rounded border px-2 py-1 transition hover:bg-zinc-50 active:scale-[0.99]"
              >
                Mark all absent
              </button>
            </div>
          </div>

          {/* Students grid */}
          <div className={`${fixedScrollCls} rounded border`}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50">
                <tr className="text-left text-zinc-600">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Student</th>
                  <th className="px-3 py-2">Present</th>
                  <th className="px-3 py-2">Wrong</th>
                  <th className="px-3 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {rows.map((r, i) => {
                    const wrong = parseAndClampWrong(r.wrongStr);
                    const score = r.present ? Math.max(0, (totalQ - wrong) * 1.25) : 0;
                    const stu = students.find((s) => s.id === r.student_id);
                    return (
                      <motion.tr
                        key={r.student_id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="show"
                        exit={{ opacity: 0 }}
                        className="border-t transition-colors hover:bg-zinc-50"
                      >
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={buildPhotoUrl(stu)}
                              alt={r.name}
                              className="h-8 w-8 rounded-full border object-cover"
                            />
                            <span className="font-medium">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={r.present}
                            onChange={() => togglePresent(r.student_id)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            disabled={!r.present}
                            value={r.wrongStr}
                            onChange={(e) => setWrongStr(r.student_id, e.target.value)}
                            className="w-20 rounded border border-zinc-300 px-2 py-1 transition focus:ring-2 focus:ring-emerald-300 disabled:bg-zinc-50"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {r.present ? `${fmt(score)}/${fmt(maxMarks)}` : "—"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                      No students
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* footer */}
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={loadStudents}
              className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm transition hover:bg-zinc-50 active:scale-[0.99]"
            >
              <RotateCcw size={16} /> Refresh students
            </button>
            <button
              type="submit"
              disabled={saving || !testDate || totalQ === 0}
              className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              {saving ? "Saving…" : "Save Test"}
            </button>
          </div>
        </motion.form>

        {/* RIGHT: recent tests (fixed height + scroll to match left) */}
        <motion.div
          className="rounded-2xl border bg-white p-4 shadow-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-base font-medium">Recent Tests</div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={recentMonth}
                onChange={(e) => setRecentMonth(e.target.value)}
                className="rounded border border-zinc-300 px-2 py-1 text-sm transition focus:ring-2 focus:ring-emerald-300"
                aria-label="Filter by month"
              />
              <select
                value={recentFilter}
                onChange={(e) => setRecentFilter(e.target.value as SectionKey | "ALL")}
                className="rounded border border-zinc-300 px-2 py-1 text-sm transition focus:ring-2 focus:ring-emerald-300"
                aria-label="Filter by section"
              >
                <option value="ALL">All sections</option>
                <option value="MAT">MAT</option>
                <option value="ENGLISH">ENGLISH</option>
                <option value="MATHS">MATHS</option>
              </select>
            </div>
          </div>

          <div className={`${fixedScrollCls} rounded border`}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50">
                <tr className="text-left text-zinc-600">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Section</th>
                  <th className="px-3 py-2">Total Q</th>
                  <th className="px-3 py-2 text-right">Entries</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingRecent ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">
                        <div className="h-3 w-28 animate-pulse rounded bg-zinc-200" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-3 w-16 animate-pulse rounded bg-zinc-200" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="ml-auto h-3 w-10 animate-pulse rounded bg-zinc-200" />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="ml-auto h-6 w-20 animate-pulse rounded bg-zinc-200" />
                      </td>
                    </tr>
                  ))
                ) : recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                      No tests found
                    </td>
                  </tr>
                ) : (
                  recent.map((t) => (
                    <tr key={t.id} className="border-t transition-colors hover:bg-zinc-50">
                      <td className="px-3 py-2">
                        {new Date(t.test_date + "T00:00:00").toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-3 py-2">{t.section}</td>
                      <td className="px-3 py-2">{t.total_questions ?? 0}</td>
                      <td className="px-3 py-2 text-right">{t.marks_count}</td>
                      <td className="px-3 py-2 text-right">
                        {confirmDeleteId === t.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition hover:bg-zinc-50 active:scale-[0.98]"
                            >
                              <X size={14} /> No
                            </button>
                            <button
                              onClick={() => doDelete(t.id)}
                              className="inline-flex items-center gap-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700 transition hover:bg-red-100 active:scale-[0.98]"
                            >
                              <Trash2 size={14} /> Yes, delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(t)}
                              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition hover:bg-zinc-50 active:scale-[0.98]"
                            >
                              <Pencil size={14} /> Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(t.id)}
                              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Edit panel */}
          <AnimatePresence>
            {editing && (
              <motion.div
                className="mt-3 rounded-xl border bg-white p-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <div className="mb-2 text-sm font-semibold">Edit test</div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <select
                    value={editDraft.section}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, section: e.target.value as SectionKey }))
                    }
                    className="rounded border border-zinc-300 px-3 py-2 text-sm transition focus:ring-2 focus:ring-emerald-300"
                  >
                    <option value="MAT">MAT</option>
                    <option value="ENGLISH">ENGLISH</option>
                    <option value="MATHS">MATHS</option>
                  </select>
                  <input
                    type="date"
                    value={editDraft.date}
                    onChange={(e) => setEditDraft((d) => ({ ...d, date: e.target.value }))}
                    className="rounded border border-zinc-300 px-3 py-2 text-sm transition focus:ring-2 focus:ring-emerald-300"
                  />
                  <input
                    inputMode="numeric"
                    value={editDraft.totalQStr}
                    onChange={(e) =>
                      setEditDraft((d) => ({
                        ...d,
                        totalQStr: e.target.value.replace(/[^\d]/g, ""),
                      }))
                    }
                    className="rounded border border-zinc-300 px-3 py-2 text-sm transition focus:ring-2 focus:ring-emerald-300"
                    placeholder="0"
                  />
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setEditing(null)}
                    className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm transition hover:bg-zinc-50 active:scale-[0.99]"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700 active:scale-[0.99]"
                  >
                    <Save size={16} /> Save
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
