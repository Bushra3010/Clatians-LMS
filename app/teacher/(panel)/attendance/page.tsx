import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { sendAttendanceReminderAction } from "@/app/lib/class-actions";
import { fmtIST } from "@/app/lib/dates";

export const dynamic = "force-dynamic";

const LOW = 60;

type ClassRow = { id: string; title: string; start_at: string; batch: string | null; attended: number; enrolled: number };
type StudentRow = { user_id: string; student: string; batch: string; total: number; attended: number };

function fmt(iso: string) {
  return fmtIST(iso, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export default async function TeacherAttendancePage() {
  const user = await requireRole(["teacher", "admin"]);

  // Teachers see only their own classes; an admin in the Teacher Console sees
  // every class (they don't own any, so scoping to teacher_id would be empty).
  const isAdmin = user.role === "admin";
  const tcLc = isAdmin ? "" : "lc.teacher_id=? AND ";   // with the `lc` alias
  const tcBare = isAdmin ? "" : "teacher_id=? AND ";    // bare (inner subquery)

  const classes = await db.prepare(
    `SELECT lc.id, lc.title, lc.start_at, c.name AS batch,
            (SELECT COUNT(*) FROM class_attendance a WHERE a.class_id=lc.id) AS attended,
            (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=lc.course_id) AS enrolled
     FROM live_classes lc LEFT JOIN courses c ON c.id=lc.course_id
     WHERE ${tcLc}lc.status IN ('live','ended')
     ORDER BY lc.start_at DESC`
  ).all(...(isAdmin ? [] : [user.id])) as ClassRow[];

  const students = await db.prepare(
    `SELECT u.id AS user_id, u.name AS student, c.name AS batch,
            (SELECT COUNT(*) FROM live_classes lc WHERE ${tcLc}lc.course_id=c.id AND lc.status IN ('live','ended')) AS total,
            (SELECT COUNT(*) FROM class_attendance a JOIN live_classes lc ON lc.id=a.class_id
               WHERE ${tcLc}lc.course_id=c.id AND lc.status IN ('live','ended') AND a.user_id=u.id) AS attended
     FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id
     WHERE u.role='student' AND c.id IN (SELECT DISTINCT course_id FROM live_classes WHERE ${tcBare}status IN ('live','ended'))
     ORDER BY c.name, u.name`
  ).all(...(isAdmin ? [] : [user.id, user.id, user.id])) as StudentRow[];

  // Per-student, per-class breakdown for the drill-down.
  const detail = await db.prepare(
    `SELECT e.user_id, c.name AS batch, lc.id AS class_id, lc.title, lc.start_at,
            (EXISTS(SELECT 1 FROM class_attendance a WHERE a.class_id=lc.id AND a.user_id=e.user_id))::int AS present
     FROM enrollments e
     JOIN live_classes lc ON lc.course_id = e.course_id
     JOIN courses c ON c.id = e.course_id
     WHERE ${tcLc}lc.status IN ('live','ended')
     ORDER BY lc.start_at DESC`
  ).all(...(isAdmin ? [] : [user.id])) as { user_id: string; batch: string; class_id: string; title: string; start_at: string; present: number }[];
  const detailFor = (userId: string, batch: string) => detail.filter((d) => d.user_id === userId && d.batch === batch);

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
        {classes.length === 0 && <p className="text-sm text-slate-400">No live or completed classes yet.</p>}
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

      {/* Per-student roster with drill-down */}
      <h2 className="text-sm font-semibold text-slate-900 mb-3">Student attendance</h2>
      <p className="text-xs text-slate-400 mb-3">Tap a student to see class-by-class attendance.</p>
      <div className="space-y-2">
        {students.length === 0 && <p className="text-sm text-slate-400">No students yet.</p>}
        {students.map((r) => {
          const p = pct(r);
          const isLow = p !== null && p < LOW;
          const cls = detailFor(r.user_id, r.batch);
          return (
            <details key={r.user_id + r.batch} className="group rounded-xl bg-white border border-slate-200 overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-5 py-3 cursor-pointer list-none hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.student}</p>
                  <p className="text-xs text-slate-400">{r.batch}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-slate-500 tabular-nums">{r.attended}/{r.total}</span>
                  <span className={`text-sm font-semibold tabular-nums ${isLow ? "text-red-600" : "text-slate-700"}`}>{p === null ? "—" : `${p}%`}</span>
                  <span className="text-slate-300 text-xs transition-transform group-open:rotate-90">▶</span>
                </div>
              </summary>
              <div className="border-t border-slate-100 px-5 py-3">
                {cls.length === 0 ? (
                  <p className="text-xs text-slate-400">No classes held for this batch yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {cls.map((d) => (
                      <li key={d.class_id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <span className="text-slate-700">{d.title}</span>
                          <span className="text-xs text-slate-400 ml-2">{fmt(d.start_at)}</span>
                        </div>
                        <span className={`shrink-0 text-xs rounded px-2 py-0.5 font-medium ${d.present ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                          {d.present ? "Present" : "Absent"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {isLow && (
                  <form action={sendAttendanceReminderAction} className="mt-3">
                    <input type="hidden" name="userId" value={r.user_id} />
                    <input type="hidden" name="batch" value={r.batch} />
                    <input type="hidden" name="pct" value={p!} />
                    <button className="text-xs rounded-md px-3 py-1.5 border border-gold-100 text-gold-700 hover:bg-gold-50">Send attendance reminder</button>
                  </form>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
