// components/LeaderboardScreen.tsx
"use client";

import React, { useMemo } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import MonthPicker from "@/components/MonthPicker";
import MonthRibbon from "@/components/MonthRibbon";
import { usePublicStats } from "@/hooks/usePublicStats";
import { usePublicStudents } from "@/hooks/usePublicStudents";
import { usePublicScores } from "@/hooks/usePublicScores";
import { colorMap } from "@/components/Theme";

/** compute current IST month string (YYYY-MM) — same helper used elsewhere */
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

/**
 * LeaderboardScreen
 * - compact header + month picker
 * - leaderboard rows area is the only scrollable region (max-height tuned to show ~8 rows)
 * - designed to fit inside the app card (no page-level scroll)
 */
export default function LeaderboardScreen(): React.ReactElement {
  const [month, setMonth] = React.useState<string>(() => ymNowIST());

  // Fetch public data (pass month where required)
  const { stats } = usePublicStats(month);
  const { students } = usePublicStudents();
  const { tests, marks } = usePublicScores(month);

  // derive counts for ribbon badges (safe guards for non-array)
  const testsCount = Array.isArray(tests) ? tests.length : 0;
  const matCount = (tests || []).filter((t: any) => String(t.section ?? "").toUpperCase() === "MAT").length;
  const engCount = (tests || []).filter((t: any) => String(t.section ?? "").toUpperCase() === "ENGLISH").length;
  const mathsCount = (tests || []).filter((t: any) => String(t.section ?? "").toUpperCase() === "MATHS").length;

  // Normalize students -> LeaderboardTable student shape
  const lbStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.map((s: any) => ({
      id: String(s.id),
      name: s.name ?? s.full_name ?? s.displayName ?? "—",
      photo: s.photo ?? null,
    }));
  }, [students]);

  // Normalize tests -> expected Test shape (id, section, test_date/testDate)
  const lbTests = useMemo(() => {
    if (!Array.isArray(tests)) return [];
    return tests.map((t: any) => ({
      id: String(t.id),
      section: String(t.section ?? "MAT").toUpperCase(),
      test_date: String(t.test_date ?? t.testDate ?? ""),
      testDate: String(t.test_date ?? t.testDate ?? ""),
    }));
  }, [tests]);

  // Normalize marks -> expected Mark shape (testId, studentId, score)
  const lbMarks = useMemo(() => {
    if (!Array.isArray(marks)) return [];
    return marks.map((m: any) => ({
      testId: String(m.test_id ?? m.testId ?? m.testIdLocal ?? ""),
      studentId: String(m.student_id ?? m.studentId ?? m.sid ?? ""),
      score: typeof m.score === "number" ? m.score : (m.score != null ? Number(m.score) : undefined),
    }));
  }, [marks]);

  // Accent color from theme (use OVERALL for leaderboard)
  const accent = colorMap.OVERALL.text;

  return (
    <div className="h-full w-full flex flex-col items-stretch px-3 pt-2 pb-3"> 
      {/* compact ribbon (small vertical footprint) */}
      <div className="mb-1 w-full">
        <MonthRibbon
          month={month}
          testsCount={testsCount}
          matCount={matCount}
          engCount={engCount}
          mathsCount={mathsCount}
          accentClass={`${colorMap.OVERALL.gradientFrom} ${colorMap.OVERALL.gradientTo}`}
          textClass={colorMap.OVERALL.text}
        />
      </div>

      {/* month picker and small stats row (compact) */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="w-36">
          <MonthPicker value={month} onChange={(ym) => setMonth(ym)} />
        </div>

        <div className="flex-1 flex gap-2 justify-end">
          <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 flex items-center gap-2">
            <div className="text-[11px]">Students</div>
            <div className="font-semibold text-[13px]">{stats?.studentsTotal ?? "—"}</div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 flex items-center gap-2">
            <div className="text-[11px]">Tests</div>
            <div className="font-semibold text-[13px]">{testsCount}</div>
          </div>
        </div>
      </div>

      {/* Leaderboard header (very small) */}
      <div className="mb-1 px-1">
        <div className="text-sm font-semibold text-zinc-800">Overall Leaderboard — {month}</div>
        <div className="text-[11px] text-zinc-500">scroll for more</div>
      </div>

      {/* Leaderboard rows area — this is the ONLY scrollable region for marks */}
      <div
        className="w-full rounded-2xl border border-zinc-200 bg-white overflow-hidden"
        style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {/* We set a maxHeight to approximate 8 rows visible. Adjust if your row height differs. */}
        <div
          className="overflow-y-auto pr-2"
          style={{
            // prefer a viewport relative clamp but ensure not too tall inside the app-card:
            maxHeight: "360px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <LeaderboardTable students={lbStudents} tests={lbTests} marks={lbMarks} accentClass={accent} />
        </div>
      </div>
    </div>
  );
}
