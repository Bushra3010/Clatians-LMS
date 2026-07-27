import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import {
  createClassAction,
  setClassStatusAction,
  saveRecordingAction,
} from "@/app/lib/class-actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  subject: string;
  start_at: string;
  duration_min: number;
  status: string;
  join_url: string;
  recording_url: string;
  notes: string;
  course: string | null;
  attendees: number;
};
type Course = { id: string; name: string };

const statusBadge: Record<string, string> = {
  scheduled: "bg-gold-50 text-gold-700",
  live: "bg-red-50 text-red-600",
  ended: "bg-green-50 text-green-700",
  cancelled: "bg-slate-100 text-slate-500",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function TeacherClassesPage() {
  const user = await requireRole(["teacher", "admin"]);

  const rows = await db
    .prepare(
      `SELECT lc.id, lc.title, lc.subject, lc.start_at, lc.duration_min, lc.status,
              lc.join_url, lc.recording_url, lc.notes, c.name AS course,
              (SELECT COUNT(*) FROM class_attendance a WHERE a.class_id = lc.id) AS attendees
       FROM live_classes lc
       LEFT JOIN courses c ON c.id = lc.course_id
       WHERE lc.teacher_id = ?
       ORDER BY CASE lc.status WHEN 'live' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END, lc.start_at DESC`
    )
    .all(user.id) as Row[];

  const courses = await db
    .prepare("SELECT id, name FROM courses WHERE status='active' ORDER BY name")
    .all() as Course[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Live Classes</h1>
        <p className="text-sm text-slate-500">Schedule and run your online sessions</p>
      </header>

      {/* Schedule */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Schedule a class</h2>
        <form action={createClassAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Title" className="lg:col-span-1 sm:col-span-2">
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

      {/* List */}
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-400">No classes yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl bg-white border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[r.status]}`}>
                    {r.status === "live" ? "● live" : r.status}
                  </span>
                  <span className="text-xs text-slate-400">{r.subject}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mt-1">{r.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {fmt(r.start_at)} · {r.duration_min} min · {r.course ?? "No batch"}
                </p>
                <p className="text-xs text-slate-500 mt-1">{r.attendees} students attended</p>
              </div>

              <div className="shrink-0 flex flex-col gap-2">
                {r.status === "scheduled" && (
                  <>
                    <StatusBtn id={r.id} status="live" label="Start" cls="bg-gold-600 text-white hover:bg-gold-700 border-transparent" />
                    <StatusBtn id={r.id} status="cancelled" label="Cancel" cls="border-slate-200 text-slate-500 hover:bg-slate-50" />
                  </>
                )}
                {r.status === "live" && (
                  <StatusBtn id={r.id} status="ended" label="End class" cls="border-red-200 text-red-600 hover:bg-red-50" />
                )}
                {r.join_url && r.status !== "ended" && r.status !== "cancelled" && (
                  <a
                    href={r.join_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-24 text-center text-xs rounded-md px-3 py-1.5 border border-gold-100 text-gold-700 hover:bg-gold-50"
                  >
                    Open link
                  </a>
                )}
              </div>
            </div>

            {/* Recording — for ended classes */}
            {r.status === "ended" && (
              <form action={saveRecordingAction} className="mt-4 border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-[2fr_2fr_auto] gap-2 items-end">
                <input type="hidden" name="classId" value={r.id} />
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Recording URL</span>
                  <input name="recordingUrl" type="url" defaultValue={r.recording_url} className={inputCls} placeholder="https://…" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Notes for students</span>
                  <input name="notes" defaultValue={r.notes} className={inputCls} placeholder="Optional" />
                </label>
                <button className="rounded-lg border border-gold-100 text-gold-700 hover:bg-gold-50 text-sm py-2 px-4 h-[38px]">
                  Save
                </button>
              </form>
            )}
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

function StatusBtn({ id, status, label, cls }: { id: string; status: string; label: string; cls: string }) {
  return (
    <form action={setClassStatusAction}>
      <input type="hidden" name="classId" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`w-24 text-xs rounded-md px-3 py-1.5 border transition ${cls}`}>{label}</button>
    </form>
  );
}
