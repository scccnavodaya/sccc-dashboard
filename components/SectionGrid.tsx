// components/SectionGrid.tsx
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
  accentClass?: string; // NEW: theme accent for badges/pills
};

type OverallProps = {
  mode: "overall";
  students: BaseStudent[];
  fixedBodyHeightClass?: string;
  maxScore?: MaxScore;
  accentClass?: string;
};

type Props = SectionProps | OverallProps;

function fmt(n: number) {
  if (!Number.isFinite(n)) return "—";
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, "");
}

/** Tap avatar → fullscreen preview (mobile-friendly) */
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
          className="h-7 w-7 cursor-zoom-in rounded-full border border-zinc-200 object-cover shrink-0"
          onClick={() => setOpen(true)}
        />
      ) : (
        <button
          onClick={() => setOpen(true)}
          title={name}
          className="grid h-7 w-7 place-items-center rounded-full bg-zinc-300 text-[10px] font-semibold text-zinc-700 shrink-0"
        >
          {initials}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-black/70 p-4 flex items-center justify-center"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-xs w-full bg-zinc-900 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={name} className="w-full h-72 object-cover" />
            ) : (
              <div className="grid h-72 w-full place-items-center bg-zinc-800 text-4xl font-bold text-white">
                {initials}
              </div>
            )}
            <div className="p-3 text-center text-white text-sm font-medium truncate">{name}</div>
            <button
              onClick={() => setOpen(false)}
              className="mx-auto mb-3 block rounded-md bg-white/90 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-white"
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
  // reduced heights so grid + feedback fit in mobile viewport
  const fixedBodyHeightClass = props.fixedBodyHeightClass ?? "h-[160px] sm:h-[220px] md:h-[260px] lg:h-[300px]";

  const students = props.students ?? [];
  const accentClass = (props as any).accentClass ?? "bg-emerald-100 text-emerald-800";

  const { rowsPresent, rowsAbsent, mode } = useMemo(() => {
    if ((props as OverallProps).mode === "overall") {
      const present = students.map((s) => ({
        id: s.id,
        name: s.name,
        photo: s.photo ?? null,
        score: (Number(s.mat ?? 0) || 0) + (Number(s.eng ?? 0) || 0) + (Number(s.maths ?? 0) || 0),
        src: s,
      }));
      present.sort((a, b) => b.score - a.score);
      return { rowsPresent: present, rowsAbsent: [], mode: "overall" as const };
    }

    const section = (props as SectionProps).section;
    const field: keyof BaseStudent = section === "MAT" ? "mat" : section === "ENGLISH" ? "eng" : "maths";

    const present: any[] = [];
    const absent: any[] = [];

    for (const s of students) {
      const v = s[field] as number | null | undefined;
      if (v == null) absent.push({ ...s });
      else present.push({ ...s, score: v });
    }

    present.sort((a, b) => b.score - a.score);
    return { rowsPresent: present, rowsAbsent: absent, mode: "section" as const };
  }, [(props as any).mode, (props as any).section, students]);

  // compute normalized status: Present / Fail / Absent
  function computeStatus(score: number | null | undefined, student: BaseStudent) {
    if (score == null) return { label: "Absent", variant: "absent" as const };
    const max = (props as any).maxScore as MaxScore | undefined;
    if (max == null) return { label: "Present", variant: "present" as const };
    const full = typeof max === "function" ? (max as any)(student) : (max as number);
    if (!Number.isFinite(full) || full <= 0) return { label: "Present", variant: "present" as const };
    const pct = (Number(score) / full) * 100;
    if (pct >= 33) return { label: "Present", variant: "present" as const }; // threshold: >=33% considered Present
    return { label: "Fail", variant: "fail" as const };
  }

  function renderScore(obtained: number, student: BaseStudent) {
    const max = (props as any).maxScore as MaxScore | undefined;
    if (max == null) return fmt(obtained);
    const full = typeof max === "function" ? max(student) : max;
    if (!Number.isFinite(full) || full <= 0) return fmt(obtained);
    return `${fmt(obtained)}/${fmt(full)}`;
  }

  const textSize = "text-[12px] sm:text-xs";
  const headPad = "py-1.5";
  const rowPad = "py-2";

  return (
    <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white">
      <div className={`${fixedBodyHeightClass} overflow-y-auto`}>
        <div className="w-full">
          <table className={`w-full border-collapse ${textSize}`} aria-label={(props as any).mode === "overall" ? "Overall scores" : `${(props as SectionProps).section} scores`}>
            <thead className="sticky top-0 bg-zinc-50">
              <tr className="text-zinc-600">
                <th className={`px-3 ${headPad} text-left w-[40px]`}>#</th>
                <th className={`px-3 ${headPad} text-left`}>Student</th>
                <th className={`px-3 ${headPad} text-right`}>Score</th>
                <th className={`px-3 ${headPad} text-right`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rowsPresent.map((r, i) => {
                const st = computeStatus(r.score, r);
                // pick classes based on variant
                const badgeClass =
                  st.variant === "absent"
                    ? "rounded-full bg-red-100 px-2 py-[1px] text-[10px] font-medium text-red-700"
                    : st.variant === "fail"
                    ? "rounded-full bg-red-100 px-2 py-[1px] text-[10px] font-medium text-red-700"
                    : // present uses accent
                      `rounded-full px-2 py-[1px] text-[10px] font-medium ${accentClass}`;

                return (
                  <tr key={`p-${r.id}`} className="border-t border-zinc-100 hover:bg-zinc-50/70">
                    <td className={`px-3 ${rowPad} text-zinc-700`}>{i + 1}</td>
                    <td className={`px-3 ${rowPad}`}>
                      <div className="flex items-center gap-2">
                        <AvatarPreview src={r.photo} name={r.name} />
                        <span className="truncate font-medium text-zinc-800 leading-snug">
                          {r.name}
                        </span>
                      </div>
                    </td>
                    <td className={`px-3 ${rowPad} text-right font-semibold`}>{renderScore(r.score, r)}</td>
                    <td className={`px-3 ${rowPad} text-right`}>
                      <span className={badgeClass}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}

              {mode === "section" &&
                rowsAbsent.map((r) => {
                  const st = { label: "Absent", variant: "absent" as const };
                  return (
                    <tr key={`a-${r.id}`} className="border-t border-zinc-100 hover:bg-zinc-50/70">
                      <td className={`px-3 ${rowPad} text-zinc-400`}>—</td>
                      <td className={`px-3 ${rowPad}`}>
                        <div className="flex items-center gap-2">
                          <AvatarPreview src={r.photo} name={r.name} />
                          <span className="truncate font-medium text-zinc-800">{r.name}</span>
                        </div>
                      </td>
                      <td className={`px-3 ${rowPad} text-right text-zinc-400`}>—</td>
                      <td className={`px-3 ${rowPad} text-right`}>
                        <span className="rounded-full bg-red-100 px-2 py-[1px] text-[10px] font-medium text-red-700">Absent</span>
                      </td>
                    </tr>
                  );
                })}

              {rowsPresent.length + rowsAbsent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-zinc-500 text-sm">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
