import ResourcesManager from "@/app/components/manage/ResourcesManager";

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage({ searchParams }: { searchParams: Promise<{ type?: string; edit?: string }> }) {
  const { type, edit } = await searchParams;
  return <ResourcesManager type={type ?? "tip"} basePath="/admin/resources" editId={edit} />;
}
