import Link from "next/link";
import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/auth";
import { setBatchStatusAction, deleteBatchAction } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function BatchDetailPage({ params }: { params: Promise<{ batchId: string }> }) {
  await requireAdmin();
  const { batchId } = await params;

  const batch = await db.prepare(
    `SELECT b.*, c.name AS course_name FROM batches b
     LEFT JOIN courses c ON c.id = b.course_id
     WHERE b.id = ?`
  ).get(batchId) as { id: string; name: string; course_name: string | null; course_id: string | null; category: string; start_date: string; end_date: string; mode: string; seats: number; filled: number; fee: number; status: string; language: string; batch_type: string; chips: string; highlights: string; syllabus: string } | undefined;

  if (!batch) return <div className="p-6 text-red-600">Batch not found</div>;

  // The roster is the batch's own enrollments — course enrollments are broader.
  const enrolled = await db.prepare(
    `SELECT u.id, u.name, u.email, be.amount, be.created_at
     FROM batch_enrollments be JOIN users u ON u.id = be.user_id
     WHERE be.batch_id = ? AND be.status = 'active' ORDER BY u.name`
  ).all(batch.id) as { id: string; name: string; email: string; amount: number; created_at: string }[];

  const highlights: string[] = (() => {
    try {
      const v = JSON.parse(batch.highlights || "[]");
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  })();

  const seatPct = batch.seats > 0 ? Math.round((batch.filled / batch.seats) * 100) : 0;
  const availableSeats = batch.seats - batch.filled;
  const isFillingFast = availableSeats <= 5 && availableSeats > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/batches" className="text-sm text-slate-500 hover:text-slate-900">← Back to Batches</Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">{batch.name}</h1>
          <p className="text-sm text-slate-500">{[batch.course_name, batch.mode, batch.language].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex gap-2">
          <form action={setBatchStatusAction}>
            <input type="hidden" name="batchId" value={batch.id} />
            <input type="hidden" name="status" value={batch.status === "archived" ? "upcoming" : "archived"} />
            <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50">{batch.status === "archived" ? "Reactivate" : "Archive"}</button>
          </form>
          <form action={deleteBatchAction}>
            <input type="hidden" name="batchId" value={batch.id} />
            <button className="rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-sm hover:bg-red-50">Delete</button>
          </form>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500">Status</p>
          <p className="mt-1 text-lg font-semibold text-slate-900 capitalize">{batch.status}</p>
          {batch.status === "ongoing" && <span className="inline-block mt-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">Running</span>}
          {isFillingFast && <span className="inline-block ml-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded">Filling Fast</span>}
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500">Enrollment</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{batch.filled} / {batch.seats}</p>
          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${seatPct >= 80 ? "bg-red-500" : "bg-gold-500"}`} style={{ width: `${seatPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{availableSeats} seats remaining</p>
        </div>
        <div className="rounded-xl bg-white border border-slate-200 p-5">
          <p className="text-xs font-medium text-slate-500">Fee</p>
          <p className="mt-1 text-lg font-semibold text-gold-700">₹{batch.fee.toLocaleString("en-IN")}</p>
          {batch.start_date && <p className="mt-1 text-xs text-slate-500">{batch.start_date} → {batch.end_date || "TBD"}</p>}
        </div>
      </div>

      {highlights.length > 0 && (
        <div className="rounded-xl bg-white border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Highlights</h3>
          <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
            {highlights.map((h, i) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      {/* Enrolled students */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Enrolled Students ({enrolled.length})</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Paid</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {enrolled.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-slate-400 py-8">No students enrolled yet.</td></tr>
            ) : enrolled.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.email}</td>
                <td className="px-4 py-3 text-slate-600">{s.amount > 0 ? `₹${s.amount.toLocaleString("en-IN")}` : "Free"}</td>
                <td className="px-4 py-3 text-slate-500">{s.created_at?.slice(0, 10) || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
