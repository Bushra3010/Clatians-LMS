import Link from "next/link";
import { db } from "@/app/lib/db";
import { createResourceAction, updateResourceAction, setResourceStatusAction, deleteResourceAction } from "@/app/lib/resource-actions";

const TABS: { type: string; label: string; one: string }[] = [
  { type: "tip", label: "Tips & Tricks", one: "tip" },
  { type: "story", label: "Success Stories", one: "success story" },
  { type: "update", label: "What's New", one: "update" },
  { type: "vocab", label: "Vocabulary", one: "word" },
  { type: "caq", label: "CA Quiz", one: "quiz question" },
  { type: "nlu", label: "NLU Cut-offs", one: "college" },
];

const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";
const lbl = "block text-xs font-medium text-slate-600 mb-1";

type Row = { id: string; type: string; title: string; body: string; data: string; status: string; order_idx: number };
function parse(d: string): Record<string, unknown> { try { return JSON.parse(d); } catch { return {}; } }

export default function ResourcesManager({ type, basePath, editId }: { type: string; basePath: string; editId?: string }) {
  const active = TABS.some((t) => t.type === type) ? type : "tip";
  const rows = db.prepare("SELECT id, type, title, body, data, status, order_idx FROM resources WHERE type = ? ORDER BY order_idx, created_at").all(active) as Row[];
  const tab = TABS.find((t) => t.type === active)!;
  const { label, one } = tab;

  const editing = editId ? rows.find((r) => r.id === editId) : undefined;
  const ed = editing ? parse(editing.data) : {};
  const opts = Array.isArray(ed.options) ? (ed.options as string[]) : [];
  // defaultValue helper — only pre-fill when editing
  const D = (v: unknown, fallback?: string) => (editing ? String(v ?? "") : fallback);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Content Library</h1>
        <p className="text-sm text-slate-500">Manage the tips, stories, updates and quizzes students see</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <Link key={t.type} href={`${basePath}?type=${t.type}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${t.type === active ? "bg-brand-900 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* Create / edit form */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">{editing ? "Edit" : "Add"} {one}</h2>
          {editing && <Link href={`${basePath}?type=${active}`} className="text-xs text-slate-500 hover:underline">Cancel edit</Link>}
        </div>
        <form action={editing ? updateResourceAction : createResourceAction} className="space-y-3">
          <input type="hidden" name="type" value={active} />
          {editing && <input type="hidden" name="resourceId" value={editing.id} />}

          {active === "tip" && (<>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_auto] gap-3">
              <label className="block"><span className={lbl}>Title</span><input name="title" required defaultValue={D(editing?.title)} className={input} placeholder="Master Legal Reasoning" /></label>
              <label className="block"><span className={lbl}>Subject tag</span><input name="tag" defaultValue={D(ed.tag)} className={input} placeholder="Legal Reasoning" /></label>
              <label className="block"><span className={lbl}>Icon</span><input name="icon" defaultValue={D(ed.icon, "💡")} className={input} /></label>
            </div>
            <label className="block"><span className={lbl}>Preview</span><input name="body" defaultValue={D(editing?.body)} className={input} placeholder="One-line summary" /></label>
            <label className="block"><span className={lbl}>Key points (one per line)</span><textarea name="points" rows={4} defaultValue={editing ? (Array.isArray(ed.points) ? (ed.points as string[]).join("\n") : "") : undefined} className={input + " resize-y"} placeholder={"Re-read the principle first.\nApply only what it says."} /></label>
          </>)}

          {active === "story" && (<>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block"><span className={lbl}>Student name</span><input name="title" required defaultValue={D(editing?.title)} className={input} placeholder="Shreya Agarwal" /></label>
              <label className="block"><span className={lbl}>College</span><input name="college" defaultValue={D(ed.college)} className={input} placeholder="NLU Delhi" /></label>
              <label className="block"><span className={lbl}>Rank</span><input name="rank" defaultValue={D(ed.rank)} className={input} placeholder="AIR 3" /></label>
            </div>
            <label className="block"><span className={lbl}>Quote</span><input name="body" defaultValue={D(editing?.body)} className={input} placeholder="The mock tests were exactly like the real exam." /></label>
          </>)}

          {active === "update" && (<>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3">
              <label className="block"><span className={lbl}>Title</span><input name="title" required defaultValue={D(editing?.title)} className={input} placeholder="New mock test is live" /></label>
              <label className="block"><span className={lbl}>Tag</span><input name="tag" defaultValue={D(ed.tag)} className={input} placeholder="New Test" /></label>
              <label className="block"><span className={lbl}>Date label</span><input name="dateLabel" defaultValue={D(ed.dateLabel)} className={input} placeholder="This week" /></label>
              <label className="block"><span className={lbl}>Icon</span><input name="icon" defaultValue={D(ed.icon, "✨")} className={input} /></label>
            </div>
            <label className="block"><span className={lbl}>Description</span><input name="body" defaultValue={D(editing?.body)} className={input} placeholder="Short description" /></label>
            <label className="block"><span className={lbl}>“Learn more” detail</span><input name="more" defaultValue={D(ed.more)} className={input} placeholder="How to access this" /></label>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="hot" defaultChecked={editing ? !!ed.hot : false} /> Mark as 🔥 Hot</label>
          </>)}

          {active === "vocab" && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block"><span className={lbl}>Word</span><input name="title" required defaultValue={D(editing?.title)} className={input} placeholder="Ephemeral" /></label>
              <label className="block"><span className={lbl}>Meaning</span><input name="body" required defaultValue={D(editing?.body)} className={input} placeholder="Lasting for a very short time" /></label>
            </div>
            <label className="block"><span className={lbl}>Example sentence</span><input name="example" defaultValue={D(ed.example)} className={input} placeholder="Fame can be ephemeral." /></label>
          </>)}

          {active === "nlu" && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block"><span className={lbl}>College name</span><input name="title" required defaultValue={D(editing?.title)} className={input} placeholder="NLSIU Bangalore" /></label>
              <label className="block"><span className={lbl}>City</span><input name="city" defaultValue={D(ed.city)} className={input} placeholder="Bengaluru" /></label>
            </div>
            <p className="text-xs font-medium text-slate-600">Closing ranks by category</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(["general", "obc", "ews", "sc", "st"] as const).map((c) => (
                <label key={c} className="block"><span className={lbl + " uppercase"}>{c}</span><input name={c} type="number" min={0} defaultValue={editing ? String(ed[c] ?? 0) : undefined} className={input} placeholder="0" /></label>
              ))}
            </div>
          </>)}

          {active === "caq" && (<>
            <label className="block"><span className={lbl}>Question</span><input name="title" required defaultValue={D(editing?.title)} className={input} placeholder="Which body conducts the CLAT exam?" /></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block"><span className={lbl}>Option A</span><input name="optA" required defaultValue={D(opts[0])} className={input} /></label>
              <label className="block"><span className={lbl}>Option B</span><input name="optB" required defaultValue={D(opts[1])} className={input} /></label>
              <label className="block"><span className={lbl}>Option C</span><input name="optC" required defaultValue={D(opts[2])} className={input} /></label>
              <label className="block"><span className={lbl}>Option D</span><input name="optD" required defaultValue={D(opts[3])} className={input} /></label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 items-end">
              <label className="block"><span className={lbl}>Correct</span>
                <select name="correct" className={input + " !w-28"} defaultValue={editing ? String(ed.correct ?? 0) : "0"}><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select>
              </label>
              <label className="block"><span className={lbl}>Explanation</span><input name="explain" defaultValue={D(ed.explain)} className={input} placeholder="Why the answer is correct" /></label>
            </div>
          </>)}

          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-5">{editing ? "Save changes" : `Add ${one}`}</button>
        </form>
      </section>

      {/* List */}
      <div className="space-y-2">
        <p className="text-sm text-slate-500 mb-1">{rows.length} {label.toLowerCase()}</p>
        {rows.length === 0 && <p className="text-sm text-slate-400">Nothing here yet.</p>}
        {rows.map((r) => {
          const d = parse(r.data);
          const sub =
            active === "story" ? `${d.college ?? ""} · ${d.rank ?? ""}` :
            active === "vocab" ? String(r.body) :
            active === "caq" ? `Ans: ${["A", "B", "C", "D"][Number(d.correct) || 0]}` :
            active === "nlu" ? `${d.city ?? ""} · Gen ${d.general ?? 0}` :
            String(d.tag ?? r.body ?? "");
          const isEditing = editing?.id === r.id;
          return (
            <div key={r.id} className={`rounded-xl bg-white border p-4 flex items-start justify-between gap-4 ${isEditing ? "border-gold-500" : "border-slate-200"}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${r.status === "published" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                  {sub && <span className="text-xs text-slate-400 truncate">{sub}</span>}
                </div>
                <p className="text-sm font-medium text-slate-900 mt-1">{r.title}</p>
              </div>
              <div className="shrink-0 flex flex-col gap-2">
                <Link href={`${basePath}?type=${active}&edit=${r.id}`} className="w-24 text-center text-xs rounded-md px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50">Edit</Link>
                <form action={setResourceStatusAction}>
                  <input type="hidden" name="resourceId" value={r.id} />
                  <input type="hidden" name="status" value={r.status === "published" ? "draft" : "published"} />
                  <button className="w-24 text-xs rounded-md px-3 py-1.5 border border-gold-100 text-gold-700 hover:bg-gold-50">{r.status === "published" ? "Unpublish" : "Publish"}</button>
                </form>
                <form action={deleteResourceAction}>
                  <input type="hidden" name="resourceId" value={r.id} />
                  <button className="w-24 text-xs rounded-md px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50">Delete</button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
