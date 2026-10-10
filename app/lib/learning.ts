import "server-only";
import { db } from "./db";

/**
 * The "My Learning" flow: course → batch → chapter → topic. A course's
 * chapters come from its modules (one per subject), and a batch is a cohort
 * of the course, so every batch of a course studies the same chapters.
 */
export type LearningTopic = {
  id: string;
  title: string;
  durationMin: number;
  isFree: boolean;
  hasVideo: boolean;
  hasNotes: boolean;
  hasTest: boolean;
  completed: boolean;
  /** Paid topic and not enrolled, or the previous topic isn't finished yet. */
  locked: boolean;
};
export type LearningChapter = { id: string; title: string; subject: string; number: number; topics: LearningTopic[] };
export type CourseSyllabus = { courseId: string; enrolled: boolean; chapters: LearningChapter[] };

type TopicRow = {
  id: string; title: string; duration_min: number; is_free: number;
  has_video: number; has_notes: number; has_test: number; completed: number;
};

export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  return !!(await db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(userId, courseId));
}

/**
 * Inside a chapter, topics open one after another: an enrolled student
 * unlocks a topic by finishing the one before it. Anyone else gets only the
 * free previews.
 */
function withLocks(rows: TopicRow[], enrolled: boolean): LearningTopic[] {
  return rows.map((r, i) => {
    const completed = r.completed === 1;
    const locked = enrolled
      ? i > 0 && !completed && rows[i - 1].completed !== 1
      : r.is_free !== 1;
    return {
      id: r.id, title: r.title || "Untitled topic", durationMin: r.duration_min || 0, isFree: r.is_free === 1,
      hasVideo: r.has_video === 1, hasNotes: r.has_notes === 1, hasTest: r.has_test === 1,
      completed, locked,
    };
  });
}

const topicCols = `l.id, l.title, l.duration_min, l.is_free,
  (l.video_url <> '')::int AS has_video,
  (l.body <> '' OR l.notes_url <> '')::int AS has_notes,
  (l.test_id IS NOT NULL)::int AS has_test,
  COALESCE(lp.completed, 0) AS completed`;

/** A chapter's topics in order, with the student's progress and locks. */
export async function loadChapterTopics(userId: string, chapterId: string, enrolled: boolean): Promise<LearningTopic[]> {
  const rows = await db.prepare(
    `SELECT ${topicCols}
     FROM lessons l
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
     WHERE l.chapter_id = ?
     ORDER BY l.sort_order, l.created_at`
  ).all(userId, chapterId) as TopicRow[];
  return withLocks(rows, enrolled);
}

/** Every chapter of a course, numbered in syllabus order. */
export async function loadCourseSyllabus(userId: string, courseId: string): Promise<CourseSyllabus> {
  const [enrolled, rows] = await Promise.all([
    isEnrolled(userId, courseId),
    db.prepare(
      `SELECT ch.id AS chapter_id, ch.title AS chapter_title,
              COALESCE(s.name, m.title) AS subject,
              ${topicCols}
       FROM modules m
       LEFT JOIN subjects s ON s.id = m.subject_id
       JOIN chapters ch ON ch.module_id = m.id
       LEFT JOIN lessons l ON l.chapter_id = ch.id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
       WHERE m.course_id = ?
       ORDER BY s.sort_order NULLS LAST, s.name, m.sort_order, ch.sort_order, ch.created_at, l.sort_order, l.created_at`
    ).all(userId, courseId) as Promise<(TopicRow & { chapter_id: string; chapter_title: string; subject: string })[]>,
  ]);

  // Rows arrive in syllabus order, so appending keeps it.
  const grouped: { id: string; title: string; subject: string; rows: TopicRow[] }[] = [];
  for (const r of rows) {
    let ch = grouped.find((c) => c.id === r.chapter_id);
    if (!ch) {
      ch = { id: r.chapter_id, title: r.chapter_title || "Untitled chapter", subject: r.subject, rows: [] };
      grouped.push(ch);
    }
    if (r.id) ch.rows.push(r); // a chapter with no topics yet has one all-null row
  }

  return {
    courseId,
    enrolled,
    chapters: grouped.map((c, i) => ({ id: c.id, title: c.title, subject: c.subject, number: i + 1, topics: withLocks(c.rows, enrolled) })),
  };
}
