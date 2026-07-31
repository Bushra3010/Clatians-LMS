import { db } from "@/app/lib/db";
import { setContentStatusAction } from "../../actions";
import ListFilter from "@/app/components/ListFilter";
import ExportCsvButton from "@/app/components/ExportCsvButton";
import { fmtIST } from "@/app/lib/dates";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  type: string;
  body: string;
  status: string;
  author: string | null;
  course: string | null;
  created_at: string;
};

const typeLabel: Record<string, string> = {
  video: "🎥 Video",
  notes: "📄 Notes",
  practice: "📝 Practice",
  "current-affairs": "🗞 Current Affairs",
};

const statusBadge: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
};

export default async function ContentPage() {
  const rows = await db
    .prepare(
      `SELECT ct.id, ct.title, ct.type, ct.body, ct.status, ct.created_at,
              u.name AS author, c.name AS course
       FROM content ct
       LEFT JOIN users u ON u.id = ct.author_id
       LEFT JOIN courses c ON c.id = ct.course_id
       ORDER BY CASE ct.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, ct.created_at DESC`
    )
    .all() as Row[];

  const pending = rows.filter((r) => r.status === "pending").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Content Approval</h1>
          <p className="text-sm text-slate-500">
            {pending} item{pending === 1 ? "" : "s"} awaiting review · teacher-submitted content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ListFilter selector="#content-list > [data-content]" placeholder="Search title, author, type…" emptyId="content-empty" />
          <ExportCsvButton
            filename={`content-${new Date().toISOString().slice(0, 10)}`}
            headers={["Title", "Type", "Status", "Author", "Batch", "Submitted"]}
            rows={rows.map((r) => [r.title, r.type, r.status, r.author ?? "", r.course ?? "", fmtIST(r.created_at, { day: "numeric", month: "short", year: "numeric" })])}
          />
        </div>
      </header>

      <div id="content-list" className="space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-slate-400">No content submitted yet.</p>
        )}
        <p id="content-empty" className="text-sm text-slate-400" style={{ display: "none" }}>No content matches your search.</p>

        {rows.map((r) => {
          const isUrl = /^https?:\/\//i.test(r.body.trim());
          const hasBody = r.body.trim().length > 0;
          return (
            <div key={r.id} data-content className="rounded-xl bg-white border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500">{typeLabel[r.type] ?? r.type}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadge[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mt-1">{r.title}</h3>
                  {!isUrl && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{r.body || "No description"}</p>}
                  <p className="text-xs text-slate-400 mt-2">
                    by {r.author ?? "Unknown"} · {r.course ?? "No course"}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col gap-2">
                  {r.status !== "approved" && (
                    <StatusButton id={r.id} status="approved" label="Approve" cls="border-green-200 text-green-700 hover:bg-green-50" />
                  )}
                  {r.status !== "rejected" && (
                    <StatusButton id={r.id} status="rejected" label="Reject" cls="border-red-200 text-red-600 hover:bg-red-50" />
                  )}
                  {r.status !== "pending" && (
                    <StatusButton id={r.id} status="pending" label="Reset" cls="border-slate-200 text-slate-500 hover:bg-slate-50" />
                  )}
                </div>
              </div>

              {/* Full preview — review before approving */}
              {isUrl ? (
                <a href={r.body.trim()} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-gold-700 hover:underline break-all">
                  🔗 Open submitted link
                </a>
              ) : hasBody && (
                <details className="mt-3 border-t border-slate-100 pt-3">
                  <summary className="text-xs font-medium text-gold-700 cursor-pointer">Preview full content</summary>
                  <div className="mt-2 max-h-80 overflow-y-auto rounded-lg bg-slate-50 border border-slate-100 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                    {r.body}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusButton({
  id,
  status,
  label,
  cls,
}: {
  id: string;
  status: string;
  label: string;
  cls: string;
}) {
  return (
    <form action={setContentStatusAction}>
      <input type="hidden" name="contentId" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`w-24 text-xs rounded-md px-3 py-1.5 border transition ${cls}`}>
        {label}
      </button>
    </form>
  );
}
