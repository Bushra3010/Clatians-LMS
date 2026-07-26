import "server-only";
import { db } from "./db";

export type LeaderEntry = {
  id: string;
  name: string;
  points: number;
  testPts: number;
  attended: number;
  contentDone: number;
  rank: number;
};

/**
 * Points model (composite of the things students actually do):
 *   test marks ×10  +  classes attended ×5  +  content completed ×2
 * "test marks" = sum of the best score per distinct test taken.
 */
export function computeLeaderboard(): LeaderEntry[] {
  const rows = db.prepare(
    `SELECT u.id, u.name,
       COALESCE((SELECT SUM(best) FROM (
          SELECT MAX(a.score) AS best FROM test_attempts a
          WHERE a.user_id = u.id AND a.status='submitted' GROUP BY a.test_id
       )), 0) AS test_pts,
       (SELECT COUNT(*) FROM class_attendance ca WHERE ca.user_id = u.id) AS attended,
       (SELECT COUNT(*) FROM content_progress cp WHERE cp.user_id = u.id) AS content_done
     FROM users u WHERE u.role='student' AND u.status='active'`
  ).all() as { id: string; name: string; test_pts: number; attended: number; content_done: number }[];

  return rows
    .map((r) => ({
      id: r.id, name: r.name, testPts: r.test_pts, attended: r.attended, contentDone: r.content_done,
      points: Math.round(r.test_pts) * 10 + r.attended * 5 + r.content_done * 2,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Current consecutive-day activity streak (tests, classes, or content). */
export function computeStreak(userId: string): number {
  const rows = db.prepare(
    `SELECT DISTINCT d FROM (
       SELECT date(submitted_at) d FROM test_attempts WHERE user_id = ? AND status='submitted' AND submitted_at IS NOT NULL
       UNION SELECT date(joined_at) FROM class_attendance WHERE user_id = ?
       UNION SELECT date(created_at) FROM content_progress WHERE user_id = ?
     ) WHERE d IS NOT NULL`
  ).all(userId, userId, userId) as { d: string }[];

  const set = new Set(rows.map((r) => r.d));
  const day = new Date();
  const s = (dt: Date) => dt.toISOString().slice(0, 10);
  if (!set.has(s(day))) day.setUTCDate(day.getUTCDate() - 1); // allow a streak that ended yesterday
  let streak = 0;
  while (set.has(s(day))) { streak++; day.setUTCDate(day.getUTCDate() - 1); }
  return streak;
}
