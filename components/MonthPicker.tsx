"use client";

import { useEffect, useState } from "react";

function currentISTMonth(): string {
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

export default function MonthPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (ym: string) => void;
}) {
  const [local, setLocal] = useState(value || currentISTMonth());

  useEffect(() => {
    if (value && value !== local) setLocal(value);
  }, [value]); // eslint-disable-line

  return (
    <label className="inline-flex items-center gap-2 text-sm sm:text-[0.95rem] text-zinc-600 w-full max-w-[200px]">
      <span className="hidden sm:inline shrink-0">Month</span>
      <input
        type="month"
        className="
          w-full max-w-[160px]
          h-10
          rounded-md border border-zinc-300 bg-white
          px-2.5
          text-[15px] text-zinc-900
          outline-none
          focus:ring-2 focus:ring-emerald-300
        "
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          onChange(e.target.value);
        }}
      />
    </label>
  );
}
