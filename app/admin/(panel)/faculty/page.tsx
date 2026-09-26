import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/auth";
import { listFaculty } from "@/app/lib/course-actions";
import { createFacultyAction, deleteFacultyAction } from "../../actions";

export const dynamic = "force-dynamic";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

export default async function AdminFacultyPage() {
  await requireAdmin();
  const faculty = await listFaculty();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Faculty</h1>
        <p className="text-sm text-slate-500">{faculty.length} faculty members · manage teacher profiles</p>
      </header>

      {/* Create Faculty */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Add Faculty Member</h2>
        <form action={createFacultyAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Name</span>
            <input name="name" required className={inputCls} placeholder="Adv. Priya Singh" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Designation</span>
            <input name="designation" className={inputCls} placeholder="Senior Faculty" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Subject</span>
            <input name="subject" className={inputCls} placeholder="English" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Experience</span>
            <input name="experience" className={inputCls} placeholder="10 Years" />
          </label>
          <label className="block lg:col-span-2">
            <span className="block text-xs font-medium text-slate-600 mb-1">Bio</span>
            <input name="bio" className={inputCls} placeholder="Short bio" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Avatar (initials)</span>
            <input name="avatar" className={inputCls} placeholder="PS" maxLength={3} />
          </label>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px]">Add</button>
        </form>
      </section>

      {/* Faculty List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {faculty.map((f) => (
          <div key={f.id} className="rounded-xl bg-white border border-slate-200 p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ background: f.color }}>{f.avatar || f.name.slice(0, 2).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{f.name}</p>
                <p className="text-xs text-slate-500">{f.designation}</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <p><span className="font-medium">Subject:</span> {f.subject}</p>
              <p><span className="font-medium">Specialization:</span> {f.specialization}</p>
              <p><span className="font-medium">Experience:</span> {f.experience}</p>
            </div>
            {f.bio && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{f.bio}</p>}
            <div className="flex gap-2">
              <form action={deleteFacultyAction}>
                <input type="hidden" name="facultyId" value={f.id} />
                <button className="text-xs rounded border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
