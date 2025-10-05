// components/LeaderboardTable.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Mark = {
  testId: string;
  studentId: string;
  score?: number | null;
};

type Test = {
  id: string;
  section: "MAT" | "ENGLISH" | "MATHS";
  testDate: string;
};

type Student = {
  id: string;
  name: string;
  photo?: string | null;
};

/* Avatar with click-to-preview */
function AvatarPreview({ src, name }: { src?: string | null; name: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
          alt={name}
          className="h-8 w-8 sm:h-9 sm:w-9 cursor-zoom-in rounded-full border border-zinc-200 object-cover shrink-0"
          onClick={() => setOpen(true)}
        />
      ) : (
        <div
          className="grid h-8 w-8 sm:h-9 sm:w-9 cursor-zoom-in place-items-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 shrink-0"
          onClick={() => setOpen(true)}
          title={name}
        >
          {initials}
        </div>
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

export default function LeaderboardTable({
  students,
  tests,
  marks,
}: {
  students: Student[];
  tests: Test[];
  marks: Mark[];
}) {
  // compute totals for the month
  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const st of students) map.set(st.id, 0);

    for (const t of tests) {
      for (const st of students) {
        const mark = marks.find((m) => m.testId === t.id && m.studentId === st.id);
        if (mark && mark.score != null) {
          map.set(st.id, (map.get(st.id) ?? 0) + (Number(mark.score) || 0));
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
    copy.sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
    return copy;
  }, [totals]);

  return (
    <div
      className="
        rounded-xl border border-zinc-200
        overflow-x-auto             /* allow horizontal scroll on narrow phones */
        w-full max-w-full
      "
    >
      <table
        className="
          w-full border-collapse text-sm
          min-w-[420px]             /* lowered min width for better mobile fit */
        "
      >
        <thead className="bg-zinc-50">
          <tr className="text-zinc-600">
            <th className="px-3 py-2 text-left text-xs sm:text-sm">Rank</th>
            <th className="px-3 py-2 text-left text-xs sm:text-sm">Student</th>
            <th className="px-3 py-2 text-right text-xs sm:text-sm">Monthly Total</th>
            {/* hide status on smallest screens to reduce width pressure */}
            <th className="px-3 py-2 text-right text-xs sm:text-sm hidden sm:table-cell">Status</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((s, i) => (
            <tr
              key={s.id}
              className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/60"
            >
              <td className="px-3 py-2 align-middle text-xs sm:text-sm">{i + 1}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AvatarPreview src={s.photo} name={s.name} />
                  <span className="font-medium truncate text-sm">{s.name}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-sm">
                {(Number(s.total) || 0).toFixed(2).replace(/\.00$/, "")}
              </td>
              {/* Neutral placeholder for now (hidden on xs) */}
              <td className="px-3 py-2 text-right text-zinc-400 hidden sm:table-cell">—</td>
            </tr>
          ))}
          {ranked.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                No exams in this month
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
