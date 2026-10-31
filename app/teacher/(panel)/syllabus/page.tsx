import Link from "next/link";
import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

type CourseRow = { id: string; name: string; subjects: number; chapters: number; topics: number; pdfs: number };

/** Courses a teacher can add study content to: videos, notes PDFs and tests per topic. */
export default async function TeacherSyllabusListPage() {
  await requireRole(["teacher", "admin"]);
  const courses = await db.prepare(
    `SELECT c.id, c.name,
            (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) AS subjects,
            (SELECT COUNT(*) FROM chapters ch JOIN modules m ON m.id = ch.module_id WHERE m.course_id = c.id) AS chapters,
            (SELECT COUNT(*) FROM lessons l JOIN chapters ch ON ch.id = l.chapter_id JOIN modules m ON m.id = ch.module_id WHERE m.course_id = c.id) AS topics,
            (SELECT COUNT(*) FROM lessons l JOIN chapters ch ON ch.id = l.chapter_id JOIN modules m ON m.id = ch.module_id WHERE m.course_id = c.id AND l.notes_url <> '') AS pdfs
     FROM courses c WHERE c.status = 'active' ORDER BY c.name`
  ).all() as CourseRow[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Study Content</h1>
        <p className="text-sm text-slate-500">
          Pick a course to add chapters and topics, attach notes PDFs, and choose whether students may download them or only view them in the app.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {courses.length === 0 && <p className="text-sm text-slate-400">No active courses yet.</p>}
        {courses.map((c) => (
          <Link key={c.id} href={`/teacher/syllabus/${c.id}`} className="rounded-xl bg-white border border-slate-200 p-5 hover:border-gold-500 transition-colors">
            <p className="font-semibold text-slate-900">{c.name}</p>
            <p className="text-xs text-slate-500 mt-1">
              {Number(c.subjects)} subjects · {Number(c.chapters)} chapters · {Number(c.topics)} topics · {Number(c.pdfs)} notes files
            </p>
            <p className="text-xs font-medium text-gold-700 mt-3">Edit study content →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
