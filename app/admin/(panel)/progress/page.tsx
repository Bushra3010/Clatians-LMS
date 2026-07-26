import { db } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type Row = {
  id: string; student: string; total: number; done: number;
  test_avg: number | null; tests_taken: number;
};

export default function AdminProgressPage() {
  const rows = db.prepare(
    `SELECT u.id, u.name AS student,
       (SELECT COUNT(*) FROM content ct WHERE ct.status='approved'
          AND (ct.course_id IN (SELECT course_id FROM enrollments WHERE user_id=u.id) OR ct.course_id IS NULL)) AS total,
       (SELECT COUNT(*) FROM content_progress cp JOIN content ct ON ct.id=cp.content_id
          WHERE cp.user_id=u.id AND ct.status='approved') AS done,
       (SELECT ROUND(AVG(a.score*100.0/a.total)) FROM test_attempts a WHERE a.user_id=u.id AND a.status='submitted' AND a.total>0) AS test_avg,
       (SELECT COUNT(*) FROM test_attempts a WHERE a.user_id=u.id AND a.status='submitted') AS tests_taken
     FROM users u WHERE u.role='student' ORDER BY u.name`
  ).all() as Row[];

  const bar = (p: number) => (p < 40 ? "#DC2626" : p < 70 ? "#D97706" : "#2f8f63");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Progress</h1>
        <p className="text-sm text-slate-500">Content completion &amp; test performance per student</p>
      </header>

      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">Student</th>
                <th className="text-left font-medium px-5 py-3 w-48">Content completion</th>
                <th className="text-right font-medium px-5 py-3">Items</th>
                <th className="text-right font-medium px-5 py-3">Tests</th>
                <th className="text-right font-medium px-5 py-3">Test avg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400">No students yet.</td></tr>}
              {rows.map((r) => {
                const p = r.total > 0 ? Math.round((r.done / r.total) * 100) : 0;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-800">{r.student}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p}%`, background: bar(p) }} />
                        </div>
                        <span className="text-xs tabular-nums text-slate-500 w-9 text-right">{p}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{r.done}/{r.total}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{r.tests_taken}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-700">{r.test_avg === null ? "—" : `${r.test_avg}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
