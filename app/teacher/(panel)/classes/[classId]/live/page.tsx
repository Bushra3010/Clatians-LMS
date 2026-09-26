import Link from "next/link";
import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { setClassStatusAction } from "@/app/lib/class-actions";
import { youtubeId } from "@/app/lib/youtube";
import TeacherLiveConsole from "@/app/components/TeacherLiveConsole";

export const dynamic = "force-dynamic";

/** Teacher's live console for one class: stream preview + private student Q&A. */
export default async function LiveConsolePage({ params }: { params: Promise<{ classId: string }> }) {
  const user = await requireRole(["teacher", "admin"]);
  const { classId } = await params;

  const cls = await db.prepare(
    `SELECT lc.id, lc.title, lc.subject, lc.status, lc.join_url, lc.teacher_id, c.name AS course
     FROM live_classes lc LEFT JOIN courses c ON c.id = lc.course_id WHERE lc.id = ?`
  ).get(classId) as { id: string; title: string; subject: string; status: string; join_url: string; teacher_id: string | null; course: string | null } | undefined;

  if (!cls || (user.role !== "admin" && cls.teacher_id !== user.id)) {
    return <div className="p-6 text-red-600">Class not found.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/teacher/classes" className="text-sm text-slate-500 hover:text-slate-900">← Back to classes</Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">{cls.title}</h1>
          <p className="text-sm text-slate-500">{[cls.subject, cls.course].filter(Boolean).join(" · ")}</p>
        </div>
        <form action={setClassStatusAction} className="flex gap-2">
          <input type="hidden" name="classId" value={cls.id} />
          {cls.status === "scheduled" && (
            <button name="status" value="live" className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4">Go live</button>
          )}
          {cls.status === "live" && (
            <button name="status" value="ended" className="rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2 px-4">End class</button>
          )}
        </form>
      </header>

      <TeacherLiveConsole classId={cls.id} ytId={youtubeId(cls.join_url)} title={cls.title} />
    </div>
  );
}
