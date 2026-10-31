import { requireRole } from "@/app/lib/auth";
import SyllabusEditor from "@/app/components/manage/SyllabusEditor";

export const dynamic = "force-dynamic";

/** Teacher editor for a course's study content — videos, notes PDFs, tests per topic. */
export default async function TeacherSyllabusPage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireRole(["teacher", "admin"]);
  const { courseId } = await params;
  return <SyllabusEditor courseId={courseId} backHref="/teacher/syllabus" backLabel="Back to Study Content" canManageSubjects={false} />;
}
