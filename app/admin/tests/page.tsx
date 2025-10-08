// app/admin/tests/page.tsx
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
  wrongStr: string;
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
  // form state (unchanged)
  const [section, setSection] = useState<SectionKey>("MAT");
  const [testDate, setTestDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [totalQStr, setTotalQStr] = useState<string>("0");
  const totalQ = useMemo(
    () => Math.max(0, parseInt((totalQStr || "0").trim(), 10) || 0),
    [totalQStr]
  );

  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // recent state (unchanged)
  const [recent, setRecent] = useState<RecentTest[]>([]);
  const [recentFilter, setRecentFilter] = useState<SectionKey | "ALL">("ALL");
  const [recentMonth, setRecentMonth] = useState<string>(() => ymNowIST());
  const [loadingRecent, setLoadingRecent] = useState(true);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<RecentTest | null>(null);
  const [editDraft, setEditDraft] = useState<{ section: SectionKey; date: string; totalQStr: string; }>( {
    section: "MAT",
    date: "",
    totalQStr: "0",
  });

  // UI: which vertical tab is active — "form" or "recent"
  const [activeTab, setActiveTab] = useState<"form" | "recent">("form");

  const presentCount = useMemo(() => rows.filter((r) => r.present).length, [rows]);
  const maxMarks = useMemo(() => totalQ * 1.25, [totalQ]);

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
    const cleaned = v.replace(/[^\d]/g, "");
    setRows((list) => list.map((r) => (r.student_id === id ? { ...r, wrongStr: cleaned } : r)));
  }

  function markAllPresent(v: boolean) {
    setRows((list) => list.map((r) => ({ ...r, present: v })));
  }

  async function revalidatePublic() {
    try {
      await fetch("/api/revalidate", { method: "POST" });
    } catch {}
  }

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
      if (recentMonth) params.set("month", recentMonth);
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
        total_questions: totalQ,
        marks: rows
          .filter((r) => r.present)
          .map((r) => ({
            student_id: r.student_id,
            wrong: parseAndClampWrong(r.wrongStr),
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

      setRows((list) => list.map((r) => ({ ...r, wrongStr: "0" })));

      // switch to recent after save (user expectation)
      setActiveTab("recent");
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

  // Responsive heights: generous on mobile, fixed on desktop
  const fixedScrollCls = "max-h-[60vh] md:h-[224px] overflow-y-auto";

  const rowVariants = {
    hidden: { opacity: 0, y: 4 },
    show: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  };

  // --- UI: vertical single-card layout with tab toggle ---
  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-4">
      <div className="rounded-2xl border bg-white p-3 sm:p-4 shadow-sm">
        {/* top bar: back + small title + quick stats */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-sm transition hover:bg-zinc-50 active:scale-[0.99]"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </Link>
            <h2 className="text-lg font-semibold">Tests</h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <ClipboardList size={14} />
            <span>{presentCount} present</span>
            <button
              onClick={loadStudents}
              className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition hover:bg-zinc-50"
              title="Refresh students"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Tabs toggle: New test | Recent */}
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={() => setActiveTab("form")}
            className={`rounded-full px-3 py-1 text-sm transition ${
              activeTab === "form" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
            aria-pressed={activeTab === "form"}
          >
            New test
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            className={`rounded-full px-3 py-1 text-sm transition ${
              activeTab === "recent" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
            aria-pressed={activeTab === "recent"}
          >
            Recent
          </button>
        </div>

        {/* banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              key={banner.msg}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`mb-3 rounded-md px-3 py-2 text-xs shadow-sm ${
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

        {/* Content area: show form or recent based on activeTab */}
        <div>
          {/* NEW TEST FORM */}
          <AnimatePresence initial={false} mode="wait">
            {activeTab === "form" && (
              <motion.form
                key="form"
                onSubmit={submit}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <label className="text-[11px] text-zinc-600">Section</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value as SectionKey)}
                      className="mt-1 w-full rounded border border-zinc-300 px-2.5 py-2 text-sm transition focus:ring-2 focus:ring-emerald-300"
                      aria-label="Test section"
                    >
                      <option value="MAT">MAT</option>
                      <option value="ENGLISH">ENGLISH</option>
                      <option value="MATHS">MATHS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-600">Test Date</label>
                    <div className="relative mt-1">
                      <input
                        type="date"
                        value={testDate}
                        onChange={(e) => setTestDate(e.target.value)}
                        className="w-full rounded border border-zinc-300 px-2.5 py-2 pr-8 text-sm transition focus:ring-2 focus:ring-emerald-300"
                      />
                      <Calendar className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-zinc-400" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-600">Total Questions</label>
                    <input
                      inputMode="numeric"
                      value={totalQStr}
                      onChange={(e) => setTotalQStr(e.target.value.replace(/[^\d]/g, ""))}
                      onFocus={() => { if (totalQStr === "0") setTotalQStr(""); }}
                      className="mt-1 w-full rounded border border-zinc-300 px-2.5 py-2 text-sm transition focus:ring-2 focus:ring-emerald-300"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-600">Enter wrong counts (each Q = 1.25)</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => markAllPresent(true)}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Mark all present
                    </button>
                    <button
                      type="button"
                      onClick={() => markAllPresent(false)}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Mark all absent
                    </button>
                  </div>
                </div>

                <div className={`${fixedScrollCls} rounded border overflow-x-auto`}>
                  <table className="w-full min-w-[520px] text-xs sm:text-sm">
                    <thead className="sticky top-0 bg-zinc-50">
                      <tr className="text-left text-zinc-600">
                        <th className="px-2 py-2 whitespace-nowrap">#</th>
                        <th className="px-2 py-2 whitespace-nowrap">Student</th>
                        <th className="px-2 py-2 whitespace-nowrap">Present</th>
                        <th className="px-2 py-2 whitespace-nowrap">Wrong</th>
                        <th className="px-2 py-2 text-right whitespace-nowrap">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => {
                        const wrong = parseAndClampWrong(r.wrongStr);
                        const score = r.present ? Math.max(0, (totalQ - wrong) * 1.25) : 0;
                        const stu = students.find((s) => s.id === r.student_id);
                        return (
                          <tr key={r.student_id} className="border-t hover:bg-zinc-50">
                            <td className="px-2 py-2">{i + 1}</td>
                            <td className="px-2 py-2">
                              <div className="flex items-center gap-2">
                                <img src={buildPhotoUrl(stu)} alt={r.name} className="h-7 w-7 rounded-full border object-cover" />
                                <span className="font-medium truncate max-w-[160px]">{r.name}</span>
                              </div>
                            </td>
                            <td className="px-2 py-2">
                              <input type="checkbox" checked={r.present} onChange={() => togglePresent(r.student_id)} />
                            </td>
                            <td className="px-2 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                disabled={!r.present}
                                value={r.wrongStr}
                                onChange={(e) => setWrongStr(r.student_id, e.target.value)}
                                className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-2 text-right font-semibold">
                              {r.present ? `${fmt(score)}/${fmt(maxMarks)}` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">No students</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-xs text-zinc-500">Press Save to publish</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadStudents}
                      className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !testDate || totalQ === 0}
                      className="inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
                    >
                      <CheckCircle2 size={14} />
                      {saving ? "Saving…" : "Save Test"}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* RECENT LIST */}
          <AnimatePresence initial={false} mode="wait">
            {activeTab === "recent" && (
              <motion.div
                key="recent"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">Recent Tests</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="month"
                      value={recentMonth}
                      onChange={(e) => setRecentMonth(e.target.value)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs"
                    />
                    <select
                      value={recentFilter}
                      onChange={(e) => setRecentFilter(e.target.value as SectionKey | "ALL")}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs"
                    >
                      <option value="ALL">All sections</option>
                      <option value="MAT">MAT</option>
                      <option value="ENGLISH">ENGLISH</option>
                      <option value="MATHS">MATHS</option>
                    </select>
                  </div>
                </div>

                <div className={`${fixedScrollCls} rounded border overflow-x-auto`}>
                  <table className="w-full min-w-[520px] text-xs sm:text-sm">
                    <thead className="sticky top-0 bg-zinc-50">
                      <tr className="text-left text-zinc-600">
                        <th className="px-2 py-2 whitespace-nowrap">Date</th>
                        <th className="px-2 py-2 whitespace-nowrap">Section</th>
                        <th className="px-2 py-2 whitespace-nowrap">Total Q</th>
                        <th className="px-2 py-2 text-right whitespace-nowrap">Entries</th>
                        <th className="px-2 py-2 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingRecent ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2"><div className="h-3 w-28 animate-pulse rounded bg-zinc-200" /></td>
                            <td className="px-3 py-2"><div className="h-3 w-20 animate-pulse rounded bg-zinc-200" /></td>
                            <td className="px-3 py-2"><div className="h-3 w-16 animate-pulse rounded bg-zinc-200" /></td>
                            <td className="px-3 py-2 text-right"><div className="ml-auto h-3 w-10 animate-pulse rounded bg-zinc-200" /></td>
                            <td className="px-3 py-2 text-right"><div className="ml-auto h-6 w-20 animate-pulse rounded bg-zinc-200" /></td>
                          </tr>
                        ))
                      ) : recent.length === 0 ? (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-zinc-500">No tests found</td></tr>
                      ) : (
                        recent.map((t) => (
                          <tr key={t.id} className="border-t hover:bg-zinc-50">
                            <td className="px-3 py-2 whitespace-nowrap">{new Date(t.test_date + "T00:00:00").toLocaleDateString("en-IN")}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{t.section}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{t.total_questions ?? 0}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">{t.marks_count}</td>
                            <td className="px-3 py-2 text-right">
                              {confirmDeleteId === t.id ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => setConfirmDeleteId(null)} className="rounded border px-2 py-1 text-xs">No</button>
                                  <button onClick={() => doDelete(t.id)} className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">Yes, delete</button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => openEdit(t)} className="rounded border px-2 py-1 text-xs">Edit</button>
                                  <button onClick={() => setConfirmDeleteId(t.id)} className="rounded border px-2 py-1 text-xs text-red-600">Delete</button>
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
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-3 rounded-xl border bg-white p-3">
                      <div className="mb-2 text-sm font-semibold">Edit test</div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <select value={editDraft.section} onChange={(e) => setEditDraft((d) => ({ ...d, section: e.target.value as SectionKey }))} className="rounded border border-zinc-300 px-3 py-2 text-sm">
                          <option value="MAT">MAT</option>
                          <option value="ENGLISH">ENGLISH</option>
                          <option value="MATHS">MATHS</option>
                        </select>
                        <input type="date" value={editDraft.date} onChange={(e) => setEditDraft((d) => ({ ...d, date: e.target.value }))} className="rounded border border-zinc-300 px-3 py-2 text-sm" />
                        <input inputMode="numeric" value={editDraft.totalQStr} onChange={(e) => setEditDraft((d) => ({ ...d, totalQStr: e.target.value.replace(/[^\d]/g, "") }))} className="rounded border border-zinc-300 px-3 py-2 text-sm" placeholder="0" />
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm">Cancel</button>
                        <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">Save</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
