"use client";

import { useEffect, useMemo, useState } from "react";

export type SectionKey = "MAT" | "ENGLISH" | "MATHS";

type BaseStudent = {
  id: string;
  name: string;
  photo?: string | null;
  mat?: number | null;
  eng?: number | null;
  maths?: number | null;
};

type MaxScore = number | ((s: BaseStudent) => number);

type SectionProps = {
  mode?: "section";
  section: SectionKey;
  students: BaseStudent[];
  fixedBodyHeightClass?: string;
  maxScore?: MaxScore;
};

type OverallProps = {
  mode: "overall";
  students: BaseStudent[];
  fixedBodyHeightClass?: string;
  maxScore?: MaxScore;
};

type Props = SectionProps | OverallProps;

/** Format up to 2 decimals (strip .00) */
function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, "");
}

/** WhatsApp-like avatar tap-to-preview */
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
          className="h-7 w-7 sm:h-6 sm:w-6 cursor-zoom-in rounded-full border border-zinc-200 object-cover shrink-0"
          onClick={() => setOpen(true)}
        />
      ) : (
        <button
          onClick={() => setOpen(true)}
          title={name}
          className="grid h-7 w-7 sm:h-6 sm:w-6 place-items-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-700 shrink-0"
        >
          {initials}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/70 p-4 backdrop-blur-sm
                     pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]
                     pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo preview`}
        >
          <div
            className="mx-auto mt-16 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-72 w-full place-items-center bg-zinc-800 text-4xl font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
            <div className="mt-3 text-center text-sm text-white/95">{name}</div>
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

export default function SectionGrid(props: Props) {
  // Keep your height option but give a sensible mobile default window.
  const fixedBodyHeightClass =
    props.fixedBodyHeightClass ?? "h-[136px] sm:h-[160px] md:h-[180px]";

  const students = props.students;

  const { rowsPresent, rowsAbsent, mode } = useMemo(() => {
    if (props.mode === "overall") {
      const present = students.map((s) => ({
        id: s.id,
        name: s.name,
        photo: s.photo ?? null,
        score:
          (Number(s.mat ?? 0) || 0) +
          (Number(s.eng ?? 0) || 0) +
          (Number(s.maths ?? 0) || 0),
        src: s as BaseStudent,
      }));
      present.sort((a, b) => b.score - a.score);
      return { rowsPresent: present, rowsAbsent: [] as any[], mode: "overall" as const };
    }

    const field: keyof BaseStudent =
      props.section === "MAT" ? "mat" : props.section === "ENGLISH" ? "eng" : "maths";

    const present: Array<{ id: string; name: string; photo?: string | null; score: number; src: BaseStudent }> = [];
    const absent: Array<{ id: string; name: string; photo?: string | null; src: BaseStudent }> = [];

    for (const s of students) {
      const v = s[field] as number | null | undefined;
      if (v == null) {
        absent.push({ id: s.id, name: s.name, photo: s.photo ?? null, src: s });
      } else {
        present.push({ id: s.id, name: s.name, photo: s.photo ?? null, score: v, src: s });
      }
    }
    present.sort((a, b) => b.score - a.score);
    return { rowsPresent: present, rowsAbsent: absent, mode: "section" as const };
  }, [props.mode, (props as any).section, students]);

  function renderScore(obtained: number, student: BaseStudent) {
    const max = (props as any).maxScore as MaxScore | undefined;
    if (max == null) return fmt(obtained);
    const full = typeof max === "function" ? max(student) : max;
    if (!Number.isFinite(full) || full <= 0) return fmt(obtained);
    return `${fmt(obtained)}/${fmt(full)}`;
  }

  const textSize = "text-[12px] sm:text-xs";
  const headPad = "py-1";
  const rowPad = "py-1.5";

  return (
    <div
      className="
        rounded-2xl border border-zinc-200 card
        w-full max-w-full
        table-scroll            /* enable horizontal scroll on very small phones */
        mobile-rescue           /* guard against side overflow */
      "
    >
      <div className={`${fixedBodyHeightClass} overflow-y-auto`}>
        <table
          className={`w-full border-collapse ${textSize} min-w-[520px]`}
          aria-label="Section scores"
        >
          <thead className="sticky top-0 bg-zinc-50 sticky-top">
            <tr className="text-zinc-600">
              <th className={`px-3 ${headPad} text-left no-shrink`}>Rank</th>
              <th className={`px-3 ${headPad} text-left`}>Student</th>
              <th className={`px-3 ${headPad} text-right`}>Score</th>
              <th className={`px-3 ${headPad} text-right`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rowsPresent.map((r, i) => (
              <tr
                key={`p-${r.id}`}
                className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/60"
              >
                <td className={`px-3 ${rowPad} align-middle no-shrink`}>{i + 1}</td>
                <td className={`px-3 ${rowPad}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <AvatarPreview src={r.photo ?? undefined} name={r.name} />
                    <span className="truncate font-medium break-anywhere">{r.name}</span>
                  </div>
                </td>
                <td className={`px-3 ${rowPad} text-right font-semibold tabular-nums`}>
                  {renderScore(r.score, r.src)}
                </td>
                <td className={`px-3 ${rowPad} text-right`}>
                  {mode === "section" ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-[1px] text-[10px] font-medium text-emerald-800">
                      Present
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
              </tr>
            ))}

            {mode === "section" &&
              rowsAbsent.map((r) => (
                <tr
                  key={`a-${r.id}`}
                  className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/60"
                >
                  <td className={`px-3 ${rowPad} no-shrink`}>—</td>
                  <td className={`px-3 ${rowPad}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarPreview src={r.photo ?? undefined} name={r.name} />
                      <span className="truncate font-medium break-anywhere">{r.name}</span>
                    </div>
                  </td>
                  <td className={`px-3 ${rowPad} text-right text-zinc-400`}>—</td>
                  <td className={`px-3 ${rowPad} text-right`}>
                    <span className="rounded-full bg-red-100 px-2 py-[1px] text-[10px] font-medium text-red-700">
                      Absent
                    </span>
                  </td>
                </tr>
              ))}

            {rowsPresent.length + rowsAbsent.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
