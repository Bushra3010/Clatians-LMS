import { requireRole } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { fmtIST } from "@/app/lib/dates";
import { logoutAction } from "@/app/lib/session-actions";

export const dynamic = "force-dynamic";

type Child = {
  id: string;
  name: string;
  email: string;
};

type ChildReport = {
  child: Child;
  batches: string[];
  attendancePct: number | null;
  attended: number;
  classesHeld: number;
  contentDone: number;
  contentTotal: number;
  testsTaken: number;
  avgPct: number | null;
  bestPct: number | null;
  openDoubts: number;
  totalPaid: number;
  lastPayment: { invoice: string; amount: number; at: string } | null;
  nextClass: { title: string; startAt: string } | null;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

async function buildReport(child: Child): Promise<ChildReport> {
  const batches = (await db.prepare(
    "SELECT c.name FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY c.name"
  ).all(child.id) as { name: string }[]).map((r) => r.name);

  const att = await db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM live_classes lc WHERE lc.status IN ('live','ended') AND lc.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)) AS held,
       (SELECT COUNT(*) FROM class_attendance a JOIN live_classes lc ON lc.id = a.class_id WHERE a.user_id = ? AND lc.status IN ('live','ended')) AS attended`
  ).get(child.id, child.id) as { held: number; attended: number };

  const content = await db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM content ct WHERE ct.status='approved' AND (ct.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?) OR ct.course_id IS NULL)) AS total,
       (SELECT COUNT(*) FROM content_progress cp JOIN content ct ON ct.id = cp.content_id WHERE cp.user_id = ? AND ct.status='approved') AS done`
  ).get(child.id, child.id) as { total: number; done: number };

  const tests = await db.prepare(
    `SELECT COUNT(*) AS taken,
            round(AVG(CASE WHEN total > 0 THEN score * 100.0 / total END)) AS avg,
            MAX(CASE WHEN total > 0 THEN round(score * 100.0 / total) END) AS best
     FROM test_attempts WHERE user_id = ? AND status='submitted'`
  ).get(child.id) as { taken: number; avg: number | null; best: number | null };

  const doubts = await db.prepare(
    "SELECT COUNT(*) AS n FROM doubts WHERE student_id = ? AND status='open'"
  ).get(child.id) as { n: number };

  const paid = await db.prepare(
    "SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE user_id = ? AND status='paid'"
  ).get(child.id) as { total: number };

  const lastPay = await db.prepare(
    "SELECT invoice_no, amount, created_at FROM payments WHERE user_id = ? AND status='paid' ORDER BY created_at DESC LIMIT 1"
  ).get(child.id) as { invoice_no: string; amount: number; created_at: string } | undefined;

  const nextClass = await db.prepare(
    `SELECT title, start_at FROM live_classes
     WHERE status IN ('scheduled','live') AND course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)
     ORDER BY CASE status WHEN 'live' THEN 0 ELSE 1 END, start_at ASC LIMIT 1`
  ).get(child.id) as { title: string; start_at: string } | undefined;

  return {
    child,
    batches,
    classesHeld: att.held,
    attended: att.attended,
    attendancePct: att.held > 0 ? Math.round((att.attended / att.held) * 100) : null,
    contentDone: content.done,
    contentTotal: content.total,
    testsTaken: tests.taken,
    avgPct: tests.avg,
    bestPct: tests.best,
    openDoubts: doubts.n,
    totalPaid: paid.total,
    lastPayment: lastPay ? { invoice: lastPay.invoice_no, amount: lastPay.amount, at: lastPay.created_at } : null,
    nextClass: nextClass ? { title: nextClass.title, startAt: nextClass.start_at } : null,
  };
}

export default async function ParentPortal() {
  const parent = await requireRole(["parent"]);

  const children = await db.prepare(
    `SELECT u.id, u.name, u.email
     FROM guardian_links g JOIN users u ON u.id = g.student_id
     WHERE g.guardian_id = ? ORDER BY u.name`
  ).all(parent.id) as Child[];

  const reports: ChildReport[] = [];
  for (const c of children) reports.push(await buildReport(c));

  const fmtDT = (iso: string) => fmtIST(iso, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Top bar */}
      <header className="bg-brand-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gold-600 flex items-center justify-center text-white text-sm font-bold">CL</div>
          <div className="flex-1">
            <div className="text-sm font-semibold leading-tight">CLATians · Parent Portal</div>
            <div className="text-[11px] text-slate-300">{parent.name}</div>
          </div>
          <form action={logoutAction}>
            <button className="rounded-lg border border-brand-700 text-brand-100 hover:bg-brand-800 text-sm py-1.5 px-4 transition">Sign out</button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {reports.length === 0 && (
          <div className="rounded-xl bg-white border border-slate-200 p-8 text-center">
            <div className="text-3xl mb-2">👨‍👩‍👧</div>
            <p className="font-semibold">No student linked yet</p>
            <p className="text-sm text-slate-500 mt-1">Ask the CLATians office to link your child&apos;s account to this login.</p>
          </div>
        )}

        {reports.map((r) => (
          <section key={r.child.id} className="rounded-xl bg-white border border-slate-200 overflow-hidden">
            {/* Child header */}
            <div className="bg-brand-900 text-white px-5 py-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gold-600 flex items-center justify-center text-lg">🎓</div>
              <div className="flex-1">
                <p className="font-semibold leading-tight">{r.child.name}</p>
                <p className="text-[11px] text-slate-300">{r.batches.length ? r.batches.join(" · ") : "Not enrolled in a batch yet"}</p>
              </div>
              {r.nextClass && (
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] text-slate-300">Next class</p>
                  <p className="text-xs font-medium">{r.nextClass.title} · {fmtDT(r.nextClass.startAt)}</p>
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 text-center">
              <Tile label="Attendance" value={r.attendancePct === null ? "—" : `${r.attendancePct}%`} sub={r.classesHeld > 0 ? `${r.attended}/${r.classesHeld} classes` : "No classes yet"} warn={r.attendancePct !== null && r.attendancePct < 75} />
              <Tile label="Study material" value={r.contentTotal > 0 ? `${Math.round((r.contentDone / r.contentTotal) * 100)}%` : "—"} sub={`${r.contentDone}/${r.contentTotal} items done`} />
              <Tile label="Mock tests" value={String(r.testsTaken)} sub={r.avgPct !== null ? `avg ${r.avgPct}% · best ${r.bestPct}%` : "None attempted"} />
              <Tile label="Open doubts" value={String(r.openDoubts)} sub={r.openDoubts > 0 ? "awaiting faculty" : "all answered"} />
            </div>

            {/* Fees */}
            <div className="border-t border-slate-100 px-5 py-4 flex items-center justify-between flex-wrap gap-2 text-sm">
              <div>
                <span className="text-slate-500">Fees paid: </span>
                <span className="font-semibold text-slate-900">{inr(r.totalPaid)}</span>
                {r.lastPayment && (
                  <span className="text-xs text-slate-400"> · last {r.lastPayment.invoice} ({inr(r.lastPayment.amount)}) on {fmtIST(r.lastPayment.at, { day: "numeric", month: "short", year: "numeric" })}</span>
                )}
              </div>
              {r.nextClass && (
                <div className="sm:hidden text-xs text-slate-500">Next class: <b className="text-slate-800">{r.nextClass.title}</b> · {fmtDT(r.nextClass.startAt)}</div>
              )}
            </div>
          </section>
        ))}

        <p className="text-center text-[11px] text-slate-400">
          Read-only view · updated live from the classroom. For changes, contact the CLATians office.
        </p>
      </main>
    </div>
  );
}

function Tile({ label, value, sub, warn = false }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className="px-4 py-5">
      <p className={`text-2xl font-bold ${warn ? "text-red-600" : "text-slate-900"}`}>{value}</p>
      <p className="text-xs font-medium text-slate-600 mt-0.5">{label}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}
