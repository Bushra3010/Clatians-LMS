import { redirect } from "next/navigation";

// The admin login has been merged into the common /login. Keep this path working.
export default function AdminLoginRedirect() {
  redirect("/login");
}
