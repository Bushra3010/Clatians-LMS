import { db } from "@/app/lib/db";
import { requireRole } from "@/app/lib/auth";
import DoubtAnswerForm from "./DoubtAnswerForm";
import DoubtReplyForm from "./DoubtReplyForm";
import { fmtIST } from "@/app/lib/dates";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // AI drafting can occasionally take longer than 10s

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
  return fmtIST(iso, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export default async function TeacherDoubtsPage() {
  await requireRole(["teacher", "admin"]);

  const rows = await db
    .prepare(
      `SELECT d.id, d.subject, d.body, d.status, d.answer, d.created_at,
              s.name AS student, c.name AS course
       FROM doubts d
       LEFT JOIN users s ON s.id = d.student_id
       LEFT JOIN courses c ON c.id = d.course_id
       ORDER BY CASE d.status WHEN 'open' THEN 0 ELSE 1 END, d.created_at DESC`
    )
    .all() as Row[];

  // Follow-up threads for every doubt on the page.
  const msgRows = await db
    .prepare(
      `SELECT m.doubt_id, m.id, m.sender_role, m.body, m.created_at, u.name AS sender
       FROM doubt_messages m LEFT JOIN users u ON u.id = m.sender_id
       ORDER BY m.created_at ASC`
    )
    .all() as { doubt_id: string; id: string; sender_role: string; body: string; created_at: string; sender: string | null }[];
  const msgsByDoubt = new Map<string, typeof msgRows>();
  for (const m of msgRows) {
    const list = msgsByDoubt.get(m.doubt_id) ?? [];
    list.push(m);
    msgsByDoubt.set(m.doubt_id, list);
  }

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
          const hasFirstAnswer = r.answer.trim() !== "";
          const msgs = msgsByDoubt.get(r.id) ?? [];
          return (
            <div key={r.id} className="rounded-xl bg-white border border-slate-200 p-5">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${answered ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {answered ? "answered" : hasFirstAnswer ? "follow-up" : "open"}
                </span>
                {r.subject && <span className="text-xs text-slate-400">{r.subject}</span>}
              </div>
              <p className="text-sm text-slate-800">{r.body}</p>
              <p className="text-xs text-slate-400 mt-2">
                {r.student ?? "Student"}{r.course ? ` · ${r.course}` : ""} · {fmt(r.created_at)}
              </p>

              {hasFirstAnswer && (
                <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-medium text-slate-500">Your answer</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.answer}</p>
                  </div>
                  {msgs.map((m) => (
                    <div key={m.id} className={`rounded-lg px-3 py-2 ${m.sender_role === "faculty" ? "bg-slate-50" : "bg-amber-50"}`}>
                      <p className="text-xs font-medium text-slate-500">
                        {m.sender_role === "faculty" ? (m.sender ?? "Faculty") : `${m.sender ?? "Student"} (follow-up)`} · {fmt(m.created_at)}
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                  <DoubtReplyForm doubtId={r.id} />
                </div>
              )}
              {!hasFirstAnswer && (
                <>
                  {msgs.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
                      {msgs.map((m) => (
                        <div key={m.id} className="rounded-lg bg-amber-50 px-3 py-2">
                          <p className="text-xs font-medium text-slate-500">{m.sender ?? "Student"} (added detail) · {fmt(m.created_at)}</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <DoubtAnswerForm doubtId={r.id} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
