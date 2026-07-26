"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/lib/session-actions";

const NAV = [
  { href: "/teacher", label: "Dashboard", icon: "▤" },
  { href: "/teacher/classes", label: "Live Classes", icon: "◉" },
  { href: "/teacher/attendance", label: "Attendance", icon: "☑" },
  { href: "/teacher/content", label: "My Content", icon: "▦" },
  { href: "/teacher/resources", label: "Content Library", icon: "▤" },
  { href: "/teacher/tests", label: "Test Series", icon: "✎" },
  { href: "/teacher/doubts", label: "Doubts", icon: "?" },
];

export default function TeacherShell({
  teacherName,
  children,
}: {
  teacherName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const nav = (
    <>
      <div className="px-5 py-5 border-b border-brand-800 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gold-600 flex items-center justify-center text-white text-sm font-bold">
          CL
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white leading-tight">CLATians</div>
          <div className="text-[11px] text-brand-100">Teacher Console</div>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="md:hidden text-brand-100 hover:text-white text-lg leading-none px-1"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active =
            item.href === "/teacher" ? pathname === "/teacher" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-gold-600 text-white"
                  : "text-brand-100 hover:bg-brand-800 hover:text-white"
              }`}
            >
              <span className="w-4 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-800 px-4 py-4">
        <div className="mb-3">
          <div className="text-sm text-white font-medium leading-tight">{teacherName}</div>
          <div className="text-[11px] text-brand-100">Teacher</div>
        </div>
        <form action={logoutAction}>
          <button className="w-full rounded-lg border border-brand-700 text-brand-100 hover:bg-brand-800 text-sm py-2 transition">
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 bg-brand-900 text-white px-4 h-14">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="text-2xl leading-none -ml-1 px-1"
        >
          ☰
        </button>
        <div className="h-7 w-7 rounded-md bg-gold-600 flex items-center justify-center text-white text-xs font-bold">
          CL
        </div>
        <span className="font-semibold text-sm">CLATians · Teacher</span>
      </header>

      <div className="md:flex">
        {open && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 md:w-60 shrink-0 bg-brand-900 text-brand-100 flex flex-col min-h-screen
            transform transition-transform duration-200 ease-out
            ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        >
          {nav}
        </aside>

        <main className="flex-1 min-w-0 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
