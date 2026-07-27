import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { createContentAction, deleteContentAction } from "../../actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  type: string;
  body: string;
  status: string;
  course: string | null;
  created_at: string;
};
type Course = { id: string; name: string };

const typeLabel: Record<string, string> = {
  video: "🎥 Video",
  notes: "📄 Notes",
  practice: "📝 Practice",
  "current-affairs": "🗞 Current Affairs",
};

const statusBadge: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

export default async function TeacherContentPage() {
  const user = await requireRole(["teacher", "admin"]);

  const rows = await db
    .prepare(
      `SELECT ct.id, ct.title, ct.type, ct.body, ct.status, ct.created_at, c.name AS course
       FROM content ct LEFT JOIN courses c ON c.id = ct.course_id
       WHERE ct.author_id = ?
       ORDER BY CASE ct.status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END, ct.created_at DESC`
    )
    .all(user.id) as Row[];

  const courses = await db
    .prepare("SELECT id, name FROM courses WHERE status='active' ORDER BY name")
    .all() as Course[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">My Content</h1>
        <p className="text-sm text-slate-500">
          Submit lectures, notes and practice sets — they go live once an admin approves them.
        </p>
      </header>

      {/* Create content */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Submit new content</h2>
        <form action={createContentAction} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block sm:col-span-1">
              <span className="block text-xs font-medium text-slate-600 mb-1">Type</span>
              <select name="type" className={inputCls} defaultValue="video">
                <option value="video">Video lecture</option>
                <option value="notes">Study notes</option>
                <option value="practice">Practice questions</option>
                <option value="current-affairs">Current affairs</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-slate-600 mb-1">Title</span>
              <input name="title" required className={inputCls} placeholder="e.g. Legal Reasoning: Torts Basics" />
            </label>
          </div>

          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Course (optional)</span>
            <select name="courseId" className={inputCls} defaultValue="">
              <option value="">— No specific course —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Upload file (PDF / video) — optional</span>
            <input
              name="file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,video/*,image/*"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gold-600 file:px-4 file:py-2 file:text-white file:text-sm file:font-medium hover:file:bg-gold-700 file:cursor-pointer"
            />
            <span className="block text-xs text-slate-400 mt-1">Uploaded here, or paste a link below (e.g. a YouTube URL for video). Max 50 MB.</span>
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Link or description</span>
            <textarea
              name="body"
              rows={3}
              className={inputCls + " resize-y"}
              placeholder="Paste a link (YouTube, PDF URL) or a short description. A file upload above takes priority."
            />
          </label>

          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-5">
            Submit for approval
          </button>
        </form>
      </section>

      {/* My submissions */}
      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-slate-400">No submissions yet.</p>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-xl bg-white border border-slate-200 p-5 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">{typeLabel[r.type] ?? r.type}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadge[r.status]}`}>
                  {r.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mt-1">{r.title}</h3>
              {r.body && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{r.body}</p>}
              <p className="text-xs text-slate-400 mt-2">{r.course ?? "No course"}</p>
            </div>

            <form action={deleteContentAction} className="shrink-0">
              <input type="hidden" name="contentId" value={r.id} />
              <button className="text-xs rounded-md px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition">
                Withdraw
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";
