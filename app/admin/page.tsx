// app/admin/page.tsx
import Link from "next/link";
import {
  Users,
  ClipboardList,
  LayoutDashboard,
  Newspaper,
  MessageSquare,
  Settings,
} from "lucide-react";

export default function AdminHome() {
  const links = [
    {
      label: "Students",
      href: "/admin/students",
      desc: "Add / edit / delete students, upload photos",
      icon: Users,
    },
    {
      label: "Tests",
      href: "/admin/tests",
      desc: "Create tests per section & date",
      icon: ClipboardList,
    },
    {
      label: "Notice Board",
      href: "/admin/notices",
      desc: "Upload image/video notices for carousel",
      icon: LayoutDashboard,
    },
    {
      label: "Exam Notices",
      href: "/admin/exam-notices",
      desc: "Header ticker (text-only) with dates",
      icon: Newspaper,
    },
    {
      label: "Feedback",
      href: "/admin/feedback",
      desc: "See parent submissions",
      icon: MessageSquare,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      desc: "Change username / password",
      icon: Settings,
    },
  ];

  return (
    <main className="safe-x safe-y mx-auto w-full max-w-6xl px-3 sm:px-4 lg:px-6 py-5">
      <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm sm:shadow-md">
        {/* Title */}
        <h2 className="text-lg sm:text-xl font-semibold">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Choose a section to manage.
        </p>

        {/* Grid of links */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-label={l.label}
                className="
                  group flex h-full flex-col items-start rounded-xl border p-4
                  transition-colors duration-200
                  hover:border-emerald-400 hover:bg-emerald-50/30
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300
                  md:transition-transform md:duration-300 md:hover:scale-[1.02] md:hover:shadow-lg
                "
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-emerald-600 md:group-hover:animate-bounce" />
                  <div className="text-base font-medium">{l.label}</div>
                </div>
                <div className="mt-1 text-sm text-zinc-600">{l.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
