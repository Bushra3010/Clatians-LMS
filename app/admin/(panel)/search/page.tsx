import { db } from "@/app/lib/db";
import { requireAdmin } from "@/app/lib/auth";
import { fmtIST } from "@/app/lib/dates";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Hit = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

type StudentDetail = {
  batches: string[];
  attendanceTotal: number;
  attendancePresent: number;
  testsTaken: number;
  bestPct: number | null;
  totalPaid: number;
  openDoubts: number;
  referralCredit: number;
};

const roleBadge: Record<string, string> = {
  admin: "bg-purple-50 text-purple-700",
  teacher: "bg-emerald-50 text-emerald-700",
  student: "bg-sky-50 text-sky-700",
  parent: "bg-amber-50 text-amber-700",
};

export default async function GlobalSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const q = String((await searchParams).q ?? "").trim();

  let hits: Hit[] = [];
  if (q) {
    hits = await db.prepare(
      `SELECT id, name, email, role, status, created_at FROM users
       WHERE name ILIKE ? OR email ILIKE ?
       ORDER BY CASE role WHEN 'student' THEN 0 ELSE 1 END, name
       LIMIT 25`
    ).all(`%${q}%`, `%${q}%`) as Hit[];
  }

  // Rich detail for the student hits.
  const details = new Map<string, StudentDetail>();
  for (const h of hits.filter((h) => h.role === "student")) {
    const batches = (await db.prepare(
      "SELECT c.name FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY c.name"
    ).all(h.id) as { name: string }[]).map((r) => r.name);
    const att = await db.prepare(
      `SELECT
         (SELECT COUNT(*) FROM live_classes lc WHERE lc.status IN ('live','ended') AND lc.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)) AS total,
         (SELECT COUNT(*) FROM class_attendance a JOIN live_classes lc ON lc.id = a.class_id WHERE a.user_id = ? AND lc.status IN ('live','ended')) AS present`
    ).get(h.id, h.id) as { total: number; present: number };
    const tests = await db.prepare(
      `SELECT COUNT(*) AS taken,
              MAX(CASE WHEN total > 0 THEN round(score * 100.0 / total) END) AS best
       FROM test_attempts WHERE user_id = ? AND status = 'submitted'`
    ).get(h.id) as { taken: number; best: number | null };
    const paid = await db.prepare(
      "SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE user_id = ? AND status = 'paid'"
    ).get(h.id) as { total: number };
    const doubts = await db.prepare(
      "SELECT COUNT(*) AS n FROM doubts WHERE student_id = ? AND status = 'open'"
    ).get(h.id) as { n: number };
    const credit = await db.prepare(
      "SELECT referral_credit FROM users WHERE id = ?"
    ).get(h.id) as { referral_credit: number } | undefined;

    details.set(h.id, {
      batches,
      attendanceTotal: att.total,
      attendancePresent: att.present,
      testsTaken: tests.taken,
      bestPct: tests.best,
      totalPaid: paid.total,
      openDoubts: doubts.n,
      referralCredit: credit?.referral_credit ?? 0,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Student search</h1>
        <p className="text-sm text-slate-500">
          {q ? `${hits.length} result${hits.length === 1 ? "" : "s"} for “${q}”` : "Search any student by name or email"}
        </p>
      </header>

      {/* Search box (same GET form as the sidebar, prefilled) */}
      <form action="/admin/search" method="get" className="mb-6 max-w-md">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
          <input
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Name or email…"
            className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none"
          />
        </div>
      </form>

      {q && hits.length === 0 && (
        <p className="text-sm text-slate-400">No accounts match “{q}”.</p>
      )}

      <div className="space-y-3">
        {hits.map((h) => {
          const d = details.get(h.id);
          const attPct = d && d.attendanceTotal > 0 ? Math.round((d.attendancePresent / d.attendanceTotal) * 100) : null;
          return (
            <div key={h.id} className="rounded-xl bg-white border border-slate-200 p-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900">{h.name}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${roleBadge[h.role] ?? "bg-slate-100 text-slate-600"}`}>{h.role}</span>
                {h.status !== "active" && (
                  <span className="rounded px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600">{h.status}</span>
                )}
                <span className="text-xs text-slate-400">{h.email}</span>
                <span className="text-xs text-slate-400">· joined {fmtIST(h.created_at, { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>

              {d && (
                <>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
                    <Stat label="Batches" value={d.batches.length ? d.batches.join(", ") : "—"} />
                    <Stat label="Attendance" value={attPct === null ? "—" : `${attPct}% (${d.attendancePresent}/${d.attendanceTotal})`} />
                    <Stat label="Tests taken" value={String(d.testsTaken)} />
                    <Stat label="Best score" value={d.bestPct === null ? "—" : `${d.bestPct}%`} />
                    <Stat label="Fees paid" value={`₹${d.totalPaid.toLocaleString("en-IN")}`} />
                    <Stat label="Open doubts" value={String(d.openDoubts)} />
                  </div>
                  <div className="mt-3 flex items-center gap-3 flex-wrap text-xs">
                    {d.referralCredit > 0 && (
                      <span className="rounded px-2 py-0.5 font-medium bg-green-50 text-green-700">₹{d.referralCredit.toLocaleString("en-IN")} referral credit</span>
                    )}
                    <Link href="/admin/users" className="text-gold-700 font-medium hover:underline">Manage account →</Link>
                    <Link href="/admin/attendance" className="text-gold-700 font-medium hover:underline">Attendance →</Link>
                    <Link href="/admin/progress" className="text-gold-700 font-medium hover:underline">Progress →</Link>
                    <Link href="/admin/payments" className="text-gold-700 font-medium hover:underline">Payments →</Link>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-800 truncate" title={value}>{value}</p>
    </div>
  );
}
