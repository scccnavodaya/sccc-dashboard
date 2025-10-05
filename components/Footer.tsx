// components/Footer.tsx
"use client";

export default function Footer() {
  return (
    <footer
      className="
        safe-x safe-y 
        bg-transparent 
        app-footer
        w-full
        z-40
      "
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Outer container with subtle gradient + border top */}
      <div
        className="
          mx-auto w-full max-w-screen-xl
          border-t border-emerald-200
          bg-gradient-to-r from-emerald-50 to-teal-50
          px-3 sm:px-6 lg:px-8 py-3 sm:py-4
          shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]
          rounded-t-2xl
        "
      >
        {/* Two-line flex layout */}
        <div
          className="
            flex flex-col sm:flex-row
            justify-between items-center sm:items-baseline
            gap-2 text-[12px] sm:text-sm md:text-base text-emerald-800
          "
        >
          {/* Left-aligned line */}
          <div className="text-left w-full sm:w-auto">
            <span className="font-serif text-sm sm:text-base italic">
              Success Career Coaching Centre
            </span>{" "}
            <span className="whitespace-nowrap">© Stevel Moirangthem</span>
          </div>

          {/* Right-aligned line */}
          <div className="text-right w-full sm:w-auto">
            <span>Designed &amp; Developed by </span>
            <span className="font-serif text-sm sm:text-base italic hover:text-emerald-600 transition-colors">
              @ Karam Suresh
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
