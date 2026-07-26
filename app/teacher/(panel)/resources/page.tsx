import { requireRole } from "@/app/lib/auth";
import ResourcesManager from "@/app/components/manage/ResourcesManager";

export const dynamic = "force-dynamic";

export default async function TeacherResourcesPage({ searchParams }: { searchParams: Promise<{ type?: string; edit?: string }> }) {
  await requireRole(["teacher", "admin"]);
  const { type, edit } = await searchParams;
  return <ResourcesManager type={type ?? "tip"} basePath="/teacher/resources" editId={edit} />;
}
