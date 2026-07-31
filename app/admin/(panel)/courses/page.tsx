import { db } from "@/app/lib/db";
import {
  createCourseAction,
  editCourseAction,
  setCourseStatusAction,
  enrollStudentAction,
  unenrollStudentAction,
  bulkEnrollAction,
} from "../../actions";

export const dynamic = "force-dynamic";

type Course = {
  id: string;
  name: string;
  description: string;
  status: string;
  price: number;
  students: number;
};
type Student = { id: string; name: string };

export default async function CoursesPage() {
  const courses = await db
    .prepare(
      `SELECT c.id, c.name, c.description, c.status, c.price,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS students
       FROM courses c ORDER BY c.created_at DESC`
    )
    .all() as Course[];

  const students = await db
    .prepare("SELECT id, name FROM users WHERE role='student' AND status='active' ORDER BY name")
    .all() as Student[];

  const enrolledRows = await db
    .prepare(
      `SELECT e.course_id, u.id AS user_id, u.name
       FROM enrollments e JOIN users u ON u.id = e.user_id
       ORDER BY u.name`
    )
    .all() as { course_id: string; user_id: string; name: string }[];
  const enrolledByCourse = (courseId: string) => enrolledRows.filter((r) => r.course_id === courseId);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Courses &amp; Batches</h1>
        <p className="text-sm text-slate-500">{courses.length} courses · create batches and enroll students</p>
      </header>

      {/* Create course */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Create a course / batch</h2>
        <form action={createCourseAction} className="grid grid-cols-1 sm:grid-cols-[2fr_3fr_1fr_auto] gap-3 items-end">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Name</span>
            <input name="name" required className={inputCls} placeholder="CLAT 2028" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Description</span>
            <input name="description" className={inputCls} placeholder="Short description" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Price (₹, 0 = free)</span>
            <input name="price" type="number" min={0} step={100} defaultValue={0} className={inputCls} />
          </label>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px]">
            Create
          </button>
        </form>
      </section>

      {/* Course cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {courses.map((c) => (
          <div key={c.id} className="rounded-xl bg-white border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{c.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{c.description || "No description"}</p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                  c.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {c.status}
              </span>
            </div>

            <div className="mt-3 text-sm text-slate-600 flex items-center gap-4">
              <span><span className="font-semibold text-slate-900">{c.students}</span> students</span>
              <span className="font-semibold text-gold-700">{c.price > 0 ? `₹${c.price.toLocaleString("en-IN")}` : "Free"}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-2">
              {/* Enroll */}
              <form action={enrollStudentAction} className="flex items-end gap-2">
                <input type="hidden" name="courseId" value={c.id} />
                <select name="userId" className={inputCls + " !w-44"} defaultValue="">
                  <option value="" disabled>
                    Enroll student…
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg border border-gold-100 text-gold-700 hover:bg-gold-50 text-sm py-2 px-3 h-[38px]">
                  Enroll
                </button>
              </form>

              {/* Archive / activate */}
              <form action={setCourseStatusAction}>
                <input type="hidden" name="courseId" value={c.id} />
                <input
                  type="hidden"
                  name="status"
                  value={c.status === "active" ? "archived" : "active"}
                />
                <button className="rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm py-2 px-3 h-[38px]">
                  {c.status === "active" ? "Archive" : "Reactivate"}
                </button>
              </form>
            </div>

            {/* Bulk enroll — everyone not already in this batch */}
            {students.filter((s) => !enrolledByCourse(c.id).some((e) => e.user_id === s.id)).length > 0 && (
              <details className="mt-4 border-t border-slate-100 pt-3">
                <summary className="text-xs font-medium text-gold-700 cursor-pointer">
                  Bulk enroll ({students.filter((s) => !enrolledByCourse(c.id).some((e) => e.user_id === s.id)).length} available)
                </summary>
                <form action={bulkEnrollAction} className="mt-3">
                  <input type="hidden" name="courseId" value={c.id} />
                  <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                    {students
                      .filter((s) => !enrolledByCourse(c.id).some((e) => e.user_id === s.id))
                      .map((s) => (
                        <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer">
                          <input type="checkbox" name="userIds" value={s.id} className="accent-gold-600 h-4 w-4" />
                          {s.name}
                        </label>
                      ))}
                  </div>
                  <button className="mt-2 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4">
                    Enroll selected
                  </button>
                </form>
              </details>
            )}

            {/* Edit */}
            <details className="mt-4 border-t border-slate-100 pt-3">
              <summary className="text-xs font-medium text-gold-700 cursor-pointer">Edit details</summary>
              <form action={editCourseAction} className="mt-3 grid grid-cols-1 sm:grid-cols-[2fr_3fr_1fr_auto] gap-3 items-end">
                <input type="hidden" name="courseId" value={c.id} />
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Name</span>
                  <input name="name" required defaultValue={c.name} className={inputCls} />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Description</span>
                  <input name="description" defaultValue={c.description} className={inputCls} placeholder="Short description" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1">Price (₹, 0 = free)</span>
                  <input name="price" type="number" min={0} step={100} defaultValue={c.price} className={inputCls} />
                </label>
                <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px]">
                  Save
                </button>
              </form>
            </details>

            {/* Enrolled students */}
            {enrolledByCourse(c.id).length > 0 && (
              <details className="mt-2 border-t border-slate-100 pt-3">
                <summary className="text-xs font-medium text-gold-700 cursor-pointer">
                  Enrolled students ({enrolledByCourse(c.id).length})
                </summary>
                <ul className="mt-3 space-y-1.5">
                  {enrolledByCourse(c.id).map((s) => (
                    <li key={s.user_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-700">{s.name}</span>
                      <form action={unenrollStudentAction}>
                        <input type="hidden" name="courseId" value={c.id} />
                        <input type="hidden" name="userId" value={s.user_id} />
                        <button className="text-xs rounded-md px-2.5 py-1 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition">
                          Remove
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";
