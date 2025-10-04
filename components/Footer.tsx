// components/Footer.tsx
"use client";

export default function Footer() {
  return (
    <footer
      className="bg-transparent safe-x safe-y app-footer"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Container with background + border */}
      <div
        className="
          mx-auto w-full max-w-screen-xl
          rounded-t-2xl border-t border-emerald-200
          bg-gradient-to-r from-emerald-50 to-teal-50
          px-4 sm:px-6 lg:px-8 py-4 sm:py-6
          shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]
        "
      >
        {/* Two-line layout */}
        <div className="flex flex-col gap-2 text-sm sm:text-base text-emerald-800">
          {/* Line 1: Left aligned */}
          <div className="text-left">
            <span className="font-serif text-base italic block sm:inline">
              Success Career Coaching Centre
            </span>{" "}
            <span className="whitespace-nowrap">© Stevel Moirangthem</span>
          </div>

          {/* Line 2: Right aligned */}
          <div className="text-right">
            <span className="block sm:inline">
              Designed &amp; Developed by{" "}
            </span>
            <span className="font-serif text-base italic hover:text-emerald-600 transition-colors">
              @ Karam Suresh
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
