import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

type Recent = { id: string; title: string; type: string; status: string; course: string | null; created_at: string };
type DoubtRow = { subject: string; body: string; student: string | null; created_at: string };
type ClassRow = { title: string; start_at: string; course: string | null };
type BookingRow = { start_at: string; topic: string; student: string | null };

const statusBadge: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export default async function TeacherDashboard() {
  const user = await requireRole(["teacher", "admin"]);
  const nowIso = new Date().toISOString();

  const scalar = async (sql: string, args: unknown[] = []) =>
    (await db.prepare(sql).get(...args) as { n: number }).n;

  const pending = await scalar("SELECT COUNT(*) AS n FROM content WHERE author_id = ? AND status = 'pending'", [user.id]);
  const approved = await scalar("SELECT COUNT(*) AS n FROM content WHERE author_id = ? AND status = 'approved'", [user.id]);
  const openDoubts = await scalar("SELECT COUNT(*) AS n FROM doubts WHERE status = 'open'");
  const upcomingClassCount = await scalar("SELECT COUNT(*) AS n FROM live_classes WHERE teacher_id = ? AND status = 'scheduled' AND start_at > ?", [user.id, nowIso]);
  const bookedSlotCount = await scalar("SELECT COUNT(*) AS n FROM booking_slots WHERE teacher_id = ? AND status = 'booked' AND start_at > ?", [user.id, nowIso]);

  const recent = await db
    .prepare(
      `SELECT ct.id, ct.title, ct.type, ct.status, ct.created_at, c.name AS course
       FROM content ct LEFT JOIN courses c ON c.id = ct.course_id
       WHERE ct.author_id = ? ORDER BY ct.created_at DESC LIMIT 6`
    )
    .all(user.id) as Recent[];

  const recentDoubts = await db
    .prepare(
      `SELECT d.subject, d.body, d.created_at, u.name AS student
       FROM doubts d LEFT JOIN users u ON u.id = d.student_id
       WHERE d.status = 'open' ORDER BY d.created_at DESC LIMIT 6`
    )
    .all() as DoubtRow[];

  const upcomingClasses = await db
    .prepare(
      `SELECT lc.title, lc.start_at, c.name AS course
       FROM live_classes lc LEFT JOIN courses c ON c.id = lc.course_id
       WHERE lc.teacher_id = ? AND lc.status = 'scheduled' AND lc.start_at > ?
       ORDER BY lc.start_at ASC LIMIT 6`
    )
    .all(user.id, nowIso) as ClassRow[];

  const upcomingBookings = await db
    .prepare(
      `SELECT s.start_at, s.topic, u.name AS student
       FROM booking_slots s LEFT JOIN users u ON u.id = s.booked_by
       WHERE s.teacher_id = ? AND s.status = 'booked' AND s.start_at > ?
       ORDER BY s.start_at ASC LIMIT 6`
    )
    .all(user.id, nowIso) as BookingRow[];

  const cards = [
    { label: "Open Doubts", value: openDoubts, sub: "to answer", tone: "text-red-600 bg-red-50", href: "/teacher/doubts" },
    { label: "Upcoming Classes", value: upcomingClassCount, sub: "scheduled", tone: "text-sky-600 bg-sky-50", href: "/teacher/classes" },
    { label: "1:1 Bookings", value: bookedSlotCount, sub: "booked slots", tone: "text-violet-600 bg-violet-50", href: "/teacher/slots" },
    { label: "Pending Review", value: pending, sub: `${approved} live`, tone: "text-amber-600 bg-amber-50", href: "/teacher/content" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.name}</h1>
          <p className="text-sm text-slate-500">What needs your attention today</p>
        </div>
        <a href="/teacher/content" className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4">
          + New content
        </a>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className="rounded-xl bg-white border border-slate-200 p-5 hover:border-gold-200 hover:shadow-sm transition">
            <div className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${c.tone}`}>{c.label}</div>
            <div className="mt-3 text-3xl font-semibold text-slate-900 tabular-nums">{c.value}</div>
            <div className="text-xs text-slate-400 mt-1">{c.sub}</div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming classes */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Your upcoming classes</h2>
            <a href="/teacher/classes" className="text-xs text-gold-700 hover:underline">Manage →</a>
          </div>
          <div className="space-y-3">
            {upcomingClasses.length === 0 && <p className="text-sm text-slate-400">No classes scheduled. <a href="/teacher/classes" className="text-gold-700 hover:underline">Schedule one</a>.</p>}
            {upcomingClasses.map((c, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-slate-800 truncate">{c.title}</div>
                  <div className="text-xs text-slate-400 truncate">{c.course ?? "No batch"}</div>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{fmtWhen(c.start_at)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Open doubts */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Doubts to answer</h2>
            <a href="/teacher/doubts" className="text-xs text-gold-700 hover:underline">Answer →</a>
          </div>
          <div className="space-y-3">
            {recentDoubts.length === 0 && <p className="text-sm text-slate-400">No open doubts. All caught up. 🎉</p>}
            {recentDoubts.map((d, i) => (
              <div key={i} className="border-b border-slate-100 pb-2 last:border-0">
                <div className="text-sm text-slate-800 line-clamp-1">{d.body}</div>
                <div className="text-xs text-slate-400">{d.student ?? "Student"}{d.subject ? ` · ${d.subject}` : ""}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming 1:1 bookings */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming 1:1 bookings</h2>
            <a href="/teacher/slots" className="text-xs text-gold-700 hover:underline">Manage →</a>
          </div>
          <div className="space-y-3">
            {upcomingBookings.length === 0 && <p className="text-sm text-slate-400">No bookings yet. <a href="/teacher/slots" className="text-gold-700 hover:underline">Publish slots</a>.</p>}
            {upcomingBookings.map((b, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-slate-800 truncate">{b.student ?? "A student"}</div>
                  {b.topic && <div className="text-xs text-slate-400 truncate">“{b.topic}”</div>}
                </div>
                <span className="shrink-0 text-xs text-slate-500">{fmtWhen(b.start_at)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent submissions */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent submissions</h2>
            <a href="/teacher/content" className="text-xs text-gold-700 hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {recent.length === 0 && (
              <p className="text-sm text-slate-400">Nothing yet. Start with <a href="/teacher/content" className="text-gold-700 hover:underline">New content</a>.</p>
            )}
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm text-slate-800 truncate">{r.title}</div>
                  <div className="text-xs text-slate-400">{r.type} · {r.course ?? "No course"}</div>
                </div>
                <span className={`shrink-0 text-xs rounded px-2 py-0.5 ${statusBadge[r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
