import { db } from "@/app/lib/db";
import { sendAttendanceReminderAction } from "@/app/lib/class-actions";

export const dynamic = "force-dynamic";

const LOW = 60; // attendance % below this is flagged

type Row = { user_id: string; student: string; batch: string; total: number; attended: number };

export default async function AdminAttendancePage() {
  const rows = await db.prepare(
    `SELECT u.id AS user_id, u.name AS student, c.id AS course_id, c.name AS batch,
            (SELECT COUNT(*) FROM live_classes lc WHERE lc.course_id=c.id AND lc.status IN ('live','ended')) AS total,
            (SELECT COUNT(*) FROM class_attendance a JOIN live_classes lc ON lc.id=a.class_id
               WHERE lc.course_id=c.id AND lc.status IN ('live','ended') AND a.user_id=u.id) AS attended
     FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id
     WHERE u.role='student' AND c.status='active'
     ORDER BY c.name, u.name`
  ).all() as Row[];

  const pct = (r: Row) => (r.total > 0 ? Math.round((r.attended / r.total) * 100) : null);

  // Batch summary
  const batches = new Map<string, { total: number; attended: number; students: number; endedClasses: number }>();
  for (const r of rows) {
    const b = batches.get(r.batch) ?? { total: 0, attended: 0, students: 0, endedClasses: r.total };
    b.total += r.total; b.attended += r.attended; b.students += 1; b.endedClasses = r.total;
    batches.set(r.batch, b);
  }

  const low = rows.filter((r) => { const p = pct(r); return p !== null && p < LOW; }).sort((a, b) => (pct(a)! - pct(b)!));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">Live-class attendance across batches · {low.length} student{low.length === 1 ? "" : "s"} below {LOW}%</p>
      </header>

      {/* Batch cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[...batches.entries()].map(([name, b]) => {
          const p = b.total > 0 ? Math.round((b.attended / b.total) * 100) : null;
          return (
            <div key={name} className="rounded-xl bg-white border border-slate-200 p-5">
              <div className="text-sm font-semibold text-slate-900">{name}</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 tabular-nums">{p === null ? "—" : `${p}%`}</div>
              <div className="text-xs text-slate-400 mt-1">{b.students} students · {b.endedClasses} classes held</div>
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p ?? 0}%`, background: (p ?? 0) < LOW ? "#DC2626" : "#2f8f63" }} />
              </div>
            </div>
          );
        })}
        {batches.size === 0 && <p className="text-sm text-slate-400">No batches yet.</p>}
      </div>

      {/* Low attendance */}
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Low attendance — needs a nudge</h2>
      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">Student</th>
                <th className="text-left font-medium px-5 py-3">Batch</th>
                <th className="text-right font-medium px-5 py-3">Attended</th>
                <th className="text-right font-medium px-5 py-3">Attendance</th>
                <th className="text-right font-medium px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {low.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400">Everyone is above {LOW}%. 🎉</td></tr>}
              {low.map((r) => {
                const p = pct(r)!;
                return (
                  <tr key={r.user_id + r.batch} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-800">{r.student}</td>
                    <td className="px-5 py-3 text-slate-500">{r.batch}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{r.attended}/{r.total}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-red-600">{p}%</td>
                    <td className="px-5 py-3 text-right">
                      <form action={sendAttendanceReminderAction} className="inline">
                        <input type="hidden" name="userId" value={r.user_id} />
                        <input type="hidden" name="batch" value={r.batch} />
                        <input type="hidden" name="pct" value={p} />
                        <button className="text-xs rounded-md px-3 py-1 border border-gold-100 text-gold-700 hover:bg-gold-50">Send reminder</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs text-slate-400 mt-3">Reminders are delivered in-app. Parent SMS/email would fan out from the same call once a provider is connected.</p>
    </div>
  );
}
