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
