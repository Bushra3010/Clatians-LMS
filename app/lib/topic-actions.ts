"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";

/**
 * One syllabus topic (a `lessons` row) as the student sees it: the video,
 * the notes, the topic's practice test and the student's own doubts on it.
 */
export type TopicDoubt = { id: string; body: string; status: string; answer: string; teacher: string | null; createdAt: string };

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
};

export type TopicResult = { ok: true; topic: TopicDetail } | { ok: false; error: string };

type TopicRow = {
  id: string; title: string; body: string; video_url: string; notes_url: string;
  duration_min: number; is_free: number; test_id: string | null;
  chapter: string; course_id: string; subject: string | null; module_title: string;
};

async function loadTopic(lessonId: string) {
  return await db.prepare(
    `SELECT l.id, l.title, l.body, l.video_url, l.notes_url, l.duration_min, l.is_free, l.test_id,
            ch.title AS chapter, m.course_id, s.name AS subject, m.title AS module_title
     FROM lessons l
     JOIN chapters ch ON ch.id = l.chapter_id
     JOIN modules m ON m.id = ch.module_id
     LEFT JOIN subjects s ON s.id = m.subject_id
     WHERE l.id = ?`
  ).get(lessonId) as TopicRow | undefined;
}

/** Enrolled students see every topic; everyone else only the free previews. */
async function canOpen(userId: string, t: TopicRow): Promise<boolean> {
  if (t.is_free) return true;
  const enr = await db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(userId, t.course_id);
  return !!enr;
}

export async function getTopicAction(lessonId: string): Promise<TopicResult> {
  const user = await requireRole(["student"]);
  const t = await loadTopic(String(lessonId ?? ""));
  if (!t) return { ok: false, error: "This topic no longer exists." };
  if (!(await canOpen(user.id, t))) return { ok: false, error: "Enrol in this course to unlock this topic." };

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
    `SELECT d.id, d.body, d.status, d.answer, d.created_at, u.name AS teacher
     FROM doubts d LEFT JOIN users u ON u.id = d.answered_by
     WHERE d.student_id = ? AND d.lesson_id = ? ORDER BY d.created_at DESC`
  ).all(user.id, t.id) as { id: string; body: string; status: string; answer: string; created_at: string; teacher: string | null }[];

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
      doubts: doubts.map((d) => ({ id: d.id, body: d.body, status: d.status, answer: d.answer, teacher: d.teacher, createdAt: d.created_at })),
    },
  };
}

/** Tick a topic done (or undo it). */
export async function setTopicDoneAction(lessonId: string, done: boolean): Promise<{ ok: boolean }> {
  const user = await requireRole(["student"]);
  const t = await loadTopic(String(lessonId ?? ""));
  if (!t || !(await canOpen(user.id, t))) return { ok: false };
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
  if (!t || !(await canOpen(user.id, t))) return { ok: false, error: "You can't ask on this topic." };

  await db.prepare(
    `INSERT INTO doubts (id, student_id, course_id, lesson_id, subject, body, status)
     VALUES (?, ?, ?, ?, ?, ?, 'open')`
  ).run(newId(), user.id, t.course_id, t.id, `${t.subject ?? t.module_title} · ${t.title}`, text);

  revalidatePath("/");
  revalidatePath("/teacher/doubts");
  return { ok: true };
}
