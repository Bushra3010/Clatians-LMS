import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/auth";
import { enrollBatchStudentAction, unenrollBatchStudentAction } from "../../../../actions";

export const dynamic = "force-dynamic";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

export default async function BatchEnrollmentsPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  await requireAdmin();

  const batch = await db.prepare("SELECT b.*, c.name AS course_name FROM batches b LEFT JOIN courses c ON c.id = b.course_id WHERE b.id = ?").get(batchId) as { id: string; name: string; course_name: string | null; course_id: string | null; seats: number; filled: number; fee: number } | undefined;
  if (!batch) return <div className="p-6 text-red-600">Batch not found</div>;

  const enrolled = await db.prepare(
    `SELECT be.user_id, u.name, u.email, be.created_at
     FROM batch_enrollments be JOIN users u ON u.id = be.user_id
     WHERE be.batch_id = ? AND be.status = 'active' ORDER BY u.name`
  ).all(batch.id) as { user_id: string; name: string; email: string; created_at: string }[];

  const availableStudents = await db.prepare(
    `SELECT id, name, email FROM users
     WHERE role = 'student' AND status = 'active'
       AND id NOT IN (SELECT user_id FROM batch_enrollments WHERE batch_id = ?)
     ORDER BY name`
  ).all(batch.id) as { id: string; name: string; email: string }[];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{batch.name} — Enrollments</h1>
        <p className="text-sm text-slate-500">{[batch.course_name, `${enrolled.length}/${batch.seats} seats filled`].filter(Boolean).join(" · ")}</p>
      </header>

      {/* Enroll student */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Enroll Student</h2>
        <form action={enrollBatchStudentAction} className="flex items-end gap-3">
          <input type="hidden" name="batchId" value={batch.id} />
          <label className="block flex-1">
            <span className="block text-xs font-medium text-slate-600 mb-1">Select Student</span>
            <select name="userId" className={inputCls}>
              <option value="">Choose student…</option>
              {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </label>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-4 h-[38px]">Enroll</button>
        </form>
      </section>

      {/* Enrolled list */}
      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Enrolled</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {enrolled.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-slate-400 py-8">No students enrolled yet.</td></tr>
            ) : enrolled.map((s) => (
              <tr key={s.user_id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.email}</td>
                <td className="px-4 py-3 text-slate-500">{s.created_at?.slice(0, 10) || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <form action={unenrollBatchStudentAction}>
                    <input type="hidden" name="batchId" value={batch.id} />
                    <input type="hidden" name="userId" value={s.user_id} />
                    <button className="text-xs rounded border border-red-200 text-red-600 px-3 py-1.5 hover:bg-red-50">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
