import { db } from "@/app/lib/db";
import { setTestStatusAction } from "@/app/lib/test-actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string; title: string; type: string; status: string;
  course: string | null; author: string | null;
  qcount: number; attempts: number; avg_score: number | null; avg_total: number | null;
};

const statusBadge: Record<string, string> = {
  published: "bg-green-50 text-green-700",
  draft: "bg-slate-100 text-slate-500",
};

export default function AdminTestsPage() {
  const rows = db.prepare(
    `SELECT t.id, t.title, t.type, t.status, c.name AS course, u.name AS author,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id=t.id) AS qcount,
            (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id=t.id AND a.status='submitted') AS attempts,
            (SELECT AVG(a.score) FROM test_attempts a WHERE a.test_id=t.id AND a.status='submitted') AS avg_score,
            (SELECT AVG(a.total) FROM test_attempts a WHERE a.test_id=t.id AND a.status='submitted') AS avg_total
     FROM tests t
     LEFT JOIN courses c ON c.id=t.course_id
     LEFT JOIN users u ON u.id=t.created_by
     ORDER BY t.created_at DESC`
  ).all() as Row[];

  const published = rows.filter((r) => r.status === "published").length;
  const totalAttempts = rows.reduce((s, r) => s + r.attempts, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Test Series</h1>
        <p className="text-sm text-slate-500">{rows.length} tests · {published} published · {totalAttempts} attempts</p>
      </header>

      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">Test</th>
                <th className="text-left font-medium px-5 py-3">Batch</th>
                <th className="text-left font-medium px-5 py-3">Author</th>
                <th className="text-right font-medium px-5 py-3">Qs</th>
                <th className="text-right font-medium px-5 py-3">Attempts</th>
                <th className="text-right font-medium px-5 py-3">Avg</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-right font-medium px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && <tr><td colSpan={8} className="px-5 py-6 text-center text-slate-400">No tests yet.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-800">{r.title}<span className="ml-2 text-xs text-slate-400 capitalize">{r.type}</span></td>
                  <td className="px-5 py-3 text-slate-500">{r.course ?? "All"}</td>
                  <td className="px-5 py-3 text-slate-500">{r.author ?? "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-700">{r.qcount}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-700">{r.attempts}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                    {r.avg_score !== null ? `${(Math.round(r.avg_score * 10) / 10)}/${r.avg_total}` : "—"}
                  </td>
                  <td className="px-5 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[r.status]}`}>{r.status}</span></td>
                  <td className="px-5 py-3 text-right">
                    <form action={setTestStatusAction} className="inline">
                      <input type="hidden" name="testId" value={r.id} />
                      <input type="hidden" name="status" value={r.status === "published" ? "draft" : "published"} />
                      <button disabled={r.status !== "published" && r.qcount === 0}
                        className="text-xs rounded-md px-3 py-1 border border-gold-100 text-gold-700 hover:bg-gold-50 disabled:opacity-40">
                        {r.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
