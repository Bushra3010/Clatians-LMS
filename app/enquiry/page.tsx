import { db } from "@/app/lib/db";
import EnquiryForm from "./EnquiryForm";

export const dynamic = "force-dynamic";

export default async function EnquiryPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const courses = (await db.prepare("SELECT name FROM courses WHERE status='active' ORDER BY name").all() as { name: string }[]).map((c) => c.name);
  const sp = await searchParams;
  const ref = typeof sp?.ref === "string" ? sp.ref.toUpperCase().slice(0, 12) : "";
  return <EnquiryForm courses={courses} defaultRef={ref} />;
}
