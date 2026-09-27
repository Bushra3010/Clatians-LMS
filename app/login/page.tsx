import { redirect } from "next/navigation";
import { auth, HOME_BY_ROLE } from "../lib/auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

// Someone already signed in (e.g. arriving here with the back gesture) goes
// straight to their home instead of seeing a sign-in form — which otherwise
// looks like they were logged out.
export default async function Page() {
  const user = await auth();
  if (user) redirect(HOME_BY_ROLE[user.role] ?? "/");
  return <LoginForm />;
}
