"use client";

export default function Footer() {
  return (
    <footer className="bg-transparent">
      {/* Light, rounded container aligned with page width */}
      <div className="mx-auto max-w-6xl rounded-t-2xl border-t border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]">
        <div className="flex flex-col items-center justify-between gap-2 text-sm text-emerald-800 md:flex-row">
          {/* Left */}
          <div className="text-center md:text-left">
            <span className="font-serif text-base italic">
              Success Career Coaching Center
            </span>{" "}
            © Stevel Moirangthem
          </div>

          {/* Right */}
          <div className="text-center md:text-right">
            Designed &amp; Developed by{" "}
            <span className="font-serif text-base italic hover:text-emerald-600 transition-colors">
              @ Karam Suresh
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
