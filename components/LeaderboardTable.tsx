// components/LeaderboardTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

export type Mark = {
  testId: string;
  studentId: string;
  score?: number | null;
};

export type Test = {
  id: string;
  section: "MAT" | "ENGLISH" | "MATHS" | string;
  // support both backend naming conventions:
  test_date?: string; // underscore (backend)
  testDate?: string; // camelCase (frontend)
};

export type Student = {
  id: string;
  name: string;
  photo?: string | null;
  // optional computed total
  total?: number;
};

/** Props exported so other modules can import the type */
export interface LeaderboardTableProps {
  students: Student[];
  tests: Test[];
  marks: Mark[];
  accentClass?: string;
  /**
   * Optional: how many rows to show without scrolling.
   * If omitted, shows all rows (caller can wrap in a container to limit height).
   */
  maxRows?: number;
}

/* Avatar with click-to-preview */
function AvatarPreview({ src, name }: { src?: string | null; name: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const initials = name
    .split(" ")
    .map((n) => n[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  return (
    <>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name} photo`}
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
          className="h-8 w-8 sm:h-9 sm:w-9 cursor-zoom-in rounded-full border border-zinc-200 object-cover shrink-0"
        />
      ) : (
        <button
          onClick={() => setOpen(true)}
          title={name}
          className="grid h-8 w-8 sm:h-9 sm:w-9 cursor-zoom-in place-items-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 shrink-0"
        >
          {initials}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo preview`}
        >
          <div className="mx-auto mt-16 w-full max-w-xs px-4">
            <div
              className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-zinc-800 text-white">
                  <span className="text-4xl font-semibold">{initials}</span>
                </div>
              )}
            </div>

            <div className="mt-3 text-center text-sm text-white/90">{name}</div>

            <button
              className="mx-auto mt-3 block h-10 rounded-md bg-white/90 px-4 text-sm font-medium text-zinc-900 hover:bg-white"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const numFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export default function LeaderboardTable({
  students,
  tests,
  marks,
  accentClass = "text-emerald-700",
  maxRows,
}: LeaderboardTableProps) {
  // Helper: resolve test date string (prefer test_date then testDate)
  function testDateOf(t: Test): string {
    return String(t.test_date ?? t.testDate ?? "");
  }

  // compute totals for the month (or provided tests list)
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const st of students) map.set(st.id, 0);

    // create quick lookup by (testId, studentId)
    const markIndex = new Map<string, number | null>();
    for (const m of marks) {
      markIndex.set(`${m.testId}::${m.studentId}`, m.score ?? null);
    }

    for (const t of tests) {
      for (const st of students) {
        const markKey = `${String(t.id)}::${st.id}`;
        const markVal = markIndex.get(markKey);
        if (markVal != null) {
          map.set(st.id, (map.get(st.id) ?? 0) + (Number(markVal) || 0));
        }
      }
    }

    return students.map((s) => ({
      ...s,
      total: map.get(s.id) ?? 0,
    }));
  }, [students, tests, marks]);

  // sort by total desc
  const ranked = useMemo(() => {
    const copy = [...totals];
    copy.sort((a, b) => (Number(b.total ?? 0) - Number(a.total ?? 0)));
    return copy;
  }, [totals]);

  // Determine how many rows to render before scrolling; default shows all.
  const visibleCount = Number.isFinite(Number(maxRows)) && maxRows! > 0 ? Math.max(0, Math.floor(maxRows!)) : ranked.length;
  const topRows = ranked.slice(0, visibleCount);
  const remaining = ranked.slice(visibleCount);

  return (
    <div
      className="rounded-xl border border-zinc-200 overflow-hidden w-full max-w-full bg-white"
      role="region"
      aria-label="Leaderboard"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b bg-zinc-50 flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-700">Rank</div>
        <div className="text-sm font-medium text-zinc-700">Student</div>
        <div className="text-sm font-medium text-zinc-700">Total</div>
      </div>

      {/* Top visible rows (no internal scroll) */}
      <div className="divide-y divide-zinc-100">
        {topRows.map((s, i) => (
          <div
            key={s.id}
            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-zinc-50/60"
          >
            <div className="w-8 text-sm text-zinc-600">{i + 1}</div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AvatarPreview src={s.photo} name={s.name} />
              <div className="min-w-0">
                <div className="font-medium truncate text-sm">{s.name}</div>
              </div>
            </div>
            <div className="w-20 text-right font-semibold tabular-nums">{numFmt.format(Number(s.total ?? 0)).replace(/\.00$/, "")}</div>
          </div>
        ))}

        {topRows.length === 0 && (
          <div className="py-6 text-center text-zinc-500">No data available</div>
        )}
      </div>

      {/* Remaining rows in a scroll area if present */}
      {remaining.length > 0 && (
        <div className="border-t border-zinc-100">
          <div className="max-h-[260px] overflow-y-auto">
            {remaining.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-zinc-50/60"
              >
                <div className="w-8 text-sm text-zinc-600">{visibleCount + idx + 1}</div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <AvatarPreview src={s.photo} name={s.name} />
                  <div className="min-w-0">
                    <div className="font-medium truncate text-sm">{s.name}</div>
                  </div>
                </div>
                <div className="w-20 text-right font-semibold tabular-nums">
                  {numFmt.format(Number(s.total ?? 0)).replace(/\.00$/, "")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
