import Link from "next/link";
import FileUploadField from "@/app/components/FileUploadField";
import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/auth";
import {
  createModuleAction,
  createChapterAction,
  createLessonAction,
  updateLessonAction,
  deleteSyllabusNodeAction,
} from "../../../../actions";

export const dynamic = "force-dynamic";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";
const addBtn = "rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px] whitespace-nowrap";
const delBtn = "text-xs rounded border border-red-200 text-red-600 px-2.5 py-1 hover:bg-red-50";

type Module = { id: string; title: string; description: string; subject_name: string | null };
type Chapter = { id: string; module_id: string; title: string };
type Topic = {
  id: string; chapter_id: string; title: string; body: string; video_url: string; notes_url: string;
  test_id: string | null; duration_min: number; is_free: number;
};
type TestOpt = { id: string; title: string; status: string; qcount: number };

function DeleteButton({ courseId, kind, id, label }: { courseId: string; kind: "module" | "chapter" | "lesson"; id: string; label: string }) {
  return (
    <form action={deleteSyllabusNodeAction}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <button className={delBtn}>{label}</button>
    </form>
  );
}

/** Fields of a topic — used by both the add and the edit form. */
function TopicFields({ topic, tests }: { topic?: Topic; tests: TestOpt[] }) {
  return (
    <>
      <label className="block sm:col-span-2">
        <span className="block text-xs font-medium text-slate-600 mb-1">Topic title</span>
        <input name="title" required defaultValue={topic?.title} className={inputCls} placeholder="e.g. Negligence" />
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-slate-600 mb-1">🎥 Video link (YouTube / MP4)</span>
        <input name="videoUrl" defaultValue={topic?.video_url} className={inputCls} placeholder="https://youtu.be/…" />
      </label>
      <div className="block">
        <span className="block text-xs font-medium text-slate-600 mb-1">📎 Notes PDF — paste a link or upload (optional)</span>
        <input name="notesUrl" defaultValue={topic?.notes_url} className={inputCls} placeholder="https://…/notes.pdf" />
        <div className="mt-2">
          <FileUploadField name="notesFileUrl" accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" hint="An uploaded file replaces the link above." />
        </div>
      </div>
      <label className="block sm:col-span-2">
        <span className="block text-xs font-medium text-slate-600 mb-1">📄 Notes (shown in the app)</span>
        <textarea name="body" rows={4} defaultValue={topic?.body} className={inputCls} placeholder="Key points, definitions, examples…" />
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-slate-600 mb-1">📝 Topic test</span>
        <select name="testId" defaultValue={topic?.test_id ?? ""} className={inputCls}>
          <option value="">— no test —</option>
          {tests.map((t) => (
            <option key={t.id} value={t.id}>{t.title} ({t.qcount} Q{t.status !== "published" ? " · draft" : ""})</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
        <label className="block">
          <span className="block text-xs font-medium text-slate-600 mb-1">Video length (min)</span>
          <input name="durationMin" type="number" min={0} defaultValue={topic?.duration_min || ""} className={inputCls} placeholder="0" />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-600 h-[38px]">
          <input type="checkbox" name="isFree" value="1" defaultChecked={!!topic?.is_free} className="accent-gold-600 h-4 w-4" />
          Free preview
        </label>
      </div>
    </>
  );
}

/** Admin editor for a course's study content: subject → chapter → topic. */
export default async function CourseSyllabusPage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireAdmin();
  const { courseId } = await params;

  const course = await db
    .prepare("SELECT id, name, category FROM courses WHERE id = ?")
    .get(courseId) as { id: string; name: string; category: string } | undefined;
  if (!course) return <div className="p-6 text-red-600">Course not found.</div>;

  const subjects = await db
    .prepare("SELECT id, name FROM subjects ORDER BY sort_order, name")
    .all() as { id: string; name: string }[];

  const modules = await db.prepare(
    `SELECT m.id, m.title, m.description, s.name AS subject_name
     FROM modules m LEFT JOIN subjects s ON s.id = m.subject_id
     WHERE m.course_id = ? ORDER BY m.sort_order`
  ).all(courseId) as Module[];

  const chapters = await db.prepare(
    `SELECT id, module_id, title FROM chapters
     WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?)
     ORDER BY sort_order`
  ).all(courseId) as Chapter[];

  const topics = await db.prepare(
    `SELECT id, chapter_id, title, body, video_url, notes_url, test_id, duration_min, is_free FROM lessons
     WHERE chapter_id IN (SELECT id FROM chapters WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?))
     ORDER BY sort_order`
  ).all(courseId) as Topic[];

  // Tests that can be attached to a topic: this course's, plus the shared ones.
  const tests = await db.prepare(
    `SELECT t.id, t.title, t.status, (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS qcount
     FROM tests t WHERE t.course_id = ? OR t.course_id IS NULL
     ORDER BY t.created_at DESC`
  ).all(courseId) as TestOpt[];

  const chaptersOf = (moduleId: string) => chapters.filter((c) => c.module_id === moduleId);
  const topicsOf = (chapterId: string) => topics.filter((l) => l.chapter_id === chapterId);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <Link href="/admin/courses" className="text-sm text-slate-500 hover:text-slate-900">← Back to Courses</Link>
        <h1 className="text-2xl font-semibold text-slate-900 mt-1">{course.name} — Study content</h1>
        <p className="text-sm text-slate-500">
          Subject → Chapter → Topic. Each topic holds its video, notes, a test, and the doubts students ask on it.
        </p>
        <p className="text-sm text-slate-500 mt-1">
          {modules.length} subjects · {chapters.length} chapters · {topics.length} topics
        </p>
      </header>

      {/* Add a subject */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Add a subject to this course</h2>
        <form action={createModuleAction} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <input type="hidden" name="courseId" value={courseId} />
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Subject</span>
            <select name="subjectId" className={inputCls} defaultValue={subjects[0]?.id ?? ""}>
              <option value="">— custom name —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Display name (optional)</span>
            <input name="title" className={inputCls} placeholder="Defaults to the subject name" />
          </label>
          <button className={addBtn}>Add subject</button>
        </form>
        {subjects.length === 0 && (
          <p className="mt-3 text-xs text-slate-500">
            No subjects yet — <Link href="/admin/subjects" className="text-gold-700 hover:underline">create some</Link> first.
          </p>
        )}
      </section>

      {modules.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-10">No subjects yet. Add the first one above.</p>
      )}

      <div className="space-y-5">
        {modules.map((m, mi) => (
          <section key={m.id} className="rounded-xl bg-white border border-slate-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">
                  <span className="text-slate-400 mr-2">{String(mi + 1).padStart(2, "0")}</span>{m.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {m.subject_name && m.subject_name !== m.title ? `Subject: ${m.subject_name}` : "Subject"} · {chaptersOf(m.id).length} chapters
                </p>
              </div>
              <DeleteButton courseId={courseId} kind="module" id={m.id} label="Delete subject" />
            </div>

            <div className="mt-4 space-y-3">
              {chaptersOf(m.id).map((ch, ci) => (
                <div key={ch.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">Chapter {ci + 1}: {ch.title}</p>
                    <DeleteButton courseId={courseId} kind="chapter" id={ch.id} label="Delete chapter" />
                  </div>

                  <ul className="mt-3 divide-y divide-slate-200 rounded-lg bg-white border border-slate-200">
                    {topicsOf(ch.id).length === 0 && (
                      <li className="px-3 py-2 text-xs text-slate-400">No topics yet.</li>
                    )}
                    {topicsOf(ch.id).map((l) => (
                      <li key={l.id} className="px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-slate-700 min-w-0">
                            <span className="font-medium">{l.title}</span>
                            <span className="ml-2 text-xs">
                              <span className={l.video_url ? "text-green-700" : "text-slate-300"}>🎥 video</span>{" · "}
                              <span className={l.body || l.notes_url ? "text-green-700" : "text-slate-300"}>📄 notes</span>{" · "}
                              <span className={l.test_id ? "text-green-700" : "text-slate-300"}>📝 test</span>
                              {l.is_free ? <span className="text-slate-400"> · free preview</span> : null}
                            </span>
                          </span>
                          <DeleteButton courseId={courseId} kind="lesson" id={l.id} label="Remove" />
                        </div>
                        <details className="mt-1">
                          <summary className="text-xs font-medium text-gold-700 cursor-pointer">Edit topic</summary>
                          <form action={updateLessonAction} className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                            <input type="hidden" name="courseId" value={courseId} />
                            <input type="hidden" name="id" value={l.id} />
                            <TopicFields topic={l} tests={tests} />
                            <button className={addBtn + " sm:col-span-2 sm:justify-self-start"}>Save topic</button>
                          </form>
                        </details>
                      </li>
                    ))}
                  </ul>

                  {/* Add a topic to this chapter */}
                  <details className="mt-3">
                    <summary className="text-xs font-semibold text-gold-700 cursor-pointer">+ Add topic</summary>
                    <form action={createLessonAction} className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end rounded-lg bg-white border border-slate-200 p-3">
                      <input type="hidden" name="courseId" value={courseId} />
                      <input type="hidden" name="chapterId" value={ch.id} />
                      <TopicFields tests={tests} />
                      <button className={addBtn + " sm:col-span-2 sm:justify-self-start"}>Add topic</button>
                    </form>
                  </details>
                </div>
              ))}

              {/* Add a chapter to this subject */}
              <form action={createChapterAction} className="flex items-end gap-2">
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="moduleId" value={m.id} />
                <input name="title" required className={inputCls} placeholder={`New chapter in ${m.title}`} />
                <button className={addBtn}>Add chapter</button>
              </form>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
