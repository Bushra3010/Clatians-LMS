import { redirect } from "next/navigation";
import { auth } from "./lib/auth";
import { db } from "./lib/db";
import { referralCode } from "./lib/referral";
import StudentApp from "./StudentApp";
import type { LiveClassItem } from "./components/detail/LiveClassesPage";
import type { ContentItem } from "./components/detail/ContentListPage";
import type { DoubtItem, StudentProfile } from "./StudentApp";
import type { CatalogItem, CatalogBatch } from "./components/CoursesScreen";
import type { TestListItem } from "./components/detail/TestPages";
import type { NotificationItem } from "./components/detail/NotificationsPage";
import type { StudentProgress } from "./components/detail/ProgressPage";
import type { Engagement } from "./components/detail/LeaderboardPage";
import type { SavedItem } from "./components/detail/SavedItemsPage";
import { computeLeaderboard, computeStreak } from "./lib/engagement";
import type { StudentResources } from "./lib/resource-types";
import type { SyllabusSubject } from "./components/StudyScreen";
import { ensureCatalog } from "./lib/catalog/sync";

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
type CourseQueryRow = {
  id: string; slug: string | null; name: string; description: string; price: number;
  category: string; icon: string; color: string; bg: string;
  tagline: string; overview: string; duration: string; batch_size: string;
  mode: string; fee_text: string; emi: string;
  features: string; includes: string; curriculum: string; who_for: string; testimonial: string;
  enrolled: number; content_count: number; videos: number; notes: number;
  practice: number; current_affairs: number; class_count: number; test_count: number;
};
type BatchQueryRow = {
  id: string; slug: string; name: string; course_id: string; category: string; exam: string;
  batch_code: string; start_date: string; end_date: string; duration: string; schedule: string; mode: string;
  seats: number; filled: number; fee: number; original_fee: number; emi: string; offer: string;
  status: string; language: string; batch_type: string;
  chips: string; faculty: string; highlights: string; syllabus: string;
  description: string; details: string; enrolled: number;
};

/** The catalog's list-valued columns are stored as JSON text. */
function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v == null ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

function toBatch(b: BatchQueryRow): CatalogBatch {
  return {
    id: b.id, slug: b.slug, name: b.name, exam: b.exam, batchCode: b.batch_code,
    startDate: b.start_date, endDate: b.end_date, duration: b.duration, schedule: b.schedule, mode: b.mode,
    seats: b.seats, filled: b.filled, fee: b.fee, originalFee: b.original_fee,
    emi: b.emi, offer: b.offer, status: b.status, language: b.language, batchType: b.batch_type,
    chips: parseJson<string[]>(b.chips, []),
    faculty: parseJson<string[]>(b.faculty, []),
    highlights: parseJson<string[]>(b.highlights, []),
    syllabus: parseJson<string[]>(b.syllabus, []),
    description: b.description, enrolled: b.enrolled === 1,
    details: parseJson<CatalogBatch["details"]>(b.details, {}),
  };
}

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
  if (user.role === "parent") redirect("/parent");

  // Mirror the website's course catalog on first run, so a fresh database
  // shows the same courses and batches as clatians.com. No-op afterwards.
  await ensureCatalog();

  // Every query below is independent of the others, so they all go out at
  // once. One after another they cost ~30 database round trips per page
  // load, which on a serverless host far from the database took ~9 seconds.
  const classSelect = (statusClause: string, order: string, limit = "") => `
    SELECT lc.id, lc.title, lc.subject, lc.start_at, lc.duration_min, lc.status,
           lc.join_url, lc.recording_url, lc.notes, u.name AS teacher,
           (EXISTS(SELECT 1 FROM class_attendance a WHERE a.class_id = lc.id AND a.user_id = ?))::int AS attended
    FROM live_classes lc
    LEFT JOIN users u ON u.id = lc.teacher_id
    WHERE lc.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)
      AND ${statusClause}
    ORDER BY ${order} ${limit}`;
  const nowIso = new Date().toISOString();

  const [
    upcomingRows, pastRows, statRow, contentQuery, doubtMsgQuery, doubtRows, courseContentQuery, batchQuery, courseRows, hierarchyQuery, paperRows, enrolledCourseRows, attemptRows, practiceRow, savedQuery, resourceQuery, notificationRows, certQuery, prefsQuery, openSlotRows, bookingRows, taskRows, noteRows, creditQuery, referralTotalRow, referralEnrolledRow, paymentRows,
    selectedCourseRow, leaderboardRows, streakDays,
  ] = await Promise.all([
    db.prepare(classSelect("lc.status IN ('scheduled','live')", "CASE lc.status WHEN 'live' THEN 0 ELSE 1 END, lc.start_at ASC")).all(user.id, user.id),
    db.prepare(classSelect("lc.status = 'ended'", "lc.start_at DESC", "LIMIT 10")).all(user.id, user.id),
    db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM live_classes lc WHERE lc.status IN ('live','ended') AND lc.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)) AS total,
       (SELECT COUNT(*) FROM live_classes lc JOIN class_attendance a ON a.class_id = lc.id WHERE lc.status IN ('live','ended') AND a.user_id = ? AND lc.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)) AS attended`
  ).get(user.id, user.id, user.id),
    db.prepare(
    `SELECT ct.id, ct.title, ct.body, ct.type, ct.created_at, u.name AS author, c.name AS course,
            (EXISTS(SELECT 1 FROM content_progress cp WHERE cp.content_id = ct.id AND cp.user_id = ?))::int AS done
     FROM content ct
     LEFT JOIN users u ON u.id = ct.author_id
     LEFT JOIN courses c ON c.id = ct.course_id
     WHERE ct.status = 'approved'
       AND (ct.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?) OR ct.course_id IS NULL)
     ORDER BY ct.created_at DESC`
  ).all(user.id, user.id),
    db.prepare(
    `SELECT m.id, m.doubt_id, m.sender_role, m.body, m.created_at, u.name AS sender
     FROM doubt_messages m LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.doubt_id IN (SELECT id FROM doubts WHERE student_id = ?)
     ORDER BY m.created_at ASC`
  ).all(user.id),
    db.prepare(
    `SELECT d.id, d.subject, d.body, d.status, d.answer, d.created_at, u.name AS teacher
     FROM doubts d LEFT JOIN users u ON u.id = d.answered_by
     WHERE d.student_id = ? ORDER BY d.created_at DESC`
  ).all(user.id),
    db.prepare(
    `SELECT course_id, type, title FROM content
     WHERE status = 'approved' AND course_id IS NOT NULL
     ORDER BY created_at DESC`
  ).all(),
    db.prepare(
    `SELECT b.id, b.slug, b.name, b.course_id, b.category, b.exam, b.batch_code, b.start_date, b.end_date,
            b.duration, b.schedule, b.mode, b.seats, b.filled, b.fee, b.original_fee,
            b.emi, b.offer, b.status, b.language, b.batch_type,
            b.chips, b.faculty, b.highlights, b.syllabus, b.description, b.details,
            (EXISTS(SELECT 1 FROM batch_enrollments be WHERE be.user_id = ? AND be.batch_id = b.id))::int AS enrolled
     FROM batches b WHERE b.course_id IS NOT NULL
     ORDER BY b.fee ASC, b.name`
  ).all(user.id),
    db.prepare(
    `SELECT c.id, c.slug, c.name, c.description, c.price, c.category, c.icon, c.color, c.bg,
            c.tagline, c.overview, c.duration, c.batch_size, c.mode, c.fee_text, c.emi,
            c.features, c.includes, c.curriculum, c.who_for, c.testimonial,
            (EXISTS(SELECT 1 FROM enrollments e WHERE e.user_id = ? AND e.course_id = c.id))::int AS enrolled,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved') AS content_count,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved' AND ct.type = 'video') AS videos,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved' AND ct.type = 'notes') AS notes,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved' AND ct.type = 'practice') AS practice,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved' AND ct.type = 'current-affairs') AS current_affairs,
            (SELECT COUNT(*) FROM live_classes lc WHERE lc.course_id = c.id) AS class_count,
            (SELECT COUNT(*) FROM tests t WHERE t.course_id = c.id AND t.status = 'published') AS test_count
     FROM courses c WHERE c.status = 'active'
     ORDER BY enrolled DESC, c.sort_order, c.price ASC`
  ).all(user.id),
    db.prepare(
    `SELECT COALESCE(s.id, 'unsorted') AS subject_id,
            COALESCE(s.name, 'Other topics') AS subject_name,
            COALESCE(s.slug, 'unsorted') AS subject_slug,
            COALESCE(s.icon, '📘') AS subject_icon,
            ch.id AS chapter_id, ch.title AS chapter_title,
            l.id AS lesson_id, l.title AS lesson_title, l.duration_min AS lesson_duration,
            l.is_free AS lesson_is_free,
            (l.video_url <> '')::int AS has_video,
            (l.body <> '' OR l.notes_url <> '')::int AS has_notes,
            (l.test_id IS NOT NULL)::int AS has_test,
            COALESCE(lp.completed, 0) AS lesson_completed
     FROM modules m
     LEFT JOIN subjects s ON s.id = m.subject_id
     JOIN chapters ch ON ch.module_id = m.id
     JOIN lessons l ON l.chapter_id = ch.id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
     WHERE m.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?)
     ORDER BY s.sort_order NULLS LAST, s.name, m.sort_order, ch.sort_order, l.sort_order`
  ).all(user.id, user.id),
    db.prepare(
    `SELECT t.id, t.title, t.description, t.type, t.duration_min,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS qcount,
            -- A paper is "a <subject> paper" only when every question shares one.
            (SELECT CASE WHEN COUNT(DISTINCT q.subject) = 1 THEN MIN(q.subject) ELSE '' END
               FROM questions q WHERE q.test_id = t.id) AS subject,
            (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status='submitted') AS my_attempts,
            (SELECT MAX(a.score) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status='submitted') AS best_score,
            (SELECT a.total FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status='submitted' ORDER BY a.score DESC LIMIT 1) AS best_total
     FROM tests t
     WHERE t.status='published'
       AND (t.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?) OR t.course_id IS NULL)
     ORDER BY t.created_at DESC`
  ).all(user.id, user.id, user.id, user.id),
    db.prepare(
    `SELECT c.id, c.name FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY c.name`
  ).all(user.id),
    db.prepare(
    "SELECT id, test_id, score, total, answers FROM test_attempts WHERE user_id = ? AND status = 'submitted'"
  ).all(user.id),
    db.prepare(
    `SELECT COUNT(*) AS sessions, COALESCE(SUM(total),0) AS questions, COALESCE(SUM(correct),0) AS correct
     FROM practice_sessions WHERE user_id = ?`
  ).get(user.id),
    db.prepare(
    "SELECT kind, item_key, title, subtitle FROM saved_items WHERE user_id = ? ORDER BY created_at DESC"
  ).all(user.id),
    db.prepare(
    "SELECT type, title, body, data FROM resources WHERE status = 'published' ORDER BY order_idx, created_at"
  ).all(),
    db.prepare(
    "SELECT id, type, title, body, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
  ).all(user.id),
    db.prepare(
    `SELECT c.id, c.name,
            (SELECT COUNT(*) FROM content ct WHERE ct.course_id = c.id AND ct.status = 'approved') AS total,
            (SELECT COUNT(*) FROM content ct JOIN content_progress cp ON cp.content_id = ct.id
              WHERE ct.course_id = c.id AND ct.status = 'approved' AND cp.user_id = ?) AS done,
            (SELECT MAX(cp.created_at) FROM content ct JOIN content_progress cp ON cp.content_id = ct.id
              WHERE ct.course_id = c.id AND ct.status = 'approved' AND cp.user_id = ?) AS completed_at
     FROM enrollments e JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = ? ORDER BY c.name`
  ).all(user.id, user.id, user.id),
    db.prepare("SELECT notify_prefs FROM users WHERE id = ?").get(user.id),
    db.prepare(
    `SELECT s.id, s.start_at, s.duration_min, t.name AS teacher
     FROM booking_slots s JOIN users t ON t.id = s.teacher_id
     WHERE s.status = 'open' AND s.start_at > ?
     ORDER BY s.start_at ASC`
  ).all(nowIso),
    db.prepare(
    `SELECT s.id, s.start_at, s.duration_min, s.topic, t.name AS teacher
     FROM booking_slots s JOIN users t ON t.id = s.teacher_id
     WHERE s.booked_by = ? AND s.status = 'booked' AND s.start_at > ?
     ORDER BY s.start_at ASC`
  ).all(user.id, nowIso),
    db.prepare(
    "SELECT id, title, done, due_date FROM study_tasks WHERE user_id = ? ORDER BY done ASC, (due_date = '') ASC, due_date ASC, created_at DESC"
  ).all(user.id),
    db.prepare(
    "SELECT id, title, body FROM notes WHERE user_id = ? ORDER BY updated_at DESC"
  ).all(user.id),
    db.prepare("SELECT referral_credit FROM users WHERE id = ?").get(user.id),
    db.prepare("SELECT COUNT(*) AS n FROM leads WHERE referred_by = ?").get(user.id),
    db.prepare("SELECT COUNT(*) AS n FROM leads WHERE referred_by = ? AND status='enrolled'").get(user.id),
    db.prepare(
    `SELECT p.invoice_no, p.amount, p.method, p.status, p.created_at, c.name AS course
     FROM payments p LEFT JOIN courses c ON c.id = p.course_id
     WHERE p.user_id = ? ORDER BY p.created_at DESC`
  ).all(user.id),
    db.prepare(
      `SELECT c.id, c.name FROM users u JOIN courses c ON c.id = u.selected_course_id
       WHERE u.id = ? AND c.status = 'active'`
    ).get(user.id),
    computeLeaderboard(),
    computeStreak(user.id),
  ]);


  // ── Live classes ──

  const upcoming = (upcomingRows as ClassQueryRow[]).map(toClass);
  const past = (pastRows as ClassQueryRow[]).map(toClass);

  const stat = statRow as { total: number; attended: number };
  const attendancePct = stat.total > 0 ? Math.round((stat.attended / stat.total) * 100) : null;

  // ── Study material (approved content for the batch, incl. batch-agnostic) ──
  const contentRows = contentQuery as ContentRow[];

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

  // ── Doubts (with follow-up threads) ──
  const doubtMsgRows = doubtMsgQuery as { id: string; doubt_id: string; sender_role: string; body: string; created_at: string; sender: string | null }[];
  const msgsByDoubt = new Map<string, DoubtItem["messages"]>();
  for (const m of doubtMsgRows) {
    const list = msgsByDoubt.get(m.doubt_id) ?? [];
    list.push({ id: m.id, role: m.sender_role === "faculty" ? "faculty" : "student", sender: m.sender, body: m.body, createdAt: m.created_at });
    msgsByDoubt.set(m.doubt_id, list);
  }

  const doubts: DoubtItem[] = (doubtRows as DoubtRow[]).map((d) => ({
    id: d.id, subject: d.subject, body: d.body, status: d.status,
    answer: d.answer, teacher: d.teacher, createdAt: d.created_at,
    messages: msgsByDoubt.get(d.id) ?? [],
  }));

  // ── Course catalog (for enroll / buy) ──
  // Content titles per course, for the syllabus preview on the detail page.
  const courseContentRows = courseContentQuery as { course_id: string; type: string; title: string }[];
  const contentByCourse = new Map<string, { type: string; title: string }[]>();
  for (const r of courseContentRows) {
    const list = contentByCourse.get(r.course_id) ?? [];
    if (list.length < 12) list.push({ type: r.type, title: r.title }); // cap the preview
    contentByCourse.set(r.course_id, list);
  }

  // Batches, grouped under their course — the cohort a student actually joins.
  const batchRows = batchQuery as BatchQueryRow[];
  const batchesByCourse = new Map<string, CatalogBatch[]>();
  for (const b of batchRows) {
    const list = batchesByCourse.get(b.course_id) ?? [];
    list.push(toBatch(b));
    batchesByCourse.set(b.course_id, list);
  }

  const catalog: CatalogItem[] = (courseRows as CourseQueryRow[])
    .map((r) => ({
      id: r.id, slug: r.slug ?? r.id, name: r.name, description: r.description, price: r.price,
      category: r.category || "offline", icon: r.icon || "📚", color: r.color || "", bg: r.bg || "",
      tagline: r.tagline, overview: r.overview, duration: r.duration, batchSize: r.batch_size,
      mode: r.mode, feeText: r.fee_text, emi: r.emi,
      features: parseJson<string[]>(r.features, []),
      includes: parseJson<CatalogItem["includes"]>(r.includes, []),
      curriculum: parseJson<CatalogItem["curriculum"]>(r.curriculum, []),
      whoFor: parseJson<string[]>(r.who_for, []),
      testimonial: parseJson<CatalogItem["testimonial"]>(r.testimonial, null),
      enrolled: r.enrolled === 1, contentCount: r.content_count, classCount: r.class_count,
      testCount: r.test_count,
      breakdown: { videos: r.videos, notes: r.notes, practice: r.practice, currentAffairs: r.current_affairs },
      contents: contentByCourse.get(r.id) ?? [],
      batches: batchesByCourse.get(r.id) ?? [],
    }));

  // ── Course syllabus (subject → chapter → topic) ──
  // Driven from the student's own courses. Modules are the admin's way of
  // hanging a subject's chapters on a course; the student just sees
  // subject → chapter → topic, so a subject's chapters are merged across its
  // modules. Modules with no subject are grouped under a catch-all.
  const hierarchyRows = hierarchyQuery as { subject_id: string; subject_name: string; subject_slug: string; subject_icon: string; chapter_id: string; chapter_title: string; lesson_id: string; lesson_title: string; lesson_duration: number; lesson_is_free: number; has_video: number; has_notes: number; has_test: number; lesson_completed: number }[];

  // Rows arrive ordered by every sort_order in the chain, so appending in
  // order preserves it.
  const syllabus: SyllabusSubject[] = [];
  for (const row of hierarchyRows) {
    let subject = syllabus.find((s) => s.id === row.subject_id);
    if (!subject) {
      subject = { id: row.subject_id, name: row.subject_name, slug: row.subject_slug, icon: row.subject_icon, chapters: [] };
      syllabus.push(subject);
    }
    let chapter = subject.chapters.find((c) => c.id === row.chapter_id);
    if (!chapter) {
      chapter = { id: row.chapter_id, title: row.chapter_title || "Untitled chapter", topics: [] };
      subject.chapters.push(chapter);
    }
    chapter.topics.push({
      id: row.lesson_id,
      title: row.lesson_title || "Untitled topic",
      durationMin: row.lesson_duration || 0,
      isFree: row.lesson_is_free === 1,
      hasVideo: row.has_video === 1,
      hasNotes: row.has_notes === 1,
      hasTest: row.has_test === 1,
      completed: row.lesson_completed === 1,
    });
  }

  // ── Tests & practice papers (published, available to the student's batches) ──
  // Both run on the same engine; `type` decides which screen they surface on —
  // 'practice' goes to Practice Questions, everything else to Test Series.
  const allPapers: TestListItem[] = (paperRows as { id: string; title: string; description: string; type: string; duration_min: number; qcount: number; subject: string | null; my_attempts: number; best_score: number | null; best_total: number | null }[])
    .map((t) => ({
      id: t.id, title: t.title, description: t.description, type: t.type,
      subject: t.subject ?? "",
      durationMin: t.duration_min, questionCount: t.qcount, myAttempts: t.my_attempts,
      bestScore: t.best_score, bestTotal: t.best_total,
    }));

  const tests = allPapers.filter((t) => t.type !== "practice");
  const practicePapers = allPapers.filter((t) => t.type === "practice");

  // ── Profile ──
  const enrolledCourses = enrolledCourseRows as { id: string; name: string }[];
  const batches = enrolledCourses.map((r) => r.name);

  // The course heading the home screen: the one the student picked, else the
  // first one they're enrolled in. None until they choose or buy a course.
  const picked = selectedCourseRow as { id: string; name: string } | undefined;
  const currentCourse = picked
    ? { id: picked.id, name: picked.name, purchased: enrolledCourses.some((c) => c.id === picked.id) }
    : enrolledCourses[0]
      ? { id: enrolledCourses[0].id, name: enrolledCourses[0].name, purchased: true }
      : null;

  // ── Progress tracking ──
  const contentDone = contentRows.filter((r) => r.done === 1).length;
  const batchMap = new Map<string, { total: number; done: number }>();
  for (const r of contentRows) {
    const name = r.course ?? "General material";
    const b = batchMap.get(name) ?? { total: 0, done: 0 };
    b.total += 1; if (r.done === 1) b.done += 1;
    batchMap.set(name, b);
  }

  const myAttempts = attemptRows as { id: string; test_id: string; score: number; total: number; answers: string }[];

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
  const practiceAgg = (practiceRow) as { sessions: number; questions: number; correct: number };
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
  const board = leaderboardRows;
  const meEntry = board.find((e) => e.id === user.id) ?? null;
  const streak = streakDays;
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
  const savedRows = savedQuery as { kind: string; item_key: string; title: string; subtitle: string }[];
  const saved: SavedItem[] = savedRows.map((r) => ({ kind: r.kind, key: r.item_key, title: r.title, subtitle: r.subtitle }));
  const savedTipKeys = savedRows.filter((r) => r.kind === "tip").map((r) => r.item_key);
  const savedVocabKeys = savedRows.filter((r) => r.kind === "vocab").map((r) => r.item_key);

  // ── Editorial resources (teacher/admin-managed) ──
  const resRows = resourceQuery as { type: string; title: string; body: string; data: string }[];
  const pd = (d: string): Record<string, unknown> => { try { return JSON.parse(d); } catch { return {}; } };
  const ofType = (t: string) => resRows.filter((r) => r.type === t).map((r) => ({ ...r, d: pd(r.data) }));

  const resources: StudentResources = {
    tips: ofType("tip").map((r) => ({ title: r.title, body: r.body, tag: String(r.d.tag ?? ""), icon: String(r.d.icon ?? "💡"), color: String(r.d.color ?? "var(--blue)"), points: Array.isArray(r.d.points) ? (r.d.points as string[]) : [] })),
    stories: ofType("story").map((r) => ({ name: r.title, quote: r.body, college: String(r.d.college ?? ""), rank: String(r.d.rank ?? ""), initials: String(r.d.initials ?? r.title.slice(0, 2).toUpperCase()), color: String(r.d.color ?? "var(--blue)") })),
    updates: ofType("update").map((r) => ({ title: r.title, desc: r.body, tag: String(r.d.tag ?? ""), icon: String(r.d.icon ?? "✨"), color: String(r.d.color ?? "#0891B2"), dateLabel: String(r.d.dateLabel ?? "New"), more: String(r.d.more ?? ""), hot: !!r.d.hot })),
    vocab: ofType("vocab").map((r) => ({ word: r.title, meaning: r.body, example: String(r.d.example ?? "") })),
    caq: ofType("caq").map((r) => ({ q: r.title, options: Array.isArray(r.d.options) ? (r.d.options as string[]) : [], correct: Number(r.d.correct ?? 0), explain: String(r.d.explain ?? "") })),
    nlus: ofType("nlu").map((r) => ({ name: r.title, city: String(r.d.city ?? ""), closing: { general: Number(r.d.general ?? 0), obc: Number(r.d.obc ?? 0), ews: Number(r.d.ews ?? 0), sc: Number(r.d.sc ?? 0), st: Number(r.d.st ?? 0) } })),
  };

  // ── Notifications ──
  const notifications: NotificationItem[] = (notificationRows as { id: string; type: string; title: string; body: string; is_read: number; created_at: string }[])
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

  // ── Course-completion certificates ──
  // Eligible when every approved content item of an enrolled course is marked done.
  const certRows = certQuery as { id: string; name: string; total: number; done: number; completed_at: string | null }[];
  const certificates = certRows.map((r) => ({
    courseId: r.id,
    course: r.name,
    total: r.total,
    done: r.done,
    eligible: r.total > 0 && r.done >= r.total,
    completedAt: r.completed_at,
    // Deterministic, verifiable-looking certificate number (no DB storage needed).
    certNo: `CLT-CERT-${user.id.slice(0, 6).toUpperCase()}-${r.id.slice(0, 6).toUpperCase()}`,
  }));

  // ── Notification preferences (Settings toggles) ──
  const prefsRow = prefsQuery as { notify_prefs: string } | undefined;
  let notifyPrefs = { push: true, email: true, sms: false };
  try {
    const p = JSON.parse(prefsRow?.notify_prefs ?? "{}");
    notifyPrefs = { push: p.push !== false, email: p.email !== false, sms: p.sms === true };
  } catch { /* keep defaults */ }

  // ── 1:1 booking slots ──
  const openSlots = (openSlotRows as { id: string; start_at: string; duration_min: number; teacher: string }[])
    .map((s) => ({ id: s.id, startAt: s.start_at, durationMin: s.duration_min, teacher: s.teacher }));
  const myBookings = (bookingRows as { id: string; start_at: string; duration_min: number; topic: string; teacher: string }[])
    .map((s) => ({ id: s.id, startAt: s.start_at, durationMin: s.duration_min, topic: s.topic, teacher: s.teacher }));
  const slots = { open: openSlots, mine: myBookings };

  // ── Study planner tasks ──
  const tasks = (taskRows as { id: string; title: string; done: number; due_date: string }[])
    .map((t) => ({ id: t.id, title: t.title, done: t.done === 1, dueDate: t.due_date }));

  // ── Personal notes ──
  const notes = noteRows as { id: string; title: string; body: string }[];

  // ── Referral program ──
  const creditRow = creditQuery as { referral_credit: number } | undefined;
  const referral = {
    code: referralCode(user.id),
    total: (referralTotalRow as { n: number }).n,
    enrolled: (referralEnrolledRow as { n: number }).n,
    credit: creditRow?.referral_credit ?? 0,
  };

  // ── Payment history (student's own invoices) ──
  const myPayments = (paymentRows as { invoice_no: string; amount: number; method: string; status: string; created_at: string; course: string | null }[])
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
      practicePapers={practicePapers}
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
      tasks={tasks}
      notes={notes}
      referral={referral}
      notifyPrefs={notifyPrefs}
      certificates={certificates}
      syllabus={syllabus}
      currentCourse={currentCourse}
    />
  );
}
