import { db } from "@/app/lib/db";
import Link from "next/link";
import {
  syncCatalogAction,
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
  slug: string | null;
  name: string;
  description: string;
  status: string;
  price: number;
  category: string;
  icon: string;
  duration: string;
  students: number;
  batches: number;
  lessons: number;
  tests: number;
};
type Student = { id: string; name: string };

export default async function CoursesPage() {
  const courses = await db
    .prepare(
      `SELECT c.id, c.slug, c.name, c.description, c.status, c.price, c.category, c.icon, c.duration,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS students,
              (SELECT COUNT(*) FROM batches b WHERE b.course_id = c.id) AS batches,
              (SELECT COUNT(*) FROM lessons l
                 JOIN chapters ch ON ch.id = l.chapter_id
                 JOIN modules m ON m.id = ch.module_id
               WHERE m.course_id = c.id) AS lessons,
              (SELECT COUNT(*) FROM tests t WHERE t.course_id = c.id) AS tests
       FROM courses c ORDER BY c.sort_order, c.created_at DESC`
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

  const synced = courses.filter((c) => c.slug).length;
  const websiteLabel = process.env.WEBSITE_URL || "the bundled catalog mirror";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Courses &amp; Batches</h1>
          <p className="text-sm text-slate-500">
            {courses.length} courses · {synced} mirrored from the website
          </p>
        </div>
        <form action={syncCatalogAction} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 max-w-[220px]">
            Pulls courses, batches and faculty from {websiteLabel}.
          </span>
          <button className="rounded-lg border border-gold-100 text-gold-700 hover:bg-gold-50 text-sm font-medium py-2 px-4 h-[38px] whitespace-nowrap">
            ↻ Sync from website
          </button>
        </form>
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
            <input name="price" type="number" min={0} step={1} defaultValue={0} className={inputCls} />
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
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">
                  <span className="mr-1.5">{c.icon}</span>{c.name}
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">{c.description || "No description"}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {[c.slug ? `/${c.slug}` : "local only", c.category, c.duration].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                  c.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {c.status}
              </span>
            </div>

            <div className="mt-3 text-sm text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span><span className="font-semibold text-slate-900">{c.students}</span> students</span>
              <span><span className="font-semibold text-slate-900">{c.batches}</span> batches</span>
              <span><span className="font-semibold text-slate-900">{c.lessons}</span> lessons</span>
              <span><span className="font-semibold text-slate-900">{c.tests}</span> tests</span>
              <span className="font-semibold text-gold-700">{c.price > 0 ? `₹${c.price.toLocaleString("en-IN")}` : "Free"}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link href={`/admin/courses/${c.id}/syllabus`} className="rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 py-1.5 px-3">
                Study content (subjects · topics) →
              </Link>
              <Link href="/admin/batches" className="rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 py-1.5 px-3">
                Batches →
              </Link>
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
                  <input name="price" type="number" min={0} step={1} defaultValue={c.price} className={inputCls} />
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
