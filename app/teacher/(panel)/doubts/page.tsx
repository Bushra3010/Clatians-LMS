import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import { answerDoubtAction } from "@/app/lib/doubt-actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  subject: string;
  body: string;
  status: string;
  answer: string;
  student: string | null;
  course: string | null;
  created_at: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default async function TeacherDoubtsPage() {
  await requireRole(["teacher", "admin"]);

  const rows = db
    .prepare(
      `SELECT d.id, d.subject, d.body, d.status, d.answer, d.created_at,
              s.name AS student, c.name AS course
       FROM doubts d
       LEFT JOIN users s ON s.id = d.student_id
       LEFT JOIN courses c ON c.id = d.course_id
       ORDER BY CASE d.status WHEN 'open' THEN 0 ELSE 1 END, d.created_at DESC`
    )
    .all() as Row[];

  const open = rows.filter((r) => r.status === "open").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Doubts</h1>
        <p className="text-sm text-slate-500">
          {open} awaiting an answer · questions raised by students
        </p>
      </header>

      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-400">No student doubts yet.</p>}

        {rows.map((r) => {
          const answered = r.status === "answered";
          return (
            <div key={r.id} className="rounded-xl bg-white border border-slate-200 p-5">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${answered ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {answered ? "answered" : "open"}
                </span>
                {r.subject && <span className="text-xs text-slate-400">{r.subject}</span>}
              </div>
              <p className="text-sm text-slate-800">{r.body}</p>
              <p className="text-xs text-slate-400 mt-2">
                {r.student ?? "Student"}{r.course ? ` · ${r.course}` : ""} · {fmt(r.created_at)}
              </p>

              {answered ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Your answer</p>
                  <p className="text-sm text-slate-700">{r.answer}</p>
                </div>
              ) : (
                <form action={answerDoubtAction} className="mt-3 border-t border-slate-100 pt-3">
                  <input type="hidden" name="doubtId" value={r.id} />
                  <textarea
                    name="answer"
                    required
                    rows={3}
                    placeholder="Write your answer…"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none resize-y"
                  />
                  <button className="mt-2 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium py-2 px-5">
                    Send answer
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
