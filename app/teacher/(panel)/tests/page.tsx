import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { createTestAction, addQuestionAction, setTestStatusAction, deleteTestAction } from "@/app/lib/test-actions";
import { aiConfigured } from "@/app/lib/ai";
import AiGenerateForm from "@/app/components/AiGenerateForm";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // AI question generation can take up to ~40s

type Test = { id: string; title: string; type: string; status: string; duration_min: number; course: string | null; qcount: number; attempts: number };
type Q = { id: string; test_id: string; subject: string; text: string; correct: string };
type Course = { id: string; name: string };

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

export default async function TeacherTestsPage() {
  const user = await requireRole(["teacher", "admin"]);

  const tests = await db.prepare(
    `SELECT t.id, t.title, t.type, t.status, t.duration_min, c.name AS course,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id=t.id) AS qcount,
            (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id=t.id AND a.status='submitted') AS attempts
     FROM tests t LEFT JOIN courses c ON c.id=t.course_id
     WHERE t.created_by=? ORDER BY t.created_at DESC`
  ).all(user.id) as Test[];

  const questions = await db.prepare(
    `SELECT q.id, q.test_id, q.subject, q.text, q.correct FROM questions q
     WHERE q.test_id IN (SELECT id FROM tests WHERE created_by=?) ORDER BY q.order_idx`
  ).all(user.id) as Q[];
  const qByTest = (id: string) => questions.filter((q) => q.test_id === id);

  const courses = await db.prepare("SELECT id, name FROM courses WHERE status='active' ORDER BY name").all() as Course[];
  const aiOn = aiConfigured();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Test Series</h1>
        <p className="text-sm text-slate-500">Build mock tests — publish once you&apos;ve added questions</p>
      </header>

      {/* Create test */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Create a test</h2>
        <form action={createTestAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <label className="block sm:col-span-2 lg:col-span-1"><span className="block text-xs font-medium text-slate-600 mb-1">Title</span>
            <input name="title" required className={inputCls} placeholder="Full Mock 2" /></label>
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Type</span>
            <select name="type" className={inputCls} defaultValue="mock">
              <option value="mock">Full Mock</option><option value="sectional">Sectional</option><option value="pyq">Previous Year</option>
            </select></label>
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Batch</span>
            <select name="courseId" className={inputCls} defaultValue="">
              <option value="">All batches</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Duration (min)</span>
            <input name="duration" type="number" min={5} step={5} defaultValue={30} className={inputCls} /></label>
          <label className="block sm:col-span-2 lg:col-span-3"><span className="block text-xs font-medium text-slate-600 mb-1">Description</span>
            <input name="description" className={inputCls} placeholder="Optional" /></label>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px]">Create</button>
        </form>
      </section>

      {/* Tests */}
      <div className="space-y-4">
        {tests.length === 0 && <p className="text-sm text-slate-400">No tests yet.</p>}
        {tests.map((t) => (
          <div key={t.id} className="rounded-xl bg-white border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${t.status === "published" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{t.status}</span>
                  <span className="text-xs text-slate-400 capitalize">{t.type}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mt-1">{t.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{t.qcount} questions · {t.duration_min} min · {t.course ?? "All batches"} · {t.attempts} attempts</p>
              </div>
              <div className="shrink-0 flex flex-col gap-2">
                <form action={setTestStatusAction}>
                  <input type="hidden" name="testId" value={t.id} />
                  <input type="hidden" name="status" value={t.status === "published" ? "draft" : "published"} />
                  <button disabled={t.status !== "published" && t.qcount === 0}
                    className="w-28 text-xs rounded-md px-3 py-1.5 border border-gold-100 text-gold-700 hover:bg-gold-50 disabled:opacity-40">
                    {t.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <form action={deleteTestAction}>
                  <input type="hidden" name="testId" value={t.id} />
                  <button className="w-28 text-xs rounded-md px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50">Delete</button>
                </form>
              </div>
            </div>

            {/* Existing questions */}
            {qByTest(t.id).length > 0 && (
              <ol className="mt-4 border-t border-slate-100 pt-3 space-y-1.5 list-decimal list-inside">
                {qByTest(t.id).map((q) => (
                  <li key={q.id} className="text-sm text-slate-700">
                    {q.text} <span className="text-xs text-green-700 font-medium">(ans: {q.correct.toUpperCase()})</span>
                  </li>
                ))}
              </ol>
            )}

            {/* Add question */}
            <details className="mt-3 border-t border-slate-100 pt-3">
              <summary className="text-xs font-medium text-gold-700 cursor-pointer">+ Add a question</summary>
              <form action={addQuestionAction} className="mt-3 space-y-2">
                <input type="hidden" name="testId" value={t.id} />
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2">
                  <input name="subject" className={inputCls} placeholder="Subject (e.g. Legal Reasoning)" />
                  <input name="text" required className={inputCls} placeholder="Question text" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input name="a" required className={inputCls} placeholder="Option A" />
                  <input name="b" required className={inputCls} placeholder="Option B" />
                  <input name="c" required className={inputCls} placeholder="Option C" />
                  <input name="d" required className={inputCls} placeholder="Option D" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600">Correct answer</label>
                  <select name="correct" className={inputCls + " !w-24"} defaultValue="a">
                    <option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option>
                  </select>
                  <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4">Add question</button>
                </div>
              </form>
            </details>

            {/* Generate questions with AI */}
            <details className="mt-2 border-t border-slate-100 pt-3">
              <summary className="text-xs font-semibold cursor-pointer" style={{ color: "#6B4A28" }}>✨ Generate questions with AI</summary>
              {aiOn ? (
                <AiGenerateForm testId={t.id} />
              ) : (
                <p className="mt-2 text-xs text-amber-700">AI generation is off — an admin needs to set <code>GEMINI_API_KEY</code>.</p>
              )}
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
