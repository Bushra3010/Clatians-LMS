import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { cancelSlotAction } from "@/app/lib/slot-actions";
import { fmtIST } from "@/app/lib/dates";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  start_at: string;
  duration_min: number;
  status: string;
  topic: string;
  teacher: string | null;
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

export default async function AdminSlotsPage() {
  await requireRole(["admin"]);

  const rows = await db
    .prepare(
      `SELECT s.id, s.start_at, s.duration_min, s.status, s.topic,
              t.name AS teacher, u.name AS student
       FROM booking_slots s
       LEFT JOIN users t ON t.id = s.teacher_id
       LEFT JOIN users u ON u.id = s.booked_by
       ORDER BY CASE s.status WHEN 'booked' THEN 0 WHEN 'open' THEN 1 ELSE 2 END, s.start_at ASC`
    )
    .all() as Row[];

  const stat = (s: string) => rows.filter((r) => r.status === s).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">1:1 Slots</h1>
        <p className="text-sm text-slate-500">Oversight of mentorship / doubt-clearing slots across all faculty</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
        {[
          { label: "Booked", value: stat("booked"), cls: "text-green-700" },
          { label: "Open", value: stat("open"), cls: "text-gold-700" },
          { label: "Cancelled", value: stat("cancelled"), cls: "text-slate-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white border border-slate-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Slot list */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 p-6">No slots published yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${statusBadge[r.status]}`}>{r.status}</span>
                    <span className="text-sm font-medium text-slate-900">{fmt(r.start_at)}</span>
                    <span className="text-xs text-slate-400">{r.duration_min} min</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {r.teacher ?? "Unknown faculty"}
                    {r.status === "booked" && <> · booked by <span className="font-medium text-slate-700">{r.student ?? "a student"}</span>{r.topic ? ` · “${r.topic}”` : ""}</>}
                  </p>
                </div>
                {r.status !== "cancelled" && (
                  <form action={cancelSlotAction} className="shrink-0">
                    <input type="hidden" name="slotId" value={r.id} />
                    <button className="text-xs rounded-md px-3 py-1.5 border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition">
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
