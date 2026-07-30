import { redirect } from "next/navigation";
import { auth } from "./lib/auth";
import { db } from "./lib/db";
import StudentApp from "./StudentApp";
import type { LiveClassItem } from "./components/detail/LiveClassesPage";
import type { ContentItem } from "./components/detail/ContentListPage";
import type { DoubtItem, StudentProfile } from "./StudentApp";
import type { CatalogItem } from "./components/CoursesScreen";
import type { TestListItem } from "./components/detail/TestPages";
import type { NotificationItem } from "./components/detail/NotificationsPage";
import type { StudentProgress } from "./components/detail/ProgressPage";
import type { Engagement } from "./components/detail/LeaderboardPage";
import type { SavedItem } from "./components/detail/SavedItemsPage";
import { computeLeaderboard, computeStreak } from "./lib/engagement";
import type { StudentResources } from "./lib/resource-types";

export const dynamic = "force-dynamic";

type ClassQueryRow = {
  id: string; title: string; subject: string; teacher: string | null;
  start_at: string; duration_min: number; status: string;
  join_url: string; recording_url: string; notes: string; attended: number;
};
type ContentRow = {
  id: string; title: string; body: string; type: string;
  author: string | null; course: string | null; created_at: string; done: number;
};
type DoubtRow = {
  id: string; subject: string; body: string; status: string;
  answer: string; teacher: string | null; created_at: string;
};

function toClass(r: ClassQueryRow): LiveClassItem {
  return {
    id: r.id, title: r.title, subject: r.subject, teacher: r.teacher,
    startAt: r.start_at, durationMin: r.duration_min, status: r.status,
    joinUrl: r.join_url, attended: r.attended === 1,
    recordingUrl: r.recording_url || undefined, notes: r.notes || undefined,
  };
}

export default async function Home() {
  const user = await auth();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.role === "teacher") redirect("/teacher");

  // ── Live classes ──
  const classSelect = (statusClause: string, order: string, limit = "") => `
    SELECT lc.id, lc.title, lc.subject, lc.start_at, lc.duration_min, lc.status,
           lc.join_url, lc.recording_url, lc.notes, u.name AS teacher,
           (EXISTS(SELECT 1 FROM class_attendance a WHERE a.class_id = lc.id AND a.user_id = ?))::int AS attended
    FROM live_classes lc
    LEFT JOIN users u ON u.id = lc.teacher_id
    WHERE lc.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)
      AND ${statusClause}
    ORDER BY ${order} ${limit}`;

  const upcoming = (await db.prepare(classSelect("lc.status IN ('scheduled','live')", "CASE lc.status WHEN 'live' THEN 0 ELSE 1 END, lc.start_at ASC")).all(user.id, user.id) as ClassQueryRow[]).map(toClass);
  const past = (await db.prepare(classSelect("lc.status = 'ended'", "lc.start_at DESC", "LIMIT 10")).all(user.id, user.id) as ClassQueryRow[]).map(toClass);

  const stat = await db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM live_classes lc WHERE lc.status IN ('live','ended') AND lc.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)) AS total,
       (SELECT COUNT(*) FROM live_classes lc JOIN class_attendance a ON a.class_id = lc.id WHERE lc.status IN ('live','ended') AND a.user_id = ? AND lc.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)) AS attended`
  ).get(user.id, user.id, user.id) as { total: number; attended: number };
  const attendancePct = stat.total > 0 ? Math.round((stat.attended / stat.total) * 100) : null;

  // ── Study material (approved content for the batch, incl. batch-agnostic) ──
  const contentRows = await db.prepare(
    `SELECT ct.id, ct.title, ct.body, ct.type, ct.created_at, u.name AS author, c.name AS course,
            (EXISTS(SELECT 1 FROM content_progress cp WHERE cp.content_id = ct.id AND cp.user_id = ?))::int AS done
     FROM content ct
     LEFT JOIN users u ON u.id = ct.author_id
     LEFT JOIN courses c ON c.id = ct.course_id
     WHERE ct.status = 'approved'
       AND (ct.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?) OR ct.course_id IS NULL)
     ORDER BY ct.created_at DESC`
  ).all(user.id, user.id) as ContentRow[];

  const byType = (t: string): ContentItem[] =>
    contentRows.filter((r) => r.type === t).map((r) => ({
      id: r.id, title: r.title, body: r.body, author: r.author, course: r.course, createdAt: r.created_at, done: r.done === 1,
    }));
  const content = {
    video: byType("video"),
    notes: byType("notes"),
    practice: byType("practice"),
    "current-affairs": byType("current-affairs"),
  };

  // ── Doubts ──
  const doubts: DoubtItem[] = (await db.prepare(
    `SELECT d.id, d.subject, d.body, d.status, d.answer, d.created_at, u.name AS teacher
     FROM doubts d LEFT JOIN users u ON u.id = d.answered_by
     WHERE d.student_id = ? ORDER BY d.created_at DESC`
  ).all(user.id) as DoubtRow[]).map((d) => ({
    id: d.id, subject: d.subject, body: d.body, status: d.status,
    answer: d.answer, teacher: d.teacher, createdAt: d.created_at,
  }));

  // ── Course catalog (for enroll / buy) ──
  // Content titles per course, for the syllabus preview on the detail page.
  const courseContentRows = await db.prepare(
    `SELECT course_id, type, title FROM content
     WHERE status = 'approved' AND course_id IS NOT NULL
     ORDER BY created_at DESC`
  ).all() as { course_id: string; type: string; title: string }[];
  const contentByCourse = new Map<string, { type: string; title: string }[]>();
  for (const r of courseContentRows) {
    const list = contentByCourse.get(r.course_id) ?? [];
    if (list.length < 12) list.push({ type: r.type, title: r.title }); // cap the preview
    contentByCourse.set(r.course_id, list);
  }

  const catalog: CatalogItem[] = (await db.prepare(
    `SELECT c.id, c.name, c.description, c.price,
            (EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id = ? AND e.course_id = c.id))::int AS enrolled,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved') AS content_count,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved' AND ct.type = 'video') AS videos,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved' AND ct.type = 'notes') AS notes,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved' AND ct.type = 'practice') AS practice,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved' AND ct.type = 'current-affairs') AS current_affairs,
            (SELECT COUNT(*) FROM live_classes lc WHERE lc.course_id = c.id) AS class_count
     FROM courses c WHERE c.status = 'active'
     ORDER BY enrolled DESC, c.price ASC`
  ).all(user.id) as { id: string; name: string; description: string; price: number; enrolled: number; content_count: number; videos: number; notes: number; practice: number; current_affairs: number; class_count: number }[])
    .map((r) => ({
      id: r.id, name: r.name, description: r.description, price: r.price,
      enrolled: r.enrolled === 1, contentCount: r.content_count, classCount: r.class_count,
      breakdown: { videos: r.videos, notes: r.notes, practice: r.practice, currentAffairs: r.current_affairs },
      contents: contentByCourse.get(r.id) ?? [],
    }));

  // ── Test series (published, available to the student's batches) ──
  const tests: TestListItem[] = (await db.prepare(
    `SELECT t.id, t.title, t.description, t.type, t.duration_min,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS qcount,
            (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status='submitted') AS my_attempts,
            (SELECT MAX(a.score) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status='submitted') AS best_score,
            (SELECT a.total FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status='submitted' ORDER BY a.score DESC LIMIT 1) AS best_total
     FROM tests t
     WHERE t.status='published'
       AND (t.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?) OR t.course_id IS NULL)
     ORDER BY t.created_at DESC`
  ).all(user.id, user.id, user.id, user.id) as { id: string; title: string; description: string; type: string; duration_min: number; qcount: number; my_attempts: number; best_score: number | null; best_total: number | null }[])
    .map((t) => ({
      id: t.id, title: t.title, description: t.description, type: t.type,
      durationMin: t.duration_min, questionCount: t.qcount, myAttempts: t.my_attempts,
      bestScore: t.best_score, bestTotal: t.best_total,
    }));

  // ── Profile ──
  const batches = (await db.prepare(
    `SELECT c.name FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY c.name`
  ).all(user.id) as { name: string }[]).map((r) => r.name);

  // ── Progress tracking ──
  const contentDone = contentRows.filter((r) => r.done === 1).length;
  const batchMap = new Map<string, { total: number; done: number }>();
  for (const r of contentRows) {
    const name = r.course ?? "General material";
    const b = batchMap.get(name) ?? { total: 0, done: 0 };
    b.total += 1; if (r.done === 1) b.done += 1;
    batchMap.set(name, b);
  }

  const myAttempts = await db.prepare(
    "SELECT id, test_id, score, total, answers FROM test_attempts WHERE user_id = ? AND status = 'submitted'"
  ).all(user.id) as { id: string; test_id: string; score: number; total: number; answers: string }[];

  const pcts = myAttempts.filter((a) => a.total > 0).map((a) => (a.score / a.total) * 100);
  const testAvgPct = pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : null;
  const testBestPct = pcts.length ? Math.round(Math.max(...pcts)) : null;

  // Weak areas: per-subject accuracy across attempted questions.
  const subjAgg = new Map<string, { correct: number; total: number }>();
  if (myAttempts.length) {
    const testIds = [...new Set(myAttempts.map((a) => a.test_id))];
    const qRows = await db.prepare(
      `SELECT id, test_id, subject, correct FROM questions WHERE test_id IN (${testIds.map(() => "?").join(",")})`
    ).all(...testIds) as { id: string; test_id: string; subject: string; correct: string }[];
    const qById = new Map(qRows.map((q) => [q.id, q]));
    for (const a of myAttempts) {
      let answers: Record<string, string> = {};
      try { answers = JSON.parse(a.answers); } catch { answers = {}; }
      for (const [qid, chosen] of Object.entries(answers)) {
        const q = qById.get(qid);
        if (!q) continue;
        const subj = q.subject || "General";
        const agg = subjAgg.get(subj) ?? { correct: 0, total: 0 };
        agg.total += 1; if (chosen === q.correct) agg.correct += 1;
        subjAgg.set(subj, agg);
      }
    }
  }
  const subjects = [...subjAgg.entries()]
    .map(([subject, v]) => ({ subject, correct: v.correct, total: v.total, pct: Math.round((v.correct / v.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);

  // AI practice activity (persisted sessions).
  const practiceAgg = (await db.prepare(
    `SELECT COUNT(*) AS sessions, COALESCE(SUM(total),0) AS questions, COALESCE(SUM(correct),0) AS correct
     FROM practice_sessions WHERE user_id = ?`
  ).get(user.id)) as { sessions: number; questions: number; correct: number };
  const practice = {
    sessions: Number(practiceAgg.sessions),
    questions: Number(practiceAgg.questions),
    accuracy: Number(practiceAgg.questions) > 0
      ? Math.round((Number(practiceAgg.correct) / Number(practiceAgg.questions)) * 100)
      : null,
  };

  const progress: StudentProgress = {
    contentTotal: contentRows.length,
    contentDone,
    batches: [...batchMap.entries()].map(([name, b]) => ({ name, total: b.total, done: b.done })),
    testsTaken: myAttempts.length,
    testAvgPct,
    testBestPct,
    subjects,
    practice,
  };

  // ── Engagement (leaderboard, streak, badges) ──
  const board = await computeLeaderboard();
  const meEntry = board.find((e) => e.id === user.id) ?? null;
  const streak = await computeStreak(user.id);
  const top = board.slice(0, 10);
  if (meEntry && !top.some((e) => e.id === user.id)) top.push(meEntry);

  const badges = [
    { emoji: "🎯", label: "First Steps", desc: "Take a test", earned: myAttempts.length >= 1 },
    { emoji: "🏹", label: "Sharpshooter", desc: "Score 80%+", earned: testBestPct !== null && testBestPct >= 80 },
    { emoji: "📅", label: "Consistent", desc: "75% attendance", earned: attendancePct !== null && attendancePct >= 75 },
    { emoji: "📚", label: "Bookworm", desc: "Finish 3 items", earned: contentDone >= 3 },
    { emoji: "🔥", label: "On Fire", desc: "3-day streak", earned: streak >= 3 },
    { emoji: "👑", label: "Chart Topper", desc: "Reach top 3", earned: meEntry !== null && meEntry.rank <= 3 && meEntry.points > 0 },
  ];

  const engagement: Engagement = {
    myPoints: meEntry?.points ?? 0,
    myRank: meEntry && meEntry.points > 0 ? meEntry.rank : null,
    totalStudents: board.length,
    streak,
    badges,
    leaderboard: top
      .filter((e) => e.points > 0 || e.id === user.id)
      .map((e) => ({ rank: e.rank, name: e.name, points: e.points, isMe: e.id === user.id })),
  };

  // ── Saved items ("My Notes") ──
  const savedRows = await db.prepare(
    "SELECT kind, item_key, title, subtitle FROM saved_items WHERE user_id = ? ORDER BY created_at DESC"
  ).all(user.id) as { kind: string; item_key: string; title: string; subtitle: string }[];
  const saved: SavedItem[] = savedRows.map((r) => ({ kind: r.kind, key: r.item_key, title: r.title, subtitle: r.subtitle }));
  const savedTipKeys = savedRows.filter((r) => r.kind === "tip").map((r) => r.item_key);
  const savedVocabKeys = savedRows.filter((r) => r.kind === "vocab").map((r) => r.item_key);

  // ── Editorial resources (teacher/admin-managed) ──
  const resRows = await db.prepare(
    "SELECT type, title, body, data FROM resources WHERE status = 'published' ORDER BY order_idx, created_at"
  ).all() as { type: string; title: string; body: string; data: string }[];
  const pd = (d: string): Record<string, unknown> => { try { return JSON.parse(d); } catch { return {}; } };
  const ofType = (t: string) => resRows.filter((r) => r.type === t).map((r) => ({ ...r, d: pd(r.data) }));

  const resources: StudentResources = {
    tips: ofType("tip").map((r) => ({ title: r.title, body: r.body, tag: String(r.d.tag ?? ""), icon: String(r.d.icon ?? "💡"), color: String(r.d.color ?? "#3D2411"), points: Array.isArray(r.d.points) ? (r.d.points as string[]) : [] })),
    stories: ofType("story").map((r) => ({ name: r.title, quote: r.body, college: String(r.d.college ?? ""), rank: String(r.d.rank ?? ""), initials: String(r.d.initials ?? r.title.slice(0, 2).toUpperCase()), color: String(r.d.color ?? "#3D2411") })),
    updates: ofType("update").map((r) => ({ title: r.title, desc: r.body, tag: String(r.d.tag ?? ""), icon: String(r.d.icon ?? "✨"), color: String(r.d.color ?? "#0891B2"), dateLabel: String(r.d.dateLabel ?? "New"), more: String(r.d.more ?? ""), hot: !!r.d.hot })),
    vocab: ofType("vocab").map((r) => ({ word: r.title, meaning: r.body, example: String(r.d.example ?? "") })),
    caq: ofType("caq").map((r) => ({ q: r.title, options: Array.isArray(r.d.options) ? (r.d.options as string[]) : [], correct: Number(r.d.correct ?? 0), explain: String(r.d.explain ?? "") })),
    nlus: ofType("nlu").map((r) => ({ name: r.title, city: String(r.d.city ?? ""), closing: { general: Number(r.d.general ?? 0), obc: Number(r.d.obc ?? 0), ews: Number(r.d.ews ?? 0), sc: Number(r.d.sc ?? 0), st: Number(r.d.st ?? 0) } })),
  };

  // ── Notifications ──
  const notifications: NotificationItem[] = (await db.prepare(
    "SELECT id, type, title, body, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
  ).all(user.id) as { id: string; type: string; title: string; body: string; is_read: number; created_at: string }[])
    .map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, read: n.is_read === 1, createdAt: n.created_at }));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const profile: StudentProfile = {
    name: user.name,
    email: user.email,
    batches,
    contentCount: contentRows.length,
    attendancePct,
    doubtsAsked: doubts.length,
  };

  // ── 1:1 booking slots ──
  const nowIso = new Date().toISOString();
  const openSlots = (await db.prepare(
    `SELECT s.id, s.start_at, s.duration_min, t.name AS teacher
     FROM booking_slots s JOIN users t ON t.id = s.teacher_id
     WHERE s.status = 'open' AND s.start_at > ?
     ORDER BY s.start_at ASC`
  ).all(nowIso) as { id: string; start_at: string; duration_min: number; teacher: string }[])
    .map((s) => ({ id: s.id, startAt: s.start_at, durationMin: s.duration_min, teacher: s.teacher }));
  const myBookings = (await db.prepare(
    `SELECT s.id, s.start_at, s.duration_min, s.topic, t.name AS teacher
     FROM booking_slots s JOIN users t ON t.id = s.teacher_id
     WHERE s.booked_by = ? AND s.status = 'booked' AND s.start_at > ?
     ORDER BY s.start_at ASC`
  ).all(user.id, nowIso) as { id: string; start_at: string; duration_min: number; topic: string; teacher: string }[])
    .map((s) => ({ id: s.id, startAt: s.start_at, durationMin: s.duration_min, topic: s.topic, teacher: s.teacher }));
  const slots = { open: openSlots, mine: myBookings };

  // ── Payment history (student's own invoices) ──
  const myPayments = (await db.prepare(
    `SELECT p.invoice_no, p.amount, p.method, p.status, p.created_at, c.name AS course
     FROM payments p LEFT JOIN courses c ON c.id = p.course_id
     WHERE p.user_id = ? ORDER BY p.created_at DESC`
  ).all(user.id) as { invoice_no: string; amount: number; method: string; status: string; created_at: string; course: string | null }[])
    .map((p) => ({ invoiceNo: p.invoice_no, amount: p.amount, method: p.method, status: p.status, createdAt: p.created_at, course: p.course }));

  return (
    <StudentApp
      upcomingClasses={upcoming}
      pastClasses={past}
      attendancePct={attendancePct}
      content={content}
      doubts={doubts}
      profile={profile}
      catalog={catalog}
      tests={tests}
      notifications={notifications}
      unreadCount={unreadCount}
      progress={progress}
      engagement={engagement}
      saved={saved}
      savedTipKeys={savedTipKeys}
      savedVocabKeys={savedVocabKeys}
      resources={resources}
      slots={slots}
      payments={myPayments}
    />
  );
}
