// components/Footer.tsx
"use client";

export default function Footer() {
  return (
    <footer
      className="bg-transparent safe-x safe-y app-footer"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Light, rounded container aligned with page width */}
      <div
        className="
          mx-auto w-full max-w-screen-xl
          rounded-t-2xl border-t border-emerald-200
          bg-gradient-to-r from-emerald-50 to-teal-50
          px-4 sm:px-6 lg:px-8 py-4 sm:py-6
          shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]
        "
      >
        <div
          className="
            flex flex-col md:flex-row
            items-center md:items-center
            justify-between gap-2
            text-sm sm:text-base text-emerald-800
          "
        >
          {/* Left */}
          <div className="text-center md:text-left min-w-0">
            <span className="font-serif text-base italic block sm:inline">
              Success Career Coaching Center
            </span>{" "}
            <span className="whitespace-nowrap">© Stevel Moirangthem</span>
          </div>

          {/* Right */}
          <div className="text-center md:text-right min-w-0">
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
