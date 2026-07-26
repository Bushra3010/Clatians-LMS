import { computeLeaderboard } from "@/app/lib/engagement";

export const dynamic = "force-dynamic";

const medal = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`);

export default function AdminLeaderboardPage() {
  const board = computeLeaderboard();
  const active = board.filter((e) => e.points > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Leaderboard</h1>
        <p className="text-sm text-slate-500">Student engagement · tests ×10 + classes attended ×5 + content done ×2</p>
      </header>

      <section className="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-5 py-3 w-16">Rank</th>
                <th className="text-left font-medium px-5 py-3">Student</th>
                <th className="text-right font-medium px-5 py-3">Test marks</th>
                <th className="text-right font-medium px-5 py-3">Classes</th>
                <th className="text-right font-medium px-5 py-3">Content</th>
                <th className="text-right font-medium px-5 py-3">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {board.length === 0 && <tr><td colSpan={6} className="px-5 py-6 text-center text-slate-400">No students yet.</td></tr>}
              {board.map((e) => (
                <tr key={e.id} className={`hover:bg-slate-50 ${e.points === 0 ? "opacity-50" : ""}`}>
                  <td className="px-5 py-3 text-lg">{e.points > 0 ? medal(e.rank) : "—"}</td>
                  <td className="px-5 py-3 text-slate-800">{e.name}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-600">{Math.round(e.testPts * 10) / 10}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-600">{e.attended}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-600">{e.contentDone}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold text-gold-700">{e.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs text-slate-400 mt-3">{active.length} of {board.length} students are actively engaged.</p>
    </div>
  );
}
