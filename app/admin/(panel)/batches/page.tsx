import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/auth";
import { createBatchAction, setBatchStatusAction, deleteBatchAction } from "../../actions";

export const dynamic = "force-dynamic";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

/** `highlights` is stored as a JSON array of strings. */
function firstHighlight(raw: string): string {
  try {
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list) && typeof list[0] === "string" ? list[0] : "";
  } catch {
    return "";
  }
}

export default async function BatchesPage() {
  await requireAdmin();

  const courses = await db.prepare("SELECT id, name FROM courses ORDER BY name").all() as { id: string; name: string }[];
  const batches = await db.prepare(`SELECT b.*, c.name AS course_name FROM batches b LEFT JOIN courses c ON c.id = b.course_id ORDER BY c.sort_order, b.fee`).all() as {
    id: string; name: string; slug: string; course_id: string; course_name: string | null; category: string;
    start_date: string; end_date: string; mode: string; seats: number; filled: number;
    fee: number; status: string; language: string; batch_type: string; chips: string; highlights: string;
  }[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Batches</h1>
        <p className="text-sm text-slate-500">{batches.length} batches across {courses.length} courses</p>
      </header>

      {/* Create Batch */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Create Batch</h2>
        <form action={createBatchAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Course</span>
            <select name="courseId" className={inputCls}>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Batch Name</span>
            <input name="name" required className={inputCls} placeholder="CLAT 2027 - Batch A" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Start Date</span>
            <input name="startDate" type="date" className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">End Date</span>
            <input name="endDate" type="date" className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Mode</span>
            <select name="mode" className={inputCls}>
              <option value="Offline">Offline</option><option value="Online Live">Online Live</option>
              <option value="Online Recorded">Online Recorded</option><option value="Hybrid">Hybrid</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Seats</span>
            <input name="seats" type="number" min={1} className={inputCls} defaultValue={30} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Fee (₹)</span>
            <input name="fee" type="number" min={0} className={inputCls} defaultValue={0} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Language</span>
            <select name="language" className={inputCls}>
              <option value="Hinglish">Hinglish</option><option value="English">English</option>
              <option value="Bilingual">Bilingual</option>
            </select>
          </label>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px] sm:col-span-2 lg:col-span-4">Create Batch</button>
        </form>
      </section>

      {/* Batch List */}
      <div className="space-y-4">
        {batches.length === 0 && <p className="text-sm text-slate-400 text-center py-10">No batches yet. Create one above.</p>}
        {batches.map((b) => {
          const seatPct = b.seats > 0 ? Math.round((b.filled / b.seats) * 100) : 0;
          const isFillingFast = seatPct >= 80;
          return (
            <div key={b.id} className="rounded-xl bg-white border border-slate-200 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{b.name}</h3>
                  <p className="text-sm text-slate-500">{[b.course_name, b.mode, b.language].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${b.status === 'ongoing' ? 'bg-green-50 text-green-700' : b.status === 'upcoming' ? 'bg-blue-50 text-blue-700' : b.status === 'archived' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>{b.status}</span>
                  {isFillingFast && <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-700">Filling Fast</span>}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                <span>{b.start_date || 'TBD'} → {b.end_date || 'TBD'}</span>
                <span className="font-semibold text-gold-700">₹{b.fee.toLocaleString("en-IN")}</span>
                <span>{b.filled}/{b.seats} seats</span>
                {firstHighlight(b.highlights) && <span className="text-slate-400 truncate max-w-[200px]">{firstHighlight(b.highlights)}</span>}
              </div>
              <div className="mt-2">
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${isFillingFast ? 'bg-red-500' : 'bg-gold-500'}`} style={{ width: `${seatPct}%` }} />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <form action={setBatchStatusAction}>
                  <input type="hidden" name="batchId" value={b.id} />
                  <input type="hidden" name="status" value={b.status === "archived" ? "upcoming" : "archived"} />
                  <button className="text-xs rounded border border-slate-200 px-3 py-1.5 hover:bg-slate-50">{b.status === "archived" ? "Reactivate" : "Archive"}</button>
                </form>
                <form action={deleteBatchAction}>
                  <input type="hidden" name="batchId" value={b.id} />
                  <button className="text-xs rounded border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50">Delete</button>
                </form>
                <a href={`/admin/batches/${b.id}/enrollments`} className="text-xs rounded border border-gold-100 text-gold-700 px-3 py-1.5 hover:bg-gold-50">Enrollments</a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
