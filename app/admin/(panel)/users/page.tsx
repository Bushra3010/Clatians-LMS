import { db } from "@/app/lib/db";
import { createUserAction, setUserStatusAction, editUserAction, resetUserPasswordAction } from "../../actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

const roleBadge: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  teacher: "bg-emerald-50 text-emerald-700",
  student: "bg-sky-50 text-sky-700",
};

export default async function UsersPage() {
  const users = await db
    .prepare("SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC")
    .all() as Row[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">{users.length} accounts · manage students, teachers and admins</p>
      </header>

      {/* Create user */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Add a user</h2>
        <form action={createUserAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <Field label="Full name">
            <input name="name" required className={inputCls} placeholder="Jane Doe" />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required className={inputCls} placeholder="jane@clatlms.in" />
          </Field>
          <Field label="Role">
            <select name="role" className={inputCls} defaultValue="student">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Temp password">
            <input name="password" type="text" required className={inputCls} placeholder="••••••" />
          </Field>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px]">
            Add user
          </button>
        </form>
      </section>

      {/* Users table */}
      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-5 py-3">Name</th>
              <th className="text-left font-medium px-5 py-3">Email</th>
              <th className="text-left font-medium px-5 py-3">Role</th>
              <th className="text-left font-medium px-5 py-3">Status</th>
              <th className="text-right font-medium px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-slate-800">{u.name}</td>
                <td className="px-5 py-3 text-slate-500">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${roleBadge[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      u.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <form action={setUserStatusAction} className="inline">
                    <input type="hidden" name="userId" value={u.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={u.status === "active" ? "suspended" : "active"}
                    />
                    <button
                      className={`text-xs rounded-md px-3 py-1 border transition ${
                        u.status === "active"
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {u.status === "active" ? "Suspend" : "Reactivate"}
                    </button>
                  </form>
                  <details className="mt-1 text-left">
                    <summary className="text-xs font-medium text-gold-700 cursor-pointer text-right">Manage</summary>
                    <div className="mt-2 flex flex-col sm:flex-row flex-wrap gap-3 justify-end">
                      <form action={editUserAction} className="flex items-end gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <input name="name" required defaultValue={u.name} className={inputCls + " !w-40"} aria-label="Name" />
                        <select name="role" defaultValue={u.role} className={inputCls + " !w-28"} aria-label="Role">
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button className="text-xs rounded-md px-3 py-1.5 border border-gold-100 text-gold-700 hover:bg-gold-50">Save</button>
                      </form>
                      <form action={resetUserPasswordAction} className="flex items-end gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <input name="password" required minLength={6} placeholder="New password" className={inputCls + " !w-40"} aria-label="New password" />
                        <button className="text-xs rounded-md px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50">Reset password</button>
                      </form>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
