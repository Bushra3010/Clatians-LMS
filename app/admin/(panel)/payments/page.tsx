import { db } from "@/app/lib/db";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  amount: number;
  status: string;
  method: string;
  invoice_no: string;
  created_at: string;
  student: string | null;
  course: string | null;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const statusBadge: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

export default async function AdminPaymentsPage() {
  const rows = await db
    .prepare(
      `SELECT p.id, p.amount, p.status, p.method, p.invoice_no, p.created_at,
              u.name AS student, c.name AS course
       FROM payments p
       LEFT JOIN users u ON u.id = p.user_id
       LEFT JOIN courses c ON c.id = p.course_id
       ORDER BY p.created_at DESC`
    )
    .all() as Row[];

  const revenue = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const paidCount = rows.filter((r) => r.status === "paid").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Fees &amp; Payments</h1>
        <p className="text-sm text-slate-500">{rows.length} transactions · invoices from batch enrollments</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <div className="inline-block rounded-md px-2 py-0.5 text-xs font-medium text-gold-700 bg-gold-50">Total revenue</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900 tabular-nums">{inr(revenue)}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <div className="inline-block rounded-md px-2 py-0.5 text-xs font-medium text-green-700 bg-green-50">Paid invoices</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900 tabular-nums">{paidCount}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <div className="inline-block rounded-md px-2 py-0.5 text-xs font-medium text-sky-700 bg-sky-50">Avg. order</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900 tabular-nums">{inr(paidCount ? Math.round(revenue / paidCount) : 0)}</div>
        </div>
      </div>

      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3">Invoice</th>
                <th className="text-left font-medium px-5 py-3">Student</th>
                <th className="text-left font-medium px-5 py-3">Batch</th>
                <th className="text-right font-medium px-5 py-3">Amount</th>
                <th className="text-left font-medium px-5 py-3">Status</th>
                <th className="text-left font-medium px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-6 text-center text-slate-400">No payments yet.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{r.invoice_no}</td>
                  <td className="px-5 py-3 text-slate-800">{r.student ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{r.course ?? "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-900">{inr(r.amount)}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{fmt(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
