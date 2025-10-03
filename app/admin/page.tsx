// app/admin/page.tsx
import Link from "next/link";
import { Users, ClipboardList, LayoutDashboard, Newspaper, MessageSquare, Settings } from "lucide-react";

export default function AdminHome() {
  const links = [
    { label: "Students", href: "/admin/students", desc: "Add / edit / delete students, upload photos", icon: Users },
    { label: "Tests", href: "/admin/tests", desc: "Create tests per section & date", icon: ClipboardList },
    { label: "Notice Board", href: "/admin/notices", desc: "Upload image/video notices for carousel", icon: LayoutDashboard },
    { label: "Exam Notices", href: "/admin/exam-notices", desc: "Header ticker (text-only) with dates", icon: Newspaper },
    { label: "Feedback", href: "/admin/feedback", desc: "See parent submissions", icon: MessageSquare },
    { label: "Settings", href: "/admin/settings", desc: "Change username / password", icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="rounded-2xl border bg-white p-5 shadow-md">
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-600">Choose a section to manage.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="group rounded-xl border p-4 flex flex-col items-start transition-all duration-300 hover:scale-105 hover:shadow-lg hover:border-emerald-400"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-emerald-600 group-hover:animate-bounce" />
                  <div className="text-base font-medium">{l.label}</div>
                </div>
                <div className="mt-1 text-sm text-zinc-600">{l.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
