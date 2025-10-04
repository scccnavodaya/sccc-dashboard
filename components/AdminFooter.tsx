// components/AdminFooter.tsx
"use client";

type AdminFooterProps = {
  /** Make the footer stick to the bottom while scrolling */
  sticky?: boolean;
};

export default function AdminFooter({ sticky = false }: AdminFooterProps) {
  return (
    <footer
      className={[
        sticky ? "app-footer" : "", // sticky helper from globals.css (position: sticky; bottom: 0)
        "bg-transparent safe-x safe-y",
      ].join(" ")}
      role="contentinfo"
      aria-label="Admin footer"
    >
      <div
        className="
          mx-auto w-full max-w-screen-xl
          rounded-t-2xl border-t border-emerald-200
          bg-gradient-to-r from-emerald-50 to-teal-50
          px-4 sm:px-6 lg:px-8 py-4 sm:py-6
          shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]
        "
      >
        {/* Two-line layout: left (line 1), right (line 2) */}
        <div className="flex flex-col gap-2 text-sm sm:text-base text-emerald-800">
          {/* Line 1 - Left aligned */}
          <div className="text-left">
            <span className="font-serif text-base italic block sm:inline">
              Success Career Coaching Centre
            </span>{" "}
            © <span className="whitespace-nowrap">{new Date().getFullYear()}</span>{" "}
            Stevel Moirangthem
          </div>

          {/* Line 2 - Right aligned */}
          <div className="text-right">
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
