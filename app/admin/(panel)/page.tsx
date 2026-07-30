import { db } from "@/app/lib/db";

export const dynamic = "force-dynamic";

async function scalar(sql: string, args: unknown[] = []): Promise<number> {
  return (await db.prepare(sql).get(...args) as { n: number }).n;
}

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

type CourseRow = { name: string; students: number; status: string };
type ContentRow = { id: string; title: string; type: string; author: string | null; created_at: string };
type LeadRow = { name: string; interest: string; created_at: string };
type ClassRow = { title: string; start_at: string; teacher: string | null; course: string | null };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export default async function DashboardPage() {
  const nowIso = new Date().toISOString();
  const monthStart = new Date().toISOString().slice(0, 7) + "-01";

  const students = await scalar("SELECT COUNT(*) AS n FROM users WHERE role='student'");
  const teachers = await scalar("SELECT COUNT(*) AS n FROM users WHERE role='teacher'");
  const activeCourses = await scalar("SELECT COUNT(*) AS n FROM courses WHERE status='active'");
  const pendingContent = await scalar("SELECT COUNT(*) AS n FROM content WHERE status='pending'");
  const suspended = await scalar("SELECT COUNT(*) AS n FROM users WHERE status='suspended'");
  const approvedContent = await scalar("SELECT COUNT(*) AS n FROM content WHERE status='approved'");
  const newLeads = await scalar("SELECT COUNT(*) AS n FROM leads WHERE status='new'");
  const revenueTotal = await scalar("SELECT COALESCE(SUM(amount),0) AS n FROM payments WHERE status='paid'");
  const revenueMonth = await scalar("SELECT COALESCE(SUM(amount),0) AS n FROM payments WHERE status='paid' AND created_at >= ?", [monthStart]);

  const courseRows = await db
    .prepare(
      `SELECT c.name, c.status,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS students
       FROM courses c ORDER BY students DESC`
    )
    .all() as CourseRow[];

  const pendingRows = await db
    .prepare(
      `SELECT ct.id, ct.title, ct.type, ct.created_at, u.name AS author
       FROM content ct LEFT JOIN users u ON u.id = ct.author_id
       WHERE ct.status='pending' ORDER BY ct.created_at DESC LIMIT 6`
    )
    .all() as ContentRow[];

  const recentLeads = await db
    .prepare("SELECT name, interest, created_at FROM leads WHERE status='new' ORDER BY created_at DESC LIMIT 6")
    .all() as LeadRow[];

  const upcomingClasses = await db
    .prepare(
      `SELECT lc.title, lc.start_at, u.name AS teacher, c.name AS course
       FROM live_classes lc LEFT JOIN users u ON u.id = lc.teacher_id LEFT JOIN courses c ON c.id = lc.course_id
       WHERE lc.status='scheduled' AND lc.start_at > ? ORDER BY lc.start_at ASC LIMIT 6`
    )
    .all(nowIso) as ClassRow[];

  const maxStudents = Math.max(1, ...courseRows.map((c) => c.students));

  const cards = [
    { label: "Revenue (this month)", value: inr(revenueMonth), sub: `${inr(revenueTotal)} all-time`, tone: "emerald" },
    { label: "Students", value: String(students), sub: `${suspended} suspended`, tone: "gold" },
    { label: "New Leads", value: String(newLeads), sub: "awaiting contact", tone: "sky" },
    { label: "Pending Approval", value: String(pendingContent), sub: `${approvedContent} approved`, tone: "amber" },
    { label: "Teachers", value: String(teachers), sub: "faculty", tone: "violet" },
    { label: "Active Courses", value: String(activeCourses), sub: "batches", tone: "gold" },
  ];

  const tone: Record<string, string> = {
    gold: "text-gold-700 bg-gold-50",
    emerald: "text-emerald-600 bg-emerald-50",
    sky: "text-sky-600 bg-sky-50",
    amber: "text-amber-600 bg-amber-50",
    violet: "text-violet-600 bg-violet-50",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Platform overview and analytics</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white border border-slate-200 p-5">
            <div className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${tone[c.tone]}`}>
              {c.label}
            </div>
            <div className="mt-3 text-2xl font-semibold text-slate-900 tabular-nums">{c.value}</div>
            <div className="text-xs text-slate-400 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment by course */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Enrollment by course</h2>
          <div className="space-y-3">
            {courseRows.length === 0 && <p className="text-sm text-slate-400">No courses yet.</p>}
            {courseRows.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">
                    {c.name}
                    {c.status === "archived" && <span className="ml-2 text-xs text-slate-400">(archived)</span>}
                  </span>
                  <span className="text-slate-500">{c.students}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gold-500 rounded-full" style={{ width: `${(c.students / maxStudents) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pending approvals */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Awaiting approval</h2>
            <a href="/admin/content" className="text-xs text-gold-700 hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {pendingRows.length === 0 && <p className="text-sm text-slate-400">Nothing pending. All caught up. 🎉</p>}
            {pendingRows.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm text-slate-800 truncate">{r.title}</div>
                  <div className="text-xs text-slate-400">{r.type} · {r.author ?? "Unknown"}</div>
                </div>
                <span className="shrink-0 text-xs bg-amber-50 text-amber-600 rounded px-2 py-0.5">pending</span>
              </div>
            ))}
          </div>
        </section>

        {/* New enquiries */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">New enquiries</h2>
            <a href="/admin/leads" className="text-xs text-gold-700 hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {recentLeads.length === 0 && <p className="text-sm text-slate-400">No new enquiries. 🎉</p>}
            {recentLeads.map((l, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm text-slate-800 truncate">{l.name}</div>
                  <div className="text-xs text-slate-400 truncate">{l.interest || "General enquiry"}</div>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{fmtDate(l.created_at)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming classes */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming classes</h2>
            <a href="/admin/classes" className="text-xs text-gold-700 hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {upcomingClasses.length === 0 && <p className="text-sm text-slate-400">No classes scheduled.</p>}
            {upcomingClasses.map((c, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-slate-800 truncate">{c.title}</div>
                  <div className="text-xs text-slate-400 truncate">{c.teacher ?? "—"}{c.course ? ` · ${c.course}` : ""}</div>
                </div>
                <span className="shrink-0 text-xs text-slate-500">{fmtWhen(c.start_at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
