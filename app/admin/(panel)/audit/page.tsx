import { db } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type Row = {
  id: string; actor_name: string; actor_role: string;
  action: string; detail: string; created_at: string;
};

const roleStyle: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  teacher: "bg-emerald-50 text-emerald-700",
  "": "bg-slate-100 text-slate-500",
};

function fmt(iso: string) {
  return new Date(iso + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export default function AdminAuditPage() {
  const rows = db.prepare(
    "SELECT id, actor_name, actor_role, action, detail, created_at FROM audit_log ORDER BY created_at DESC LIMIT 200"
  ).all() as Row[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
        <p className="text-sm text-slate-500">{rows.length} recent staff actions · newest first</p>
      </header>

      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">When</th>
                <th className="text-left font-medium px-5 py-3">Who</th>
                <th className="text-left font-medium px-5 py-3">Action</th>
                <th className="text-left font-medium px-5 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-slate-400">No actions logged yet.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{fmt(r.created_at)}</td>
                  <td className="px-5 py-3">
                    <span className="text-slate-800">{r.actor_name}</span>
                    {r.actor_role && <span className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium capitalize ${roleStyle[r.actor_role] ?? roleStyle[""]}`}>{r.actor_role}</span>}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-700">{r.action}</td>
                  <td className="px-5 py-3 text-slate-500">{r.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
