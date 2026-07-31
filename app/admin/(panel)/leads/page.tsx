import { db } from "@/app/lib/db";
import { updateLeadStatusAction, saveLeadNoteAction, deleteLeadAction } from "@/app/lib/lead-actions";
import { convertLeadAction } from "../../actions";
import { fmtIST } from "@/app/lib/dates";
import ExportCsvButton from "@/app/components/ExportCsvButton";
import ListFilter from "@/app/components/ListFilter";

export const dynamic = "force-dynamic";

type Lead = {
  id: string; name: string; phone: string; email: string; interest: string;
  demo_date: string; message: string; status: string; notes: string; created_at: string;
};
type Course = { id: string; name: string };

const STATUSES = ["new", "contacted", "demo", "enrolled", "lost"] as const;
const statusStyle: Record<string, string> = {
  new: "bg-sky-50 text-sky-700",
  contacted: "bg-amber-50 text-amber-700",
  demo: "bg-purple-50 text-purple-700",
  enrolled: "bg-green-50 text-green-700",
  lost: "bg-slate-100 text-slate-500",
};
const statusLabel: Record<string, string> = { new: "New", contacted: "Contacted", demo: "Demo booked", enrolled: "Enrolled", lost: "Lost" };

function fmt(iso: string) {
  return fmtIST(iso, { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminLeadsPage() {
  const leads = await db.prepare(
    `SELECT * FROM leads
     ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'contacted' THEN 1 WHEN 'demo' THEN 2 WHEN 'enrolled' THEN 3 ELSE 4 END, created_at DESC`
  ).all() as Lead[];

  const courses = await db.prepare("SELECT id, name FROM courses WHERE status='active' ORDER BY name").all() as Course[];
  const counts = STATUSES.map((s) => ({ s, n: leads.filter((l) => l.status === s).length }));
  const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

  const csvRows = leads.map((l) => [l.name, l.phone, l.email, l.interest, statusLabel[l.status] ?? l.status, l.notes, fmt(l.created_at)]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admissions &amp; Leads</h1>
          <p className="text-sm text-slate-500">{leads.length} enquiries · public form at <span className="font-mono">/enquiry</span></p>
        </div>
        <ExportCsvButton
          filename={`leads-${new Date().toISOString().slice(0, 10)}`}
          headers={["Name", "Phone", "Email", "Interest", "Status", "Notes", "Enquired"]}
          rows={csvRows}
        />
      </header>

      {/* Pipeline counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {counts.map(({ s, n }) => (
          <div key={s} className="rounded-xl bg-white border border-slate-200 p-4">
            <div className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${statusStyle[s]}`}>{statusLabel[s]}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{n}</div>
          </div>
        ))}
      </div>

      {/* Leads */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Enquiries</h2>
        <ListFilter selector="#leads-list > [data-lead]" placeholder="Search name, phone, email…" emptyId="leads-empty" />
      </div>
      <div id="leads-list" className="space-y-3">
        {leads.length === 0 && <p className="text-sm text-slate-400">No enquiries yet.</p>}
        <p id="leads-empty" className="text-sm text-slate-400" style={{ display: "none" }}>No enquiries match your search.</p>
        {leads.map((l) => (
          <div key={l.id} data-lead className="rounded-xl bg-white border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle[l.status]}`}>{statusLabel[l.status]}</span>
                  {l.interest && <span className="text-xs text-slate-400">{l.interest}</span>}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mt-1">{l.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  📞 {l.phone}{l.email ? ` · ✉ ${l.email}` : ""}{l.demo_date ? ` · 🎟 demo ${l.demo_date}` : ""}
                </p>
                {l.message && <p className="text-sm text-slate-600 mt-2">“{l.message}”</p>}
                <p className="text-xs text-slate-400 mt-2">Enquired {fmt(l.created_at)}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <form action={updateLeadStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="leadId" value={l.id} />
                  <select name="status" defaultValue={l.status} className={inputCls + " !w-36"}>
                    {STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                  </select>
                  <button className="text-xs rounded-md px-3 py-2 border border-gold-100 text-gold-700 hover:bg-gold-50 whitespace-nowrap">Update</button>
                </form>
                <form action={deleteLeadAction}>
                  <input type="hidden" name="leadId" value={l.id} />
                  <button className="text-xs rounded-md px-3 py-2 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50">Delete</button>
                </form>
              </div>
            </div>

            {/* Follow-up note */}
            <form action={saveLeadNoteAction} className="mt-3 border-t border-slate-100 pt-3 flex items-end gap-2">
              <input type="hidden" name="leadId" value={l.id} />
              <label className="flex-1 block">
                <span className="block text-xs font-medium text-slate-600 mb-1">Follow-up note</span>
                <input name="notes" defaultValue={l.notes} className={inputCls} placeholder="Add a counselling note…" />
              </label>
              <button className="rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2 px-4 h-[38px]">Save</button>
            </form>

            {/* Convert to student account */}
            <details className="mt-2 border-t border-slate-100 pt-3">
              <summary className="text-xs font-medium text-green-700 cursor-pointer">🎓 Convert to student</summary>
              <form action={convertLeadAction} className="mt-3 grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_2fr_auto] gap-2 items-end">
                <input type="hidden" name="leadId" value={l.id} />
                <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Login email</span>
                  <input name="email" type="email" required defaultValue={l.email} className={inputCls} placeholder="student@email.com" /></label>
                <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Set password</span>
                  <input name="password" required minLength={6} className={inputCls} placeholder="min 6 chars" /></label>
                <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Enroll in batch (optional)</span>
                  <select name="courseId" className={inputCls} defaultValue="">
                    <option value="">— No batch —</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></label>
                <button className="rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 h-[38px]">Create</button>
              </form>
              <p className="mt-1 text-[11px] text-slate-400">Creates a student login (share the password with them) and marks this lead as enrolled. Skips creation if the email already has an account.</p>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
