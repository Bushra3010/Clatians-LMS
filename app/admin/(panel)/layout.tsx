import { requireAdmin } from "@/app/lib/auth";
import AdminShell from "./AdminShell";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin(); // redirects to /admin/login unless admin

  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
