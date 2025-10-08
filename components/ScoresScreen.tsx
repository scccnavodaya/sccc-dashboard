// components/ScoresScreen.tsx
"use client";

import React, { useMemo, useState } from "react";

import MonthPicker from "@/components/MonthPicker";
import DateDropdown from "@/components/DateDropdown";
import ChipBar, { ChipKey } from "@/components/ChipBar";
import SectionGrid, { SectionKey } from "@/components/SectionGrid";
import LatestExamTicker from "@/components/LatestExamTicker";

import { usePublicScores } from "@/hooks/usePublicScores";
import { usePublicStudents } from "@/hooks/usePublicStudents";
import { usePublicStats } from "@/hooks/usePublicStats";
import { usePublicNotices } from "@/hooks/usePublicNotices";

import { colorMap } from "@/components/Theme";

/** compute current IST month (YYYY-MM) */
function ymNowIST(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "2025";
  const m = parts.find((p) => p.type === "month")?.value ?? "09";
  return `${y}-${m}`;
}

type SubjectKey = "MAT" | "ENGLISH" | "MATHS";

/** Safe utility: try extract numeric score (number) or return "Present" marker or null.
 *  Returns number | "Present" | null
 */
function extractScoreFromMark(m: any): number | "Present" | null {
  if (!m) return null;

  // check common numeric fields
  const numericCandidates = [
    "score",
    "marks",
    "mark",
    "obtained",
    "marks_obtained",
    "obt",
    "obtained_marks",
    "points",
    "value",
  ];
  for (const key of numericCandidates) {
    if (m[key] != null) {
      const raw = m[key];
      const n = Number(typeof raw === "string" ? raw.replace(/[, ]+/g, "") : raw);
      if (Number.isFinite(n)) return n;
    }
  }

  // nested numeric shapes
  if (m.score && typeof m.score === "object") {
    const n = Number(m.score.value ?? m.score.marks ?? m.score.obtained ?? m.score);
    if (Number.isFinite(n)) return n;
  }
  if (m.marks && typeof m.marks === "object") {
    const n = Number(m.marks.obtained ?? m.marks.value ?? m.marks.total);
    if (Number.isFinite(n)) return n;
  }

  // detect present-like values in `status` or similar fields and normalize to "Present"
  const statusRaw = m.status ?? m.state ?? m.attendance ?? m.present ?? m.flag ?? "";
  let status = "";
  if (typeof statusRaw === "string") status = statusRaw.trim().toLowerCase();
  else if (statusRaw === true || statusRaw === 1) status = "present";

  const presentVariants = ["pass", "present", "attended", "p", "presented", "yes", "true"];
  if (status && presentVariants.includes(status)) return "Present";

  return null;
}

/** Friendly date formatting helper */
function fmtDateLabel(d?: string | null) {
  if (!d) return null;
  try {
    const dt = new Date(d);
    if (!Number.isFinite(dt.getTime())) return null;
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: undefined });
  } catch {
    return null;
  }
}

export default function ScoresScreen(): React.ReactElement {
  // UI state
  const [month, setMonth] = useState<string>(() => ymNowIST());
  const [subject, setSubject] = useState<ChipKey>("MAT");
  const [dateOpt, setDateOpt] = useState<string>("ALL");

  // Data hooks (reuse your existing hooks)
  const { tests = [], marks = [] } = usePublicScores(month) as any;
  const { students = [] } = usePublicStudents() as any;
  const { stats: publicStats } = usePublicStats(month) as any;
  // keep existing notices hook but do NOT pass those objects into the ticker
  const { notices = [] } = usePublicNotices() as any;

  // Build small summary numbers
  const totalStudents = Array.isArray(students) ? students.length : 0;

  // Determine subjectKey safely
  const subjectKey: SubjectKey =
    subject === "MAT" || subject === "ENGLISH" || subject === "MATHS"
      ? (subject as SubjectKey)
      : "MAT";

  // Subject-specific tests
  const subjectTests = useMemo(() => {
    return (tests || []).filter((t: any) => String(t.section ?? "MAT").toUpperCase() === subjectKey);
  }, [tests, subjectKey]);

  // Date options for DateDropdown
  const dateOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "ALL", label: "Latest test" }];
    for (const t of subjectTests) {
      const testDateRaw = String(t.test_date ?? t.testDate ?? t.exam_date ?? "");
      const label = testDateRaw
        ? new Date(testDateRaw + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit" })
        : (t.title ?? t.name ?? "—");
      opts.push({ value: String(t.id), label });
    }
    return opts;
  }, [subjectTests]);

  // Resolve selected test id: if dateOpt === "ALL" -> latest test id
  const selectedTestId = useMemo(() => {
    if (dateOpt && dateOpt !== "ALL") return dateOpt;
    const sorted = [...subjectTests].sort((a: any, b: any) => {
      const da = new Date(String(a.test_date ?? a.testDate ?? a.exam_date ?? "")).getTime() || 0;
      const db = new Date(String(b.test_date ?? b.testDate ?? b.exam_date ?? "")).getTime() || 0;
      return db - da;
    });
    return sorted.length ? String(sorted[0].id) : null;
  }, [dateOpt, subjectTests]);

  // Find selected test object (for label, max marks, friendly display)
  const selectedTest = useMemo(() => {
    if (!selectedTestId) return null;
    return (subjectTests || []).find((t: any) => String(t.id) === String(selectedTestId)) ?? null;
  }, [subjectTests, selectedTestId]);

  // Build a friendly test label to show in header
  const testLabel = useMemo(() => {
    if (!selectedTest) return null;
    const t = selectedTest as any;
    // prefer useful textual fields
    const candidates = [t.title, t.name, t.test_name, t.label];
    for (const c of candidates) {
      if (c && String(c).trim()) return String(c).trim();
    }
    // try date fields
    const dateCandidate = t.test_date ?? t.testDate ?? t.exam_date ?? t.release_at ?? t.created_at;
    const formatted = fmtDateLabel(String(dateCandidate ?? ""));
    if (formatted) return formatted;
    // fallback to short id (keep 8 chars) so it's less ugly
    const id = String(t.id ?? "");
    return id ? `${id.slice(0, 8)}…` : null;
  }, [selectedTest]);

  // Present count for selected test (present = numeric score OR "Present" status)
  const presentCount = useMemo(() => {
    const isPresentMark = (m: any) => {
      const sc = extractScoreFromMark(m);
      return sc === "Present" || (typeof sc === "number" && Number.isFinite(sc));
    };

    if (!selectedTestId) {
      const ids = new Set(
        (marks || [])
          .filter((m: any) => subjectTests.some((t: any) => String(t.id) === String(m.test_id)) && isPresentMark(m))
          .map((m: any) => String(m.student_id))
      );
      return ids.size;
    }
    const ids = new Set(
      (marks || [])
        .filter((m: any) => String(m.test_id) === String(selectedTestId) && isPresentMark(m))
        .map((m: any) => String(m.student_id))
    );
    return ids.size;
  }, [marks, selectedTestId, subjectTests]);

  // Tests count shown (for this subject)
  const testsCount = subjectTests.length;

  // Build rows for SectionGrid (one row per student)
  const rows = useMemo(() => {
    const testId = selectedTestId;
    const subjectTestIds = new Set(subjectTests.map((t: any) => String(t.id)));
    return (students || []).map((s: any) => {
      const id = String(s.id ?? "");
      const row: any = { id, name: s.name ?? s.full_name ?? "—", photo: s.photo ?? null };

      // normalize status for this student/test
      let statusVal: string | null = null;

      if (testId) {
        const mm = (marks || []).find((m: any) => String(m.test_id) === String(testId) && String(m.student_id) === id);
        const extracted = extractScoreFromMark(mm);

        // If numeric, set numeric; if "Present" set Present string, else null
        const scoreVal = typeof extracted === "number" ? extracted : extracted === "Present" ? "Present" : null;

        // status normalization: prefer extracted "Present", otherwise try mm.status directly
        if (extracted === "Present") statusVal = "Present";
        else if (mm && mm.status) {
          const sraw = String(mm.status).trim().toLowerCase();
          if (["pass", "present", "attended", "p", "presented", "yes"].includes(sraw)) statusVal = "Present";
          else statusVal = mm.status;
        }

        if (subjectKey === "MAT") row.mat = scoreVal;
        if (subjectKey === "ENGLISH") row.eng = scoreVal;
        if (subjectKey === "MATHS") row.maths = scoreVal;
      } else {
        const last = [...marks]
          .reverse()
          .find(
            (m: any) =>
              String(m.student_id) === id &&
              subjectTestIds.has(String(m.test_id)) &&
              (extractScoreFromMark(m) !== null)
          );

        const extracted = last ? extractScoreFromMark(last) : null;
        const val = typeof extracted === "number" ? extracted : extracted === "Present" ? "Present" : null;

        if (extracted === "Present") statusVal = "Present";
        else if (last && last.status) {
          const sraw = String(last.status).trim().toLowerCase();
          if (["pass", "present", "attended", "p", "presented", "yes"].includes(sraw)) statusVal = "Present";
          else statusVal = last.status;
        }

        if (subjectKey === "MAT") row.mat = val;
        if (subjectKey === "ENGLISH") row.eng = val;
        if (subjectKey === "MATHS") row.maths = val;
      }

      // attach normalized status to the row (SectionGrid can show this)
      row.status = statusVal;

      return row;
    });
  }, [students, marks, selectedTestId, subjectKey, subjectTests]);

  // compute max score for grid from selected test if present
  function fullMarksForTest(t: any): number | null {
    if (!t) return null;
    const candidates = [t.max_marks, t.maxMarks, t.max_score, t.full_marks, t.fullMarks, t.total_marks];
    for (const c of candidates) {
      const n = Number(c);
      if (Number.isFinite(n) && n > 0) return n;
    }
    const tq = Number(t.total_questions ?? t.questions ?? t.totalQuestions ?? t.total_q);
    let mpq = Number(t.marks_per_question ?? t.mark_per_question ?? t.mpq);
    if (Number.isFinite(tq) && tq > 0) {
      if (!Number.isFinite(mpq) || mpq <= 0) mpq = 1.25;
      return tq * mpq;
    }
    return null;
  }
  const maxScoreForGrid = useMemo(() => {
    if (!selectedTestId) return 50;
    const t = (subjectTests || []).find((x: any) => String(x.id) === String(selectedTestId));
    return t ? (fullMarksForTest(t) ?? 50) : 50;
  }, [subjectTests, selectedTestId]);

  // Only include the three subject tabs for ChipBar
  const colorByKey = {
    MAT: { pill: colorMap.MAT.pill, text: colorMap.MAT.text },
    ENGLISH: { pill: colorMap.ENGLISH.pill, text: colorMap.ENGLISH.text },
    MATHS: { pill: colorMap.MATHS.pill, text: colorMap.MATHS.text },
  } as any;

  // Theme accent for subject
  const theme = colorMap[(subject === "MAT" || subject === "ENGLISH" || subject === "MATHS") ? subject : "MAT"];

  return (
    <div className="w-full min-h-full flex flex-col items-stretch gap-3">
      {/* --- Ticker + small stats --- */}
      <div className="rounded-2xl border bg-white p-3 flex items-center gap-3">
        <div className="text-xs font-semibold text-zinc-700 shrink-0">New</div>

        {/* LatestExamTicker now fetches exact exam ticker endpoint itself.
            This avoids passing the media 'notices' array (which is a different dataset). */}
        <div className="flex-1 overflow-hidden">
          <LatestExamTicker fetchUrl="/api/exam-ticker" textColorClass="text-blue-600" />
        </div>

        {/* small summary pills (Present / Students / Tests) */}
        <div className="flex gap-3 items-center ml-2">
          <div className="text-xs text-zinc-600 text-center">
            <div className="text-[13px] font-semibold text-zinc-800">{totalStudents}</div>
            <div className="text-[10px]">Students</div>
          </div>
          <div className="text-xs text-zinc-600 text-center">
            <div className="text-[13px] font-semibold text-zinc-800">{presentCount}</div>
            <div className="text-[10px]">Present</div>
          </div>
          <div className="text-xs text-zinc-600 text-center">
            <div className="text-[13px] font-semibold text-zinc-800">{testsCount}</div>
            <div className="text-[10px]">Tests</div>
          </div>
        </div>
      </div>

      {/* --- Controls: subject tabs + month picker + date dropdown --- */}
      <div className="flex flex-col gap-2">
        <div>
          <ChipBar
            active={(subject as ChipKey)}
            onChange={(k: ChipKey) => {
              setSubject(k);
              setDateOpt("ALL");
            }}
            colorByKey={colorByKey}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-36">
            <MonthPicker value={month} onChange={(ym) => { setMonth(ym); setDateOpt("ALL"); }} />
          </div>
          <div className="flex-1">
            <DateDropdown label="Date" value={dateOpt} onChange={setDateOpt} options={dateOptions} />
          </div>
        </div>
      </div>

      {/* --- Marks table area: fixed-sized scroll area (only this scrolls) --- */}
      <div className="rounded-2xl border bg-white p-3 flex flex-col min-h-0">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Scores — {subjectKey}</div>
          {/* Render friendly test label (title/date/short id) instead of full UUID */}
          <div className={`text-[11px] ${theme.text}`}>
            {selectedTest ? `Test: ${testLabel ?? selectedTestId}` : "Latest available"}
          </div>
        </div>

        {/* Constrained height — roughly shows ~6 rows before scrolling */}
        <div className="overflow-y-auto" style={{ maxHeight: "36vh" }}>
          <SectionGrid
            mode="section"
            section={subjectKey as SectionKey}
            students={rows}
            fixedBodyHeightClass="h-full"
            maxScore={maxScoreForGrid}
            accentClass={`${theme.pill} ${theme.text}`}
          />
        </div>
      </div>

      {/* --- small inline footer for screen --- */}
      <div className="text-xs text-zinc-500 text-center">
        change date to view scores for a specific exam. Top rows visible; scroll inside the list to see more.
      </div>
    </div>
  );
}
