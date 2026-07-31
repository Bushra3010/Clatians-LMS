import { db } from "@/app/lib/db";
import { recordPaymentAction } from "../../actions";
import { fmtIST } from "@/app/lib/dates";
import ExportCsvButton from "@/app/components/ExportCsvButton";

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
type Student = { id: string; name: string };
type Course = { id: string; name: string };

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const statusBadge: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
};

function fmt(iso: string) {
  return fmtIST(iso, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
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

  const students = await db
    .prepare("SELECT id, name FROM users WHERE role='student' AND status='active' ORDER BY name")
    .all() as Student[];
  const courses = await db
    .prepare("SELECT id, name FROM courses WHERE status='active' ORDER BY name")
    .all() as Course[];

  const paid = rows.filter((r) => r.status === "paid");
  const revenue = paid.reduce((s, r) => s + r.amount, 0);
  const paidCount = paid.length;

  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM (UTC)
  const monthRevenue = paid
    .filter((r) => r.created_at.slice(0, 7) === monthKey)
    .reduce((s, r) => s + r.amount, 0);

  // Revenue by batch (paid only).
  const byCourse = new Map<string, number>();
  for (const r of paid) {
    const key = r.course ?? "No batch / other";
    byCourse.set(key, (byCourse.get(key) ?? 0) + r.amount);
  }
  const courseRevenue = [...byCourse.entries()].sort((a, b) => b[1] - a[1]);

  const csvRows = rows.map((r) => [r.invoice_no, r.student ?? "", r.course ?? "", r.amount, r.method, r.status, fmt(r.created_at)]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Fees &amp; Payments</h1>
          <p className="text-sm text-slate-500">{rows.length} transactions · invoices from batch enrollments</p>
        </div>
        <ExportCsvButton
          filename={`payments-${new Date().toISOString().slice(0, 10)}`}
          headers={["Invoice", "Student", "Batch", "Amount (INR)", "Method", "Status", "Date"]}
          rows={csvRows}
        />
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <div className="inline-block rounded-md px-2 py-0.5 text-xs font-medium text-gold-700 bg-gold-50">Total revenue</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900 tabular-nums">{inr(revenue)}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <div className="inline-block rounded-md px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50">This month</div>
          <div className="mt-3 text-3xl font-semibold text-slate-900 tabular-nums">{inr(monthRevenue)}</div>
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

      {/* Record an offline payment */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Record a payment (cash / cheque / bank / UPI)</h2>
        <form action={recordPaymentAction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_2fr_1fr_1fr_auto] gap-3 items-end">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Student</span>
            <select name="userId" required className={inputCls} defaultValue="">
              <option value="" disabled>Select student…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Batch (also enrolls)</span>
            <select name="courseId" className={inputCls} defaultValue="">
              <option value="">— No specific batch —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Amount (₹)</span>
            <input name="amount" type="number" min={0} step={100} defaultValue={0} className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Method</span>
            <select name="method" className={inputCls} defaultValue="cash">
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank">Bank transfer</option>
              <option value="upi">UPI</option>
            </select>
          </label>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px]">
            Record
          </button>
        </form>
      </section>

      {/* Revenue by batch */}
      {courseRevenue.length > 0 && (
        <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Revenue by batch</h2>
          <div className="space-y-2.5">
            {courseRevenue.map(([name, amt]) => {
              const pct = revenue > 0 ? Math.round((amt / revenue) * 100) : 0;
              return (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700">{name}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{inr(amt)} <span className="text-xs text-slate-400 font-normal">· {pct}%</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gold-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
