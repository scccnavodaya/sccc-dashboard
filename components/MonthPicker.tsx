"use client";

import { useEffect, useState } from "react";

function currentISTMonth(): string {
  const now = new Date();
  // Format to IST YYYY-MM using Intl
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find(p => p.type === "year")?.value ?? "2025";
  const m = parts.find(p => p.type === "month")?.value ?? "09";
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
    <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
      <span className="hidden sm:inline">Month</span>
      <input
        type="month"
        className="rounded-md border border-zinc-300 px-2 py-1 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-300"
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          onChange(e.target.value);
        }}
      />
    </label>
  );
}
