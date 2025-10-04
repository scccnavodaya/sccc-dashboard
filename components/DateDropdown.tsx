"use client";

export default function DateDropdown({
  label = "Date",
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm sm:text-[0.95rem] text-zinc-600 w-full max-w-xs">
      <span className="shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full
          h-10
          rounded-md border border-zinc-300 bg-white
          px-2.5 sm:px-3
          text-sm sm:text-[0.95rem] text-zinc-900
          outline-none
          focus:ring-2 focus:ring-emerald-300
        "
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
