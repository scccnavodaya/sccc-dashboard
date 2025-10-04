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
        "bg-transparent safe-x safe-y", // iOS safe-area insets + no overflow
      ].join(" ")}
      role="contentinfo"
    >
      {/* Light, rounded container aligned with page width */}
      <div className="mx-auto w-full max-w-screen-xl rounded-t-2xl border-t border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-2 text-sm sm:text-base text-emerald-800">
          {/* Left */}
          <div className="text-center md:text-left break-anywhere">
            <span className="font-serif text-base italic block sm:inline">
              Success Career Coaching Center
            </span>{" "}
            © <span className="whitespace-nowrap">{new Date().getFullYear()}</span> Stevel Moirangthem
          </div>

          {/* Right */}
          <div className="text-center md:text-right break-anywhere">
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
