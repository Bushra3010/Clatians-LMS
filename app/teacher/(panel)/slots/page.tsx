import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { createSlotAction, cancelSlotAction } from "@/app/lib/slot-actions";
import { fmtIST } from "@/app/lib/dates";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  start_at: string;
  duration_min: number;
  status: string;
  topic: string;
  student: string | null;
};

const statusBadge: Record<string, string> = {
  open: "bg-gold-50 text-gold-700",
  booked: "bg-green-50 text-green-700",
  cancelled: "bg-slate-100 text-slate-500",
};

function fmt(iso: string) {
  return fmtIST(iso, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none";

export default async function TeacherSlotsPage() {
  const user = await requireRole(["teacher", "admin"]);

  const rows = await db
    .prepare(
      `SELECT s.id, s.start_at, s.duration_min, s.status, s.topic, u.name AS student
       FROM booking_slots s
       LEFT JOIN users u ON u.id = s.booked_by
       WHERE s.teacher_id = ?
       ORDER BY CASE s.status WHEN 'booked' THEN 0 WHEN 'open' THEN 1 ELSE 2 END, s.start_at ASC`
    )
    .all(user.id) as Row[];

  const openCount = rows.filter((r) => r.status === "open").length;
  const bookedCount = rows.filter((r) => r.status === "booked").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">1:1 Slots</h1>
        <p className="text-sm text-slate-500">
          Publish mentorship / doubt-clearing slots · {openCount} open · {bookedCount} booked
        </p>
      </header>

      {/* Publish slots */}
      <section className="rounded-xl bg-white border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Publish availability</h2>
        <form action={createSlotAction} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end">
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Starts at</span>
            <input name="startAt" type="datetime-local" required className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Duration (min)</span>
            <input name="duration" type="number" min={10} step={5} defaultValue={30} className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Slots (back-to-back)</span>
            <input name="count" type="number" min={1} max={8} defaultValue={1} className={inputCls} />
          </label>
          <button className="rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-5 h-[38px]">
            Publish
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">Tip: set “Slots” &gt; 1 to publish several back-to-back openings at once.</p>
      </section>

      {/* Slot list */}
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-400">No slots published yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl bg-white border border-slate-200 p-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[r.status]}`}>{r.status}</span>
                <span className="text-xs text-slate-400">{r.duration_min} min</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 mt-1">{fmt(r.start_at)}</p>
              {r.status === "booked" && (
                <p className="text-xs text-slate-500 mt-1">
                  Booked by <span className="font-medium text-slate-700">{r.student ?? "a student"}</span>
                  {r.topic ? ` · “${r.topic}”` : ""}
                </p>
              )}
            </div>
            {r.status !== "cancelled" && (
              <form action={cancelSlotAction} className="shrink-0">
                <input type="hidden" name="slotId" value={r.id} />
                <button className="text-xs rounded-md px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition">
                  {r.status === "booked" ? "Cancel slot" : "Remove"}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
