// app/(public)/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NoticeCarousel from "@/components/NoticeCarousel";
import SectionGrid, { SectionKey } from "@/components/SectionGrid";
import StatCards from "@/components/StatCards";
import Leaderboard from "@/components/LeaderboardTable";
import { GradientBackground, colorMap, TabKey } from "@/components/Theme";
import ChipBar, { ChipKey } from "@/components/ChipBar";
import DateDropdown from "@/components/DateDropdown";
import Link from "next/link";
import Header from "@/components/Header";
import AdminDrawer from "@/components/AdminDrawer";
import { LatestExamItem } from "@/components/LatestExamTicker";
import { usePublicStats } from "@/hooks/usePublicStats";
import { usePublicStudents } from "@/hooks/usePublicStudents";
import { usePublicScores, PublicTest } from "@/hooks/usePublicScores";
import { usePublicNotices, PublicNotice } from "@/hooks/usePublicNotices";

type Section = "MAT" | "ENGLISH" | "MATHS";

/** Helpers */
function ymNowIST() {
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
function labelForDate(isoDate: string) {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export default function HomePage() {
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<"login" | "reset">("login");

  const [section, setSection] = useState<ChipKey>("OVERALL");
  const activeTheme =
    colorMap[(section === "FEEDBACK" ? "OVERALL" : section) as TabKey];

  const [month, setMonth] = useState<string>(() => ymNowIST());
  const [dateOpt, setDateOpt] = useState<string>("ALL");

  const { stats: liveStats } = usePublicStats(month);
  const { students: liveStudents } = usePublicStudents();
  const { tests: liveTests, marks: liveMarks } = usePublicScores(month);
  const { notices: liveNotices } = usePublicNotices();

  // Live exam ticker (header)
  const [examTexts, setExamTexts] = useState<LatestExamItem[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/exam-ticker/latest", { cache: "no-store" });
        if (!r.ok) throw new Error("Failed to load exam ticker");
        const data = await r.json();
        if (alive && Array.isArray(data)) {
          setExamTexts(
            data.map((d: any) => ({
              id: String(d.id),
              text: String(d.text),
              startAt: d.start_at || d.startAt || new Date().toISOString(),
            }))
          );
        }
      } catch {}
    })();
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/exam-ticker/latest", { cache: "no-store" });
        const data = await r.json();
        if (alive && Array.isArray(data)) {
          setExamTexts(
            data.map((d: any) => ({
              id: String(d.id),
              text: String(d.text),
              startAt: d.start_at || d.startAt || new Date().toISOString(),
            }))
          );
        }
      } catch {}
    }, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const sectionForDropdown: Section | null =
    section === "MAT" || section === "ENGLISH" || section === "MATHS"
      ? (section as Section)
      : null;

  // Date options
  const dateOptionsBySection = useMemo(() => {
    type Opt = { value: string; label: string };
    const map: Record<Section, Opt[]> = {
      MAT: [{ value: "ALL", label: "All dates" }],
      ENGLISH: [{ value: "ALL", label: "All dates" }],
      MATHS: [{ value: "ALL", label: "All dates" }],
    };
    liveTests.forEach((t) => {
      map[t.section].push({ value: t.id, label: labelForDate(t.test_date) });
    });
    return map;
  }, [liveTests]);

  // Subject tests + helpers
  const subjectTests = useMemo(() => {
    if (!sectionForDropdown) return [] as PublicTest[];
    return liveTests.filter((t) => t.section === sectionForDropdown);
  }, [liveTests, sectionForDropdown]);

  const latestTest = useMemo(() => {
    if (!sectionForDropdown) return null;
    const rel = liveTests
      .filter((t) => t.section === sectionForDropdown)
      .sort(
        (a, b) =>
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
      );
    return rel[0] ?? null;
  }, [liveTests, sectionForDropdown]);

  const selectedTestId: string | null = useMemo(() => {
    if (!sectionForDropdown) return null;
    if (dateOpt === "ALL") return latestTest?.id ?? null;
    return dateOpt;
  }, [sectionForDropdown, dateOpt, latestTest]);

  const subjectTestIds = useMemo(
    () => new Set(subjectTests.map((t) => t.id)),
    [subjectTests]
  );

  const attendedSubject = useMemo(() => {
    if (!sectionForDropdown) return 0;
    const ids = new Set(
      liveMarks
        .filter((m) => subjectTestIds.has(m.test_id) && m.score != null)
        .map((m) => m.student_id)
    );
    return ids.size;
  }, [liveMarks, sectionForDropdown, subjectTestIds]);

  const attendedForSelectedTest = useMemo(() => {
    if (!sectionForDropdown || !selectedTestId) return null;
    const ids = new Set(
      liveMarks
        .filter((m) => m.test_id === selectedTestId && m.score != null)
        .map((m) => m.student_id)
    );
    return ids.size;
  }, [liveMarks, sectionForDropdown, selectedTestId]);

  const testsCountForCard = useMemo(() => {
    if (sectionForDropdown) return subjectTests.length;
    return liveTests.length;
  }, [sectionForDropdown, subjectTests.length, liveTests.length]);

  const noticeLiveCount = useMemo(
    () => (Array.isArray(liveNotices) ? liveNotices.length : 0),
    [liveNotices]
  );

  const attendedCard = useMemo(() => {
    if (!sectionForDropdown) {
      return {
        label: "Attended (month)",
        value: liveStats?.attendedInMonth ?? 0,
        sub: "present in ≥1 test",
      };
    }
    if (attendedForSelectedTest !== null) {
      return {
        label: "Attended (Test)",
        value: attendedForSelectedTest,
        sub: selectedTestId ? "present in selected test" : "no test",
      };
    }
    return {
      label: "Attended (Subject)",
      value: attendedSubject,
      sub: `present in ≥1 ${sectionForDropdown} test`,
    };
  }, [
    sectionForDropdown,
    attendedForSelectedTest,
    selectedTestId,
    attendedSubject,
    liveStats?.attendedInMonth,
  ]);

  const stats = [
    { label: "Students", value: liveStats?.studentsTotal ?? 0, sub: "total" },
    attendedCard,
    { label: "Tests this month", value: testsCountForCard },
    { label: "Notices Live", value: noticeLiveCount },
  ];

  // Leaderboard inputs
  const lbStudents = useMemo(
    () =>
      liveStudents.map((s) => ({ id: s.id, name: s.name, photo: s.photo })),
    [liveStudents]
  );
  const lbTests = useMemo(
    () =>
      liveTests.map((t) => ({
        id: t.id,
        section: t.section,
        testDate: t.test_date,
      })),
    [liveTests]
  );
  const lbMarks = useMemo(
    () =>
      liveMarks.map((m) => ({
        testId: m.test_id,
        studentId: m.student_id,
        score: m.score ?? undefined,
      })),
    [liveMarks]
  );

  // Build rows for SectionGrid (selected test or latest per-subject)
  const currentSectionRows = useMemo(() => {
    // shape expected by SectionGrid: id, name, photo, and optionally mat/eng/maths fields
    if (!sectionForDropdown) return [] as any[];

    // helper to gather marks per student for the selected test (if any)
    const rows = liveStudents.map((s) => {
      // find a mark entry for this student in the selected test (if selected)
      const markForSelected = selectedTestId
        ? liveMarks.find((m) => m.test_id === selectedTestId && m.student_id === s.id)
        : undefined;

      const row: any = {
        id: s.id,
        name: s.name,
        photo: s.photo ?? null,
      };

      // if selectedTestId present, only that field populated
      if (selectedTestId) {
        if (sectionForDropdown === "MAT") row.mat = markForSelected?.score ?? null;
        if (sectionForDropdown === "ENGLISH") row.eng = markForSelected?.score ?? null;
        if (sectionForDropdown === "MATHS") row.maths = markForSelected?.score ?? null;
      } else {
        // if no selected test, show student's latest available value for that section (if any)
        const lastForStudent = [...liveMarks]
          .reverse()
          .find((m) => m.student_id === s.id && m.score != null && subjectTestIds.has(m.test_id));
        const val = lastForStudent ? lastForStudent.score : null;
        if (sectionForDropdown === "MAT") row.mat = val;
        if (sectionForDropdown === "ENGLISH") row.eng = val;
        if (sectionForDropdown === "MATHS") row.maths = val;
      }
      return row;
    });

    return rows;
  }, [liveStudents, liveMarks, sectionForDropdown, selectedTestId, subjectTestIds]);

  // Full marks helper: attempt to derive full marks from test object, fallback to 50
  function fullMarksForTest(t: any): number | null {
    if (!t) return null;
    const fmCandidates = [
      t?.max_marks,
      t?.maxMarks,
      t?.max_score,
      t?.full_marks,
      t?.fullMarks,
      t?.total_marks,
    ];
    for (const c of fmCandidates) {
      const n = Number(c);
      if (Number.isFinite(n) && n > 0) return n;
    }
    const tq = Number(
      t?.total_questions ??
        t?.questions ??
        t?.totalQuestions ??
        t?.question_count ??
        t?.total_q
    );
    let mpq = Number(t?.marks_per_question ?? t?.mark_per_question ?? t?.mpq);
    if (Number.isFinite(tq) && tq > 0) {
      if (!Number.isFinite(mpq) || mpq <= 0) mpq = 1.25;
      return tq * mpq;
    }
    return null;
  }

  const maxScoreForGrid = useMemo(() => {
    if (!sectionForDropdown) return 50;
    if (!selectedTestId) return 50;
    const t = liveTests.find((x) => x.id === selectedTestId);
    const fm = t ? fullMarksForTest(t) : null;
    return fm ?? 50;
  }, [sectionForDropdown, selectedTestId, liveTests]);

  // Ensure NoticeCarousel receives properly typed items (NoticeItem)
  const noticesForCarousel = useMemo(() => {
    if (!Array.isArray(liveNotices)) return [];
    return liveNotices.map((n: PublicNotice) => ({
      id: String(n.id),
      type: (n.type === "video" ? "video" : "image") as "image" | "video",
      // title fallback order: n.title -> n.body -> "Notice"
      title: (n.title ?? (n as any).body ?? "Notice") as string,
      body: (n as any).body ?? undefined,
      src: (n as any).src ?? undefined,
      poster: (n as any).poster ?? null,
      // accept either `startAt` or `start_at`
      startAt: (n as any).startAt ?? (n as any).start_at ?? undefined,
    }));
  }, [liveNotices]);

  const CARD_CLASS =
    "rounded-2xl border bg-white p-3 flex flex-col min-w-0 " + activeTheme.border;

  return (
    <GradientBackground
      tab={(section === "FEEDBACK" ? "OVERALL" : section) as TabKey}
    >
      <Header
        month={month}
        onMonthChange={(ym) => {
          setMonth(ym);
          setDateOpt("ALL");
        }}
        examTexts={examTexts}
        onOpenAdmin={() => {
          setAdminTab("login");
          setAdminOpen(true);
        }}
      />

      {/* Spacer for fixed header; dynamic height */}
      <div style={{ height: "var(--header-h,96px)" }} />

      <div className="mobile-rescue">
        <div className="mx-auto w-full max-w-screen-xl px-3 sm:px-4 lg:px-6 py-5">
          <StatCards
            stats={stats}
            softBgClass={activeTheme.pill}
            primaryTextClass={activeTheme.text}
          />

          <div className="mt-3">
            <ChipBar
              active={section}
              onChange={(k) => {
                setSection(k);
                setDateOpt("ALL");
              }}
              colorByKey={{
                OVERALL: {
                  pill: colorMap.OVERALL.pill,
                  text: colorMap.OVERALL.text,
                },
                MAT: { pill: colorMap.MAT.pill, text: colorMap.MAT.text },
                ENGLISH: {
                  pill: colorMap.ENGLISH.pill,
                  text: colorMap.ENGLISH.text,
                },
                MATHS: {
                  pill: colorMap.MATHS.pill,
                  text: colorMap.MATHS.text,
                },
                FEEDBACK: {
                  pill: colorMap.OVERALL.pill,
                  text: colorMap.OVERALL.text,
                },
              }}
            />
          </div>

          {section === "FEEDBACK" ? (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-white p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-semibold">Parent Feedback</h3>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                Tap the button below to open the feedback form.
              </p>
              <div className="mt-3">
                <Link
                  href="/feedback"
                  className="inline-flex items-center rounded-md bg-emerald-600 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Open Feedback Form
                </Link>
              </div>
            </div>
          ) : (
            <>
              {sectionForDropdown && (
                <div className="mt-2">
                  <DateDropdown
                    label="Date"
                    value={dateOpt}
                    onChange={setDateOpt}
                    options={
                      dateOptionsBySection[sectionForDropdown] ?? [
                        { value: "ALL", label: "All dates" },
                      ]
                    }
                  />
                </div>
              )}

              {/* GRID: Notice below on mobile, side-by-side on md+ */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch min-w-0">
                {/* LEFT: Leaderboard / Section */}
                <motion.div
                  key={`left-${section}-${dateOpt}-${month}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={CARD_CLASS + " order-1"}
                >
                  <AnimatePresence mode="wait">
                    {section === "OVERALL" ? (
                      <motion.div
                        key="overall"
                        className="flex min-h-0 flex-1 flex-col"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-semibold truncate">
                            Overall Leaderboard — {month}
                          </h3>
                        </div>
                        <div className="min-h-0 flex-1 overflow-x-auto text-xs sm:text-sm">
                          <Leaderboard
                            students={lbStudents}
                            tests={lbTests}
                            marks={lbMarks}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="section"
                        className="flex min-h-0 flex-1 flex-col"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-semibold truncate">
                            {section} —{" "}
                            <span className={activeTheme.text}>
                              {(() => {
                                if (!sectionForDropdown) return "—";
                                if (selectedTestId) {
                                  const t = liveTests.find((x) => x.id === selectedTestId);
                                  return t ? labelForDate(t.test_date) : "—";
                                }
                                return "—";
                              })()}
                            </span>
                          </h3>
                          <span className={`text-[11px] ${activeTheme.text} shrink-0`}>
                            Absent shows in red
                          </span>
                        </div>

                        <div className="min-h-0 flex-1 overflow-x-auto text-xs sm:text-sm pr-1">
                          <SectionGrid
                            section={(sectionForDropdown || "MAT") as SectionKey}
                            students={currentSectionRows}
                            fixedBodyHeightClass="h-full"
                            maxScore={maxScoreForGrid}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* RIGHT / BELOW: Notice Board */}
                <motion.div
                  key={`right-${section}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
                  className={CARD_CLASS + " order-2"}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-semibold truncate">
                      Notice Board
                    </h3>
                    <span className={`text-[11px] ${activeTheme.text} shrink-0`}>
                      Auto-scrolling
                    </span>
                  </div>
                  <div className="min-h-[180px] md:min-h-[220px] flex-1 overflow-hidden">
                    <NoticeCarousel items={noticesForCarousel} barClassName={activeTheme.bar} />
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>

      <AdminDrawer
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        tab={adminTab}
        setTab={setAdminTab}
      />
    </GradientBackground>
  );
}
