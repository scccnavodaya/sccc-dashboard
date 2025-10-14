// components/ScoresScreen.tsx
"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import MonthPicker from "@/components/MonthPicker";
import DateDropdown from "@/components/DateDropdown";
import ChipBar, { ChipKey } from "@/components/ChipBar";
import SectionGrid, { SectionKey } from "@/components/SectionGrid";
// ✅ render ticker only on the client to avoid hydration mismatches
const LatestExamTicker = dynamic(() => import("@/components/LatestExamTicker"), {
  ssr: false,
  loading: () => <div className="text-xs text-zinc-400">Loading…</div>,
});

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

/** Safe utility: try extract numeric score (number) or return "Present" marker or null. */
function extractScoreFromMark(m: any): number | "Present" | null {
  if (!m) return null;

  // numeric fields
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

  // nested shapes
  if (m.score && typeof m.score === "object") {
    const n = Number(m.score.value ?? m.score.marks ?? m.score.obtained ?? m.score);
    if (Number.isFinite(n)) return n;
  }
  if (m.marks && typeof m.marks === "object") {
    const n = Number(m.marks.obtained ?? m.marks.value ?? m.marks.total);
    if (Number.isFinite(n)) return n;
  }

  // status normalization
  const statusRaw = m.status ?? m.state ?? m.attendance ?? m.present ?? m.flag ?? "";
  let status = "";
  if (typeof statusRaw === "string") status = statusRaw.trim().toLowerCase();
  else if (statusRaw === true || statusRaw === 1) status = "present";

  const presentVariants = ["pass", "present", "attended", "p", "presented", "yes", "true"];
  if (status && presentVariants.includes(status)) return "Present";

  return null;
}

/** Friendly date formatting helper (force UTC for SSR/CSR parity) */
function fmtDateLabel(d?: string | null) {
  if (!d) return null;
  try {
    const dt = new Date(d);
    if (!Number.isFinite(dt.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    }).format(dt);
  } catch {
    return null;
  }
}

export default function ScoresScreen(): React.ReactElement {
  // UI state
  const [month, setMonth] = useState<string>(() => ymNowIST());
  const [subject, setSubject] = useState<ChipKey>("MAT");
  const [dateOpt, setDateOpt] = useState<string>("ALL");

  // Data hooks
  const { tests = [], marks = [] } = usePublicScores(month) as any;
  const { students = [] } = usePublicStudents() as any;
  const { stats: publicStats } = usePublicStats(month) as any;
  const { notices = [] } = usePublicNotices() as any;

  // Build small summary numbers
  const totalStudents = Array.isArray(students) ? students.length : 0;

  // Determine subjectKey safely
  const subjectKey: SubjectKey =
    subject === "MAT" || subject === "ENGLISH" || subject === "MATHS" ? (subject as SubjectKey) : "MAT";

  // Subject-specific tests
  const subjectTests = useMemo(() => {
    return (tests || []).filter((t: any) => String(t.section ?? "MAT").toUpperCase() === subjectKey);
  }, [tests, subjectKey]);

  // Fast lookup
  const testsById = useMemo(() => {
    const map = new Map<string, any>();
    for (const t of subjectTests) map.set(String(t.id), t);
    return map;
  }, [subjectTests]);

  // Date options for DateDropdown (force UTC for deterministic SSR/CSR)
  const dateOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [{ value: "ALL", label: "Latest test" }];
    for (const t of subjectTests) {
      const testDateRaw = String(t.test_date ?? t.testDate ?? t.exam_date ?? "");
      const label = testDateRaw
        ? new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }).format(
            new Date(testDateRaw + "T00:00:00Z")
          )
        : (t.title ?? t.name ?? "—");
      opts.push({ value: String(t.id), label });
    }
    return opts;
  }, [subjectTests]);

  // Resolve selected test id
  const selectedTestId = useMemo(() => {
    if (dateOpt && dateOpt !== "ALL") return dateOpt;
    const sorted = [...subjectTests].sort((a: any, b: any) => {
      const da = new Date(String(a.test_date ?? a.testDate ?? a.exam_date ?? "")).getTime() || 0;
      const db = new Date(String(b.test_date ?? b.testDate ?? b.exam_date ?? "")).getTime() || 0;
      return db - da;
    });
    return sorted.length ? String(sorted[0].id) : null;
  }, [dateOpt, subjectTests]);

  // Find selected test object
  const selectedTest = useMemo(() => {
    if (!selectedTestId) return null;
    return (subjectTests || []).find((t: any) => String(t.id) === String(selectedTestId)) ?? null;
  }, [subjectTests, selectedTestId]);

  // Build a friendly test label
  const testLabel = useMemo(() => {
    if (!selectedTest) return null;
    const t = selectedTest as any;
    const candidates = [t.title, t.name, t.test_name, t.label];
    for (const c of candidates) if (c && String(c).trim()) return String(c).trim();
    const dateCandidate = t.test_date ?? t.testDate ?? t.exam_date ?? t.release_at ?? t.created_at;
    const formatted = fmtDateLabel(String(dateCandidate ?? ""));
    if (formatted) return formatted;
    const id = String(t.id ?? "");
    return id ? `${id.slice(0, 8)}…` : null;
  }, [selectedTest]);

  // --- helpers: read test totals ---
  const readTotalQuestions = (t: any): number | null => {
    const candidates = [t?.total_questions, t?.questions, t?.totalQuestions, t?.total_q];
    for (const v of candidates) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  };
  const readMpq = (t: any): number | null => {
    const candidates = [t?.marks_per_question, t?.mark_per_question, t?.mpq];
    for (const v of candidates) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  };
  const readTotalMarks = (t: any): number | null => {
    const candidates = [t?.total_marks, t?.totalMarks, t?.max_marks, t?.full_marks];
    for (const v of candidates) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  };

  /** compute full marks for a given test (denominator) — ALWAYS Q × MPQ (derive MPQ from total_marks if needed) */
  function fullMarksForTest(t: any): number {
    if (!t) return 0;
    const Q = readTotalQuestions(t) ?? 0;
    if (!(Number.isFinite(Q) && Q > 0)) return 0;

    const mpqExplicit = readMpq(t);
    if (Number.isFinite(mpqExplicit as number) && (mpqExplicit as number) > 0) {
      return Q * (mpqExplicit as number);
    }

    // derive MPQ if explicit is absent
    const tm = readTotalMarks(t);
    const mpqDerived = Number.isFinite(tm as number) && (tm as number) > 0 ? (tm as number) / Q : 0;

    return mpqDerived > 0 ? Q * mpqDerived : 0;
  }

  /** compute student score from mark + test:
   * 1) numeric score wins
   * 2) else if wrong provided -> (Q - wrong) * mpq (mpq explicit or derived)
   * 3) else if present -> Q * mpq
   * 4) else null
   */
  function computeStudentScore(mark: any, test: any): number | null {
    if (!mark || !test) return null;

    // 1) numeric score
    const extracted = extractScoreFromMark(mark);
    if (typeof extracted === "number") return extracted;

    const Q = readTotalQuestions(test);
    if (!Number.isFinite(Q as number) || (Q as number) <= 0) return null;

    // resolve MPQ: explicit or derived from total_marks/Q
    const mpqExplicit = readMpq(test);
    const tm = readTotalMarks(test);
    const MPQ =
      (Number.isFinite(mpqExplicit as number) && (mpqExplicit as number) > 0)
        ? (mpqExplicit as number)
        : (Number.isFinite(tm as number) && (tm as number) > 0 ? (tm as number) / (Q as number) : 0);

    // 2) from wrong
    const wrongRaw = Number(mark.wrong ?? mark.wrongs ?? mark.incorrect);
    if (Number.isFinite(wrongRaw) && MPQ > 0) {
      const wrong = Math.max(0, Math.min(wrongRaw, Q as number));
      return Math.max(0, ((Q as number) - wrong) * MPQ);
    }

    // 3) present -> full marks
    if (extracted === "Present" && MPQ > 0) return (Q as number) * MPQ;

    return null;
  }

  /** denominator for the grid (selected test only) */
  const maxScoreForGrid = useMemo(() => {
    if (!selectedTestId) return 0;
    const t = testsById.get(String(selectedTestId));
    return fullMarksForTest(t);
  }, [selectedTestId, testsById]);

  // Present count: numeric score OR "Present" OR has a numeric wrong (treated as present)
  const presentCount = useMemo(() => {
    const isPresentMark = (m: any) => {
      const sc = extractScoreFromMark(m);
      if (sc === "Present" || (typeof sc === "number" && Number.isFinite(sc))) return true;
      const wrong = Number(m?.wrong ?? m?.wrongs ?? m?.incorrect);
      return Number.isFinite(wrong);
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

  // Tests count
  const testsCount = useMemo(() => subjectTests.length, [subjectTests]);

  // Build rows for SectionGrid
  const rows = useMemo(() => {
    const testId = selectedTestId;
    const subjectTestIds = new Set(subjectTests.map((t: any) => String(t.id)));

    return (students || []).map((s: any) => {
      const id = String(s.id ?? "");
      const row: any = { id, name: s.name ?? s.full_name ?? "—", photo: s.photo ?? null };

      let statusVal: string | null = null;

      if (testId) {
        const mm = (marks || []).find((m: any) => String(m.test_id) === String(testId) && String(m.student_id) === id);
        const t = testsById.get(String(testId));

        let numeric: number | null = null;
        if (mm && t) {
          numeric = computeStudentScore(mm, t);

          // status normalization
          const ex = extractScoreFromMark(mm);
          if (!numeric && ex === "Present") statusVal = "Present";
          if (!statusVal && mm && mm.status) {
            const sraw = String(mm.status).trim().toLowerCase();
            if (["pass", "present", "attended", "p", "presented", "yes"].includes(sraw)) statusVal = "Present";
            else if (["absent", "a", "no", "false"].includes(sraw)) statusVal = "Absent";
            else statusVal = mm.status;
          }
        }

        const scoreVal = numeric != null ? numeric : statusVal === "Present" ? (t ? fullMarksForTest(t) : null) : null;

        if (subjectKey === "MAT") row.mat = scoreVal;
        if (subjectKey === "ENGLISH") row.eng = scoreVal;
        if (subjectKey === "MATHS") row.maths = scoreVal;
      } else {
        // latest across subject tests
        const last = [...marks]
          .reverse()
          .find(
            (m: any) =>
              String(m.student_id) === id &&
              subjectTestIds.has(String(m.test_id)) &&
              (extractScoreFromMark(m) !== null || m?.wrong != null)
          );

        let val: number | "Present" | null = null;
        if (last) {
          const t = testsById.get(String(last.test_id));
          if (t) {
            const numeric = computeStudentScore(last, t);
            if (numeric != null) {
              val = numeric;
            } else {
              const ex = extractScoreFromMark(last);
              if (ex === "Present") val = (t ? fullMarksForTest(t) : "Present");
            }
            if (!statusVal && last && last.status) {
              const sraw = String(last.status).trim().toLowerCase();
              if (["pass", "present", "attended", "p", "presented", "yes"].includes(sraw)) statusVal = "Present";
              else if (["absent", "a", "no", "false"].includes(sraw)) statusVal = "Absent";
              else statusVal = last.status;
            }
          }
        }

        if (subjectKey === "MAT") row.mat = val;
        if (subjectKey === "ENGLISH") row.eng = val;
        if (subjectKey === "MATHS") row.maths = val;
      }

      row.status = statusVal;
      return row;
    });
  }, [students, marks, selectedTestId, subjectKey, subjectTests, testsById]);

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
            <MonthPicker
              value={month}
              onChange={(ym) => {
                setMonth(ym);
                setDateOpt("ALL");
              }}
            />
          </div>
          <div className="flex-1">
            <DateDropdown label="Date" value={dateOpt} onChange={setDateOpt} options={dateOptions} />
          </div>
        </div>
      </div>

      {/* --- Marks table area --- */}
      <div className="rounded-2xl border bg-white p-3 flex flex-col min-h-0">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Scores — {subjectKey}</div>
          <div className={`text-[11px] ${theme.text}`}>
            {selectedTest ? `Test: ${testLabel ?? selectedTestId}` : "Latest available"}
          </div>
        </div>

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

      <div className="text-xs text-zinc-500 text-center">
        change date to view scores for a specific exam. Top rows visible; scroll inside the list to see more.
      </div>
    </div>
  );
}
