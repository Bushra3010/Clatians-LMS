"use server";

import { db } from "./db";
import { requireRole } from "./auth";
import { loadCourseSyllabus, type CourseSyllabus } from "./learning";

export type SyllabusResult = { ok: true; syllabus: CourseSyllabus } | { ok: false; error: string };

/** A course's chapters and topics, with the student's progress — for Course, Batch and Chapter views. */
export async function getCourseSyllabusAction(courseId: string): Promise<SyllabusResult> {
  const user = await requireRole(["student"]);
  const id = String(courseId ?? "");
  const course = await db.prepare("SELECT id FROM courses WHERE id = ? AND status = 'active'").get(id);
  if (!course) return { ok: false, error: "This course is no longer available." };
  return { ok: true, syllabus: await loadCourseSyllabus(user.id, id) };
}

export type BatchAnnouncement = { id: string; title: string; body: string; createdAt: string };
export type BatchExtras = {
  announcements: BatchAnnouncement[];
  studentCount: number;
  /** First names of classmates — only shown to students in the batch. */
  classmates: string[];
};

/** The Announcements and Students tabs of a batch. */
export async function getBatchExtrasAction(batchId: string): Promise<{ ok: true; extras: BatchExtras } | { ok: false; error: string }> {
  const user = await requireRole(["student"]);
  const batch = await db.prepare("SELECT id, course_id FROM batches WHERE id = ?").get(String(batchId ?? "")) as { id: string; course_id: string | null } | undefined;
  if (!batch) return { ok: false, error: "This batch is no longer available." };

  const [announcements, students, mine] = await Promise.all([
    db.prepare(
      `SELECT id, title, body, created_at FROM announcements
       WHERE course_id = ? OR course_id IS NULL
       ORDER BY created_at DESC LIMIT 20`
    ).all(batch.course_id) as Promise<{ id: string; title: string; body: string; created_at: string }[]>,
    db.prepare(
      `SELECT u.name FROM batch_enrollments be JOIN users u ON u.id = be.user_id
       WHERE be.batch_id = ? AND be.status = 'active' ORDER BY be.created_at`
    ).all(batch.id) as Promise<{ name: string }[]>,
    db.prepare("SELECT 1 FROM batch_enrollments WHERE batch_id = ? AND user_id = ?").get(batch.id, user.id),
  ]);

  return {
    ok: true,
    extras: {
      announcements: announcements.map((a) => ({ id: a.id, title: a.title, body: a.body, createdAt: a.created_at })),
      studentCount: students.length,
      classmates: mine ? students.map((s) => (s.name || "").split(" ")[0]).filter(Boolean) : [],
    },
  };
}

/** A chapter's test (questions from all its topics), with the student's best attempt. */
export type ChapterTest = {
  chapterId: string;
  testId: string;
  title: string;
  questions: number;
  durationMin: number;
  attempts: number;
  bestScore: number | null;
  bestTotal: number | null;
};

/** Every chapter test in a course, in each chapter's order (Test 1, Test 2…). */
export async function getCourseTestsAction(courseId: string): Promise<{ ok: true; tests: ChapterTest[] } | { ok: false; error: string }> {
  const user = await requireRole(["student"]);
  const rows = await db.prepare(
    `SELECT ch.id AS chapter_id, t.id AS test_id, t.title, t.duration_min,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS questions,
            (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status = 'submitted') AS attempts,
            (SELECT MAX(a.score) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status = 'submitted') AS best_score,
            (SELECT a.total FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status = 'submitted' ORDER BY a.score DESC LIMIT 1) AS best_total
     FROM modules m
     JOIN chapters ch ON ch.module_id = m.id
     JOIN chapter_tests ct ON ct.chapter_id = ch.id
     JOIN tests t ON t.id = ct.test_id AND t.status = 'published'
     WHERE m.course_id = ?
     ORDER BY ct.sort_order, ct.created_at, t.title`
  ).all(user.id, user.id, user.id, String(courseId ?? "")) as {
    chapter_id: string; test_id: string; title: string; duration_min: number; questions: number;
    attempts: number; best_score: number | null; best_total: number | null;
  }[];
  return {
    ok: true,
    tests: rows.filter((r) => Number(r.questions) > 0).map((r) => ({
      chapterId: r.chapter_id, testId: r.test_id, title: r.title, questions: Number(r.questions),
      durationMin: r.duration_min || 0, attempts: Number(r.attempts) || 0,
      bestScore: r.best_score == null ? null : Number(r.best_score), bestTotal: r.best_total == null ? null : Number(r.best_total),
    })),
  };
}

/** A full mock test (all sections mixed), with the student's best attempt — for the batch's Tests tab. */
export type MockTest = {
  testId: string;
  title: string;
  questions: number;
  durationMin: number;
  /** Sections the paper covers, in the order they first appear. */
  subjects: string[];
  attempts: number;
  bestScore: number | null;
  bestTotal: number | null;
};

/** The course's published full mocks plus the ones open to every course, oldest first (Test 1, Test 2…). */
export async function getBatchMocksAction(courseId: string): Promise<{ ok: true; tests: MockTest[] } | { ok: false; error: string }> {
  const user = await requireRole(["student"]);
  const rows = await db.prepare(
    `SELECT t.id, t.title, t.duration_min,
            (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS questions,
            (SELECT string_agg(s.subject, '|' ORDER BY s.first) FROM (
               SELECT q.subject, MIN(q.order_idx) AS first FROM questions q
               WHERE q.test_id = t.id AND q.subject <> '' GROUP BY q.subject
             ) s) AS subjects,
            (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status = 'submitted') AS attempts,
            (SELECT MAX(a.score) FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status = 'submitted') AS best_score,
            (SELECT a.total FROM test_attempts a WHERE a.test_id = t.id AND a.user_id = ? AND a.status = 'submitted' ORDER BY a.score DESC LIMIT 1) AS best_total
     FROM tests t
     WHERE t.status = 'published' AND t.type = 'mock' AND (t.course_id = ? OR t.course_id IS NULL)
     ORDER BY t.created_at, t.title`
  ).all(user.id, user.id, user.id, String(courseId ?? "")) as {
    id: string; title: string; duration_min: number; questions: number; subjects: string | null;
    attempts: number; best_score: number | null; best_total: number | null;
  }[];
  return {
    ok: true,
    tests: rows.filter((r) => Number(r.questions) > 0).map((r) => ({
      testId: r.id, title: r.title, questions: Number(r.questions), durationMin: r.duration_min || 0,
      subjects: (r.subjects ?? "").split("|").filter(Boolean), attempts: Number(r.attempts) || 0,
      bestScore: r.best_score == null ? null : Number(r.best_score), bestTotal: r.best_total == null ? null : Number(r.best_total),
    })),
  };
}
