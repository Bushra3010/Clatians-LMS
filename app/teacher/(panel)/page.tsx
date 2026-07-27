import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

type Recent = {
  id: string;
  title: string;
  type: string;
  status: string;
  course: string | null;
  created_at: string;
};

const statusBadge: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

export default async function TeacherDashboard() {
  const user = await requireRole(["teacher", "admin"]);

  const countBy = async (status?: string) =>
    (
      await db
        .prepare(
          `SELECT COUNT(*) AS n FROM content WHERE author_id = ?${
            status ? " AND status = ?" : ""
          }`
        )
        .get(...(status ? [user.id, status] : [user.id])) as { n: number }
    ).n;

  const total = await countBy();
  const pending = await countBy("pending");
  const approved = await countBy("approved");
  const rejected = await countBy("rejected");
  const activeCourses = (
    await db.prepare("SELECT COUNT(*) AS n FROM courses WHERE status='active'").get() as { n: number }
  ).n;

  const recent = await db
    .prepare(
      `SELECT ct.id, ct.title, ct.type, ct.status, ct.created_at, c.name AS course
       FROM content ct LEFT JOIN courses c ON c.id = ct.course_id
       WHERE ct.author_id = ? ORDER BY ct.created_at DESC LIMIT 6`
    )
    .all(user.id) as Recent[];

  const cards = [
    { label: "Total Submissions", value: total, tone: "text-gold-700 bg-gold-50" },
    { label: "Pending Review", value: pending, tone: "text-amber-600 bg-amber-50" },
    { label: "Approved (live)", value: approved, tone: "text-green-600 bg-green-50" },
    { label: "Needs Changes", value: rejected, tone: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.name}</h1>
          <p className="text-sm text-slate-500">Your teaching content at a glance</p>
        </div>
        <a
          href="/teacher/content"
          className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4"
        >
          + New content
        </a>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white border border-slate-200 p-5">
            <div className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${c.tone}`}>
              {c.label}
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-900">{c.value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-xl bg-white border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent submissions</h2>
          <span className="text-xs text-slate-400">{activeCourses} active courses</span>
        </div>
        <div className="space-y-3">
          {recent.length === 0 && (
            <p className="text-sm text-slate-400">
              You haven&apos;t submitted anything yet. Start with{" "}
              <a href="/teacher/content" className="text-gold-700 hover:underline">
                New content
              </a>
              .
            </p>
          )}
          {recent.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0"
            >
              <div className="min-w-0">
                <div className="text-sm text-slate-800 truncate">{r.title}</div>
                <div className="text-xs text-slate-400">
                  {r.type} · {r.course ?? "No course"}
                </div>
              </div>
              <span className={`shrink-0 text-xs rounded px-2 py-0.5 ${statusBadge[r.status]}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
