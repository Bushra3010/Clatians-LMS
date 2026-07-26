import { db } from "@/app/lib/db";
import EnquiryForm from "./EnquiryForm";

export const dynamic = "force-dynamic";

export default function EnquiryPage() {
  const courses = (db.prepare("SELECT name FROM courses WHERE status='active' ORDER BY name").all() as { name: string }[]).map((c) => c.name);
  return <EnquiryForm courses={courses} />;
}
