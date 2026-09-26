import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/auth";
import { createSubjectAction, deleteSubjectAction } from "../../actions";

export const dynamic = "force-dynamic";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

export default async function SubjectsPage() {
  await requireAdmin();
  const subjects = await db.prepare("SELECT * FROM subjects ORDER BY sort_order, name").all() as { id: string; name: string; slug: string; description: string; icon: string; color: string; sort_order: number }[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Subjects</h1>
        <p className="text-sm text-slate-500">{subjects.length} subjects · manage course subjects</p>
      </header>

      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Add Subject</h2>
        <form action={createSubjectAction} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_auto] gap-3 items-end">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Name</span>
            <input name="name" required className={inputCls} placeholder="English Language" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Slug</span>
            <input name="slug" className={inputCls} placeholder="english (auto from name)" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Icon</span>
            <input name="icon" className={inputCls} placeholder="📖" maxLength={4} />
          </label>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px]">Add</button>
        </form>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => (
          <div key={s.id} className="rounded-xl bg-white border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <p className="font-medium text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-400">/{s.slug}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-4">{s.description}</p>
            <div className="flex gap-2">
              <form action={deleteSubjectAction}>
                <input type="hidden" name="subjectId" value={s.id} />
                <button className="text-xs rounded border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
