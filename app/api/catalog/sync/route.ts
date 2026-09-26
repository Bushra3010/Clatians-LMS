import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/auth";
import { syncCatalog, seedStudyContent } from "@/app/lib/catalog/sync";

export const dynamic = "force-dynamic";

/** Admin-triggered re-sync of the course catalog from the CLATians website. */
export async function POST() {
  await requireAdmin();
  const result = await syncCatalog();
  // Study content is seeded alongside, so a re-sync also fills any gaps.
  const content = await seedStudyContent();
  return NextResponse.json({ ...result, content });
}
