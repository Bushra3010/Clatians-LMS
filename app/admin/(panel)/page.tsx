import { db } from "@/app/lib/db";

export const dynamic = "force-dynamic";

async function scalar(sql: string): Promise<number> {
  return (await db.prepare(sql).get() as { n: number }).n;
}

type CourseRow = { name: string; students: number; status: string };
type ContentRow = {
  id: string;
  title: string;
  type: string;
  author: string | null;
  created_at: string;
};

export default async function DashboardPage() {
  const students = await scalar("SELECT COUNT(*) AS n FROM users WHERE role='student'");
  const teachers = await scalar("SELECT COUNT(*) AS n FROM users WHERE role='teacher'");
  const activeCourses = await scalar("SELECT COUNT(*) AS n FROM courses WHERE status='active'");
  const pendingContent = await scalar("SELECT COUNT(*) AS n FROM content WHERE status='pending'");
  const suspended = await scalar("SELECT COUNT(*) AS n FROM users WHERE status='suspended'");
  const approvedContent = await scalar("SELECT COUNT(*) AS n FROM content WHERE status='approved'");

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

  const maxStudents = Math.max(1, ...courseRows.map((c) => c.students));

  const cards = [
    { label: "Students", value: students, sub: `${suspended} suspended`, tone: "gold" },
    { label: "Teachers", value: teachers, sub: "faculty", tone: "emerald" },
    { label: "Active Courses", value: activeCourses, sub: "batches", tone: "sky" },
    { label: "Pending Approval", value: pendingContent, sub: `${approvedContent} approved`, tone: "amber" },
  ];

  const tone: Record<string, string> = {
    gold: "text-gold-700 bg-gold-50",
    emerald: "text-emerald-600 bg-emerald-50",
    sky: "text-sky-600 bg-sky-50",
    amber: "text-amber-600 bg-amber-50",
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Platform overview and analytics</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white border border-slate-200 p-5">
            <div className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${tone[c.tone]}`}>
              {c.label}
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">{c.value}</div>
            <div className="text-xs text-slate-400 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment by course */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Enrollment by course</h2>
          <div className="space-y-3">
            {courseRows.length === 0 && (
              <p className="text-sm text-slate-400">No courses yet.</p>
            )}
            {courseRows.map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-700">
                    {c.name}
                    {c.status === "archived" && (
                      <span className="ml-2 text-xs text-slate-400">(archived)</span>
                    )}
                  </span>
                  <span className="text-slate-500">{c.students}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gold-500 rounded-full"
                    style={{ width: `${(c.students / maxStudents) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pending approvals */}
        <section className="rounded-xl bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Awaiting approval</h2>
            <a href="/admin/content" className="text-xs text-gold-700 hover:underline">
              View all →
            </a>
          </div>
          <div className="space-y-3">
            {pendingRows.length === 0 && (
              <p className="text-sm text-slate-400">Nothing pending. All caught up. 🎉</p>
            )}
            {pendingRows.map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                <div className="min-w-0">
                  <div className="text-sm text-slate-800 truncate">{r.title}</div>
                  <div className="text-xs text-slate-400">
                    {r.type} · {r.author ?? "Unknown"}
                  </div>
                </div>
                <span className="shrink-0 text-xs bg-amber-50 text-amber-600 rounded px-2 py-0.5">
                  pending
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
