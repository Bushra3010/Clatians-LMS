import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { sendAttendanceReminderAction } from "@/app/lib/class-actions";

export const dynamic = "force-dynamic";

const LOW = 60;

type ClassRow = { id: string; title: string; start_at: string; batch: string | null; attended: number; enrolled: number };
type StudentRow = { user_id: string; student: string; batch: string; total: number; attended: number };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export default async function TeacherAttendancePage() {
  const user = await requireRole(["teacher", "admin"]);

  const classes = db.prepare(
    `SELECT lc.id, lc.title, lc.start_at, c.name AS batch,
            (SELECT COUNT(*) FROM class_attendance a WHERE a.class_id=lc.id) AS attended,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=lc.course_id) AS enrolled
     FROM live_classes lc LEFT JOIN courses c ON c.id=lc.course_id
     WHERE lc.teacher_id=? AND lc.status='ended'
     ORDER BY lc.start_at DESC`
  ).all(user.id) as ClassRow[];

  const students = db.prepare(
    `SELECT u.id AS user_id, u.name AS student, c.name AS batch,
            (SELECT COUNT(*) FROM live_classes lc WHERE lc.teacher_id=? AND lc.course_id=c.id AND lc.status='ended') AS total,
            (SELECT COUNT(*) FROM class_attendance a JOIN live_classes lc ON lc.id=a.class_id
               WHERE lc.teacher_id=? AND lc.course_id=c.id AND lc.status='ended' AND a.user_id=u.id) AS attended
     FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id
     WHERE u.role='student' AND c.id IN (SELECT DISTINCT course_id FROM live_classes WHERE teacher_id=? AND status='ended')
     ORDER BY c.name, u.name`
  ).all(user.id, user.id, user.id) as StudentRow[];

  const pct = (r: StudentRow) => (r.total > 0 ? Math.round((r.attended / r.total) * 100) : null);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500">Who showed up to your classes</p>
      </header>

      {/* Per-class */}
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Your classes</h2>
      <div className="space-y-2 mb-8">
        {classes.length === 0 && <p className="text-sm text-slate-400">No completed classes yet.</p>}
        {classes.map((c) => {
          const p = c.enrolled > 0 ? Math.round((c.attended / c.enrolled) * 100) : 0;
          return (
            <div key={c.id} className="rounded-xl bg-white border border-slate-200 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{c.title}</p>
                <p className="text-xs text-slate-400">{c.batch ?? "No batch"} · {fmt(c.start_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-slate-900 tabular-nums">{c.attended}/{c.enrolled}</p>
                <p className="text-xs text-slate-400">{p}% attended</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-student roster */}
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Student attendance</h2>
      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">Student</th>
                <th className="text-left font-medium px-5 py-3">Batch</th>
                <th className="text-right font-medium px-5 py-3">Attended</th>
                <th className="text-right font-medium px-5 py-3">%</th>
                <th className="text-right font-medium px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-center text-slate-400">No students yet.</td></tr>}
              {students.map((r) => {
                const p = pct(r);
                const isLow = p !== null && p < LOW;
                return (
                  <tr key={r.user_id + r.batch} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-800">{r.student}</td>
                    <td className="px-5 py-3 text-slate-500">{r.batch}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{r.attended}/{r.total}</td>
                    <td className={`px-5 py-3 text-right tabular-nums font-semibold ${isLow ? "text-red-600" : "text-slate-700"}`}>{p === null ? "—" : `${p}%`}</td>
                    <td className="px-5 py-3 text-right">
                      {isLow && (
                        <form action={sendAttendanceReminderAction} className="inline">
                          <input type="hidden" name="userId" value={r.user_id} />
                          <input type="hidden" name="batch" value={r.batch} />
                          <input type="hidden" name="pct" value={p!} />
                          <button className="text-xs rounded-md px-3 py-1 border border-gold-100 text-gold-700 hover:bg-gold-50">Remind</button>
                        </form>
                      )}
                    </td>
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
