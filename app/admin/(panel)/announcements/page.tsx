import { db } from "@/app/lib/db";
import { broadcastAnnouncementAction } from "@/app/lib/notification-actions";

export const dynamic = "force-dynamic";

type Course = { id: string; name: string };
type Sent = { title: string; body: string; created_at: string; recipients: number };

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export default async function AdminAnnouncementsPage() {
  const courses = await db.prepare("SELECT id, name FROM courses WHERE status='active' ORDER BY name").all() as Course[];
  const sent = await db.prepare(
    `SELECT title, body, MIN(created_at) AS created_at, COUNT(*) AS recipients
     FROM notifications WHERE type='announcement'
     GROUP BY title, body ORDER BY created_at DESC LIMIT 12`
  ).all() as Sent[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
        <p className="text-sm text-slate-500">Broadcast a message to students&apos; notification inbox</p>
      </header>

      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6 max-w-2xl">
        <form action={broadcastAnnouncementAction} className="space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Title</span>
            <input name="title" required className={inputCls} placeholder="Mock test schedule released" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Message</span>
            <textarea name="body" rows={3} className={inputCls + " resize-y"} placeholder="Write your announcement…" />
          </label>
          <label className="block sm:w-64">
            <span className="block text-xs font-medium text-slate-600 mb-1">Audience</span>
            <select name="courseId" className={inputCls} defaultValue="">
              <option value="">All students</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name} only</option>)}
            </select>
          </label>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-5">Send announcement</button>
          <p className="text-xs text-slate-400">
            🧪 Delivered in-app. Email / SMS / WhatsApp / push would fan out from here once a provider is connected.
          </p>
        </form>
      </section>

      <h2 className="text-sm font-semibold text-slate-900 mb-3">Recent broadcasts</h2>
      <div className="space-y-3 max-w-2xl">
        {sent.length === 0 && <p className="text-sm text-slate-400">No announcements sent yet.</p>}
        {sent.map((s, i) => (
          <div key={i} className="rounded-xl bg-white border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{s.title}</p>
              <span className="text-xs text-slate-400 shrink-0">{fmt(s.created_at)}</span>
            </div>
            {s.body && <p className="text-sm text-slate-600 mt-1">{s.body}</p>}
            <p className="text-xs text-slate-400 mt-2">Sent to {s.recipients} student{s.recipients === 1 ? "" : "s"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
