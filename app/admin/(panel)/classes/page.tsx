import { db } from "@/app/lib/db";
import {
  createClassAction,
  setClassStatusAction,
  deleteClassAction,
} from "@/app/lib/class-actions";
import { fmtIST } from "@/app/lib/dates";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  subject: string;
  start_at: string;
  duration_min: number;
  status: string;
  join_url: string;
  course: string | null;
  teacher: string | null;
  attendees: number;
};
type Course = { id: string; name: string };
type Teacher = { id: string; name: string };

const statusBadge: Record<string, string> = {
  scheduled: "bg-gold-50 text-gold-700",
  live: "bg-red-50 text-red-600",
  ended: "bg-green-50 text-green-700",
  cancelled: "bg-slate-100 text-slate-500",
};

function fmt(iso: string) {
  return fmtIST(iso, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function AdminClassesPage() {
  const rows = await db
    .prepare(
      `SELECT lc.id, lc.title, lc.subject, lc.start_at, lc.duration_min, lc.status, lc.join_url,
              c.name AS course, u.name AS teacher,
              (SELECT COUNT(*) FROM class_attendance a WHERE a.class_id = lc.id) AS attendees
       FROM live_classes lc
       LEFT JOIN courses c ON c.id = lc.course_id
       LEFT JOIN users u ON u.id = lc.teacher_id
       ORDER BY lc.start_at DESC`
    )
    .all() as Row[];

  const courses = await db
    .prepare("SELECT id, name FROM courses WHERE status='active' ORDER BY name")
    .all() as Course[];
  const teachers = await db
    .prepare("SELECT id, name FROM users WHERE role='teacher' AND status='active' ORDER BY name")
    .all() as Teacher[];

  const liveCount = rows.filter((r) => r.status === "live").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Live Classes</h1>
        <p className="text-sm text-slate-500">
          {rows.length} classes · {liveCount} live now · across all batches
        </p>
      </header>

      {/* Schedule a class */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Schedule a class</h2>
        <form action={createClassAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Title" className="sm:col-span-2 lg:col-span-1">
            <input name="title" required className={inputCls} placeholder="Landmark SC Judgements" />
          </Field>
          <Field label="Subject">
            <input name="subject" className={inputCls} placeholder="Legal Reasoning" />
          </Field>
          <Field label="Batch">
            <select name="courseId" className={inputCls} defaultValue="">
              <option value="">— Select batch —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Faculty">
            <select name="teacherId" className={inputCls} defaultValue={teachers[0]?.id ?? ""}>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Starts at">
            <input name="startAt" type="datetime-local" required className={inputCls} />
          </Field>
          <Field label="Duration (min)">
            <input name="duration" type="number" min={15} step={15} defaultValue={60} className={inputCls} />
          </Field>
          <Field label="Repeat">
            <select name="repeat" className={inputCls} defaultValue="none">
              <option value="none">One-time</option>
              <option value="weekly">Weekly</option>
            </select>
          </Field>
          <Field label="Occurrences (if weekly)">
            <input name="occurrences" type="number" min={1} max={12} defaultValue={1} className={inputCls} />
          </Field>
          <Field label="YouTube link (live stream or video)" className="sm:col-span-2">
            <input name="joinUrl" type="url" className={inputCls} placeholder="https://www.youtube.com/watch?v=…" />
          </Field>
          <div className="flex items-end">
            <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-5 h-[38px]">
              Schedule
            </button>
          </div>
        </form>
      </section>

      {/* Class list */}
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-400">No classes scheduled yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl bg-white border border-slate-200 p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[r.status]}`}>
                  {r.status === "live" ? "● live" : r.status}
                </span>
                <span className="text-xs text-slate-400">{r.subject}</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mt-1">{r.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {fmt(r.start_at)} · {r.duration_min} min · {r.course ?? "No batch"} · {r.teacher ?? "Unassigned"}
              </p>
              <p className="text-xs text-slate-500 mt-1">{r.attendees} attended</p>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              {r.status !== "cancelled" && r.status !== "ended" && (
                <form action={setClassStatusAction}>
                  <input type="hidden" name="classId" value={r.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <button className="w-24 text-xs rounded-md px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50">
                    Cancel
                  </button>
                </form>
              )}
              <form action={deleteClassAction}>
                <input type="hidden" name="classId" value={r.id} />
                <button className="w-24 text-xs rounded-md px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
