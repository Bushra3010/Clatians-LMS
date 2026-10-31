import { requireAdmin } from "@/app/lib/auth";
import SyllabusEditor from "@/app/components/manage/SyllabusEditor";

export const dynamic = "force-dynamic";

/** Admin editor for a course's study content: subject → chapter → topic. */
export default async function CourseSyllabusPage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireAdmin();
  const { courseId } = await params;
  return <SyllabusEditor courseId={courseId} backHref="/admin/courses" backLabel="Back to Courses" canManageSubjects />;
}
