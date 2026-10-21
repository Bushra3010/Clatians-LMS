"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { isEnrolled, loadChapterTopics, type LearningTopic } from "./learning";
import type { LiveClassItem } from "../components/detail/LiveClassesPage";

/**
 * One syllabus topic (a `lessons` row) as the student sees it: the video,
 * the notes, the topic's practice test and the student's own doubts on it.
 */
export type TopicDoubt = { id: string; body: string; status: string; answer: string; teacher: string | null; createdAt: string; videoUrl: string };
/** An answered doubt on this topic that came with a solution video (any student's, shown without their name). */
export type SolutionVideo = { id: string; question: string; videoUrl: string; teacher: string | null; createdAt: string };

export type TopicDetail = {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  videoUrl: string;
  durationMin: number;
  notes: string;
  notesUrl: string;
  test: { id: string; title: string; questionCount: number; durationMin: number; myAttempts: number; bestScore: number | null; bestTotal: number | null } | null;
  completed: boolean;
  doubts: TopicDoubt[];
  courseId: string;
  chapterId: string;
  /** Every topic of the chapter, in order — the "Video lessons" list. */
  siblings: LearningTopic[];
  /** The course's next live class (or the one live now) and recent recordings. */
  nextClass: LiveClassItem | null;
  pastClasses: LiveClassItem[];
  /** "Doubt solving videos" for this topic. */
  solutionVideos: SolutionVideo[];
};

export type TopicResult = { ok: true; topic: TopicDetail } | { ok: false; error: string; /** Paid topic, student not enrolled. */ locked?: boolean };

type TopicRow = {
  id: string; title: string; body: string; video_url: string; notes_url: string;
  duration_min: number; is_free: number; test_id: string | null;
  chapter: string; chapter_id: string; course_id: string; subject: string | null; module_title: string;
};

async function loadTopic(lessonId: string) {
  return await db.prepare(
    `SELECT l.id, l.title, l.body, l.video_url, l.notes_url, l.duration_min, l.is_free, l.test_id,
            ch.title AS chapter, ch.id AS chapter_id, m.course_id, s.name AS subject, m.title AS module_title
     FROM lessons l
     JOIN chapters ch ON ch.id = l.chapter_id
     JOIN modules m ON m.id = ch.module_id
     LEFT JOIN subjects s ON s.id = m.subject_id
     WHERE l.id = ?`
  ).get(lessonId) as TopicRow | undefined;
}

/**
 * Free previews open for everyone. Enrolled students open the rest in order:
 * a topic unlocks once the one before it in the chapter is finished.
 */
async function canOpen(userId: string, t: TopicRow): Promise<{ ok: boolean; enrolled: boolean; siblings: LearningTopic[] }> {
  const enrolled = await isEnrolled(userId, t.course_id);
  const siblings = await loadChapterTopics(userId, t.chapter_id, enrolled);
  const me = siblings.find((s) => s.id === t.id);
  return { ok: !!me && !me.locked, enrolled, siblings };
}

type ClassRow = {
  id: string; title: string; subject: string; start_at: string; duration_min: number; status: string;
  join_url: string; recording_url: string; notes: string; teacher: string | null; attended: number;
};
const toClass = (r: ClassRow): LiveClassItem => ({
  id: r.id, title: r.title, subject: r.subject, teacher: r.teacher, startAt: r.start_at,
  durationMin: r.duration_min, status: r.status, joinUrl: r.join_url, attended: r.attended === 1,
  recordingUrl: r.recording_url || undefined, notes: r.notes || undefined,
});

export async function getTopicAction(lessonId: string): Promise<TopicResult> {
  const user = await requireRole(["student"]);
  const t = await loadTopic(String(lessonId ?? ""));
  if (!t) return { ok: false, error: "This topic no longer exists." };
  const access = await canOpen(user.id, t);
  if (!access.ok) {
    return access.enrolled
      ? { ok: false, error: "Finish the previous topic to unlock this one." }
      : { ok: false, locked: true, error: "Enrol in a batch to unlock this topic." };
  }

  const test = t.test_id
    ? await db.prepare(
        `SELECT t.id, t.title, t.duration_min,
                (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS qcount,
                (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status = 'submitted') AS my_attempts,
                (SELECT MAX(a.score) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status = 'submitted') AS best_score,
                (SELECT a.total FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status = 'submitted' ORDER BY a.score DESC LIMIT 1) AS best_total
         FROM tests t WHERE t.id = ? AND t.status = 'published'`
      ).get(user.id, user.id, user.id, t.test_id) as { id: string; title: string; duration_min: number; qcount: number; my_attempts: number; best_score: number | null; best_total: number | null } | undefined
    : undefined;

  const progress = await db.prepare(
    "SELECT completed FROM lesson_progress WHERE user_id = ? AND lesson_id = ?"
  ).get(user.id, t.id) as { completed: number } | undefined;

  const doubts = await db.prepare(
    `SELECT d.id, d.body, d.status, d.answer, d.video_url, d.created_at, u.name AS teacher
     FROM doubts d LEFT JOIN users u ON u.id = d.answered_by
     WHERE d.student_id = ? AND d.lesson_id = ? ORDER BY d.created_at DESC`
  ).all(user.id, t.id) as { id: string; body: string; status: string; answer: string; video_url: string; created_at: string; teacher: string | null }[];

  const solutionVideos = access.enrolled
    ? await db.prepare(
        `SELECT d.id, d.body, d.video_url, d.created_at, u.name AS teacher
         FROM doubts d LEFT JOIN users u ON u.id = d.answered_by
         WHERE d.lesson_id = ? AND d.status = 'answered' AND d.video_url <> ''
         ORDER BY d.created_at DESC LIMIT 10`
      ).all(t.id) as { id: string; body: string; video_url: string; created_at: string; teacher: string | null }[]
    : [];

  const classSelect = (where: string, order: string) =>
    `SELECT lc.id, lc.title, lc.subject, lc.start_at, lc.duration_min, lc.status, lc.join_url,
            lc.recording_url, lc.notes, u.name AS teacher,
            (EXISTS(SELECT 1 FROM class_attendance a WHERE a.class_id = lc.id AND a.user_id = ?))::int AS attended
     FROM live_classes lc LEFT JOIN users u ON u.id = lc.teacher_id
     WHERE lc.course_id = ? AND ${where} ORDER BY ${order} LIMIT 5`;
  const [upcoming, past] = access.enrolled
    ? await Promise.all([
        db.prepare(classSelect("lc.status IN ('scheduled','live')", "CASE lc.status WHEN 'live' THEN 0 ELSE 1 END, lc.start_at ASC")).all(user.id, t.course_id) as Promise<ClassRow[]>,
        db.prepare(classSelect("lc.status = 'ended'", "lc.start_at DESC")).all(user.id, t.course_id) as Promise<ClassRow[]>,
      ])
    : [[], []];

  return {
    ok: true,
    topic: {
      id: t.id,
      title: t.title,
      subject: t.subject ?? t.module_title,
      chapter: t.chapter,
      videoUrl: t.video_url,
      durationMin: t.duration_min,
      notes: t.body,
      notesUrl: t.notes_url,
      test: test
        ? { id: test.id, title: test.title, questionCount: test.qcount, durationMin: test.duration_min, myAttempts: test.my_attempts, bestScore: test.best_score, bestTotal: test.best_total }
        : null,
      completed: progress?.completed === 1,
      doubts: doubts.map((d) => ({ id: d.id, body: d.body, status: d.status, answer: d.answer, teacher: d.teacher, createdAt: d.created_at, videoUrl: d.video_url || "" })),
      solutionVideos: solutionVideos.map((v) => ({ id: v.id, question: v.body, videoUrl: v.video_url, teacher: v.teacher, createdAt: v.created_at })),
      courseId: t.course_id,
      chapterId: t.chapter_id,
      siblings: access.siblings,
      nextClass: upcoming[0] ? toClass(upcoming[0]) : null,
      pastClasses: past.map(toClass),
    },
  };
}

/** Tick a topic done (or undo it). */
export async function setTopicDoneAction(lessonId: string, done: boolean): Promise<{ ok: boolean }> {
  const user = await requireRole(["student"]);
  const t = await loadTopic(String(lessonId ?? ""));
  if (!t || !(await canOpen(user.id, t)).ok) return { ok: false };
  await db.prepare(
    `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
     VALUES (?, ?, ?, CASE WHEN ? = 1 THEN to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD HH24:MI:SS') END)
     ON CONFLICT (user_id, lesson_id) DO UPDATE
       SET completed = EXCLUDED.completed, completed_at = EXCLUDED.completed_at`
  ).run(user.id, t.id, done ? 1 : 0, done ? 1 : 0);
  revalidatePath("/");
  return { ok: true };
}

/** A doubt raised from inside a topic — tagged with it so faculty see the context. */
export async function askTopicDoubtAction(lessonId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireRole(["student"]);
  const text = String(body ?? "").trim();
  if (!text) return { ok: false, error: "Write your doubt first." };
  const t = await loadTopic(String(lessonId ?? ""));
  if (!t || !(await canOpen(user.id, t)).ok) return { ok: false, error: "You can't ask on this topic." };

  await db.prepare(
    `INSERT INTO doubts (id, student_id, course_id, lesson_id, subject, body, status)
     VALUES (?, ?, ?, ?, ?, ?, 'open')`
  ).run(newId(), user.id, t.course_id, t.id, `${t.subject ?? t.module_title} · ${t.title}`, text);

  revalidatePath("/");
  revalidatePath("/teacher/doubts");
  return { ok: true };
}
