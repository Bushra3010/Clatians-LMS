import { requireRole } from "@/app/lib/auth";
import TeacherShell from "./TeacherShell";

export default async function TeacherPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["teacher", "admin"]); // redirects to /login otherwise

  return <TeacherShell teacherName={user.name}>{children}</TeacherShell>;
}
