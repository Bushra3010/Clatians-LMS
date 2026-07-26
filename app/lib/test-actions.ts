"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { logAudit } from "./audit";

// ────────────────────────────────────────────────────────────
// Student — take & submit
// ────────────────────────────────────────────────────────────
export type TakeQuestion = { id: string; subject: string; text: string; a: string; b: string; c: string; d: string };
export type StartResult =
  | { ok: true; attemptId: string; title: string; durationMin: number; questions: TakeQuestion[] }
  | { ok: false; error: string };

export async function startTestAction(testId: string): Promise<StartResult> {
  const user = await requireRole(["student"]);

  const test = db
    .prepare(
      `SELECT id, title, duration_min FROM tests
       WHERE id = ? AND status = 'published'
         AND (course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?) OR course_id IS NULL)`
    )
    .get(testId, user.id) as { id: string; title: string; duration_min: number } | undefined;
  if (!test) return { ok: false, error: "This test isn't available for your batch." };

  const questions = db
    .prepare("SELECT id, subject, text, opt_a, opt_b, opt_c, opt_d FROM questions WHERE test_id = ? ORDER BY order_idx")
    .all(testId) as { id: string; subject: string; text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string }[];
  if (questions.length === 0) return { ok: false, error: "This test has no questions yet." };

  const attemptId = newId();
  db.prepare("INSERT INTO test_attempts (id, test_id, user_id) VALUES (?, ?, ?)").run(attemptId, testId, user.id);

  return {
    ok: true,
    attemptId,
    title: test.title,
    durationMin: test.duration_min,
    questions: questions.map((q) => ({ id: q.id, subject: q.subject, text: q.text, a: q.opt_a, b: q.opt_b, c: q.opt_c, d: q.opt_d })),
  };
}

export type ReviewItem = { id: string; subject: string; text: string; a: string; b: string; c: string; d: string; correct: string; chosen: string | null };
export type SubmitResult =
  | { ok: true; score: number; total: number; correct: number; wrong: number; unattempted: number; rank: number; percentile: number; takers: number; review: ReviewItem[] }
  | { ok: false; error: string };

export async function submitAttemptAction(attemptId: string, answers: Record<string, string>): Promise<SubmitResult> {
  const user = await requireRole(["student"]);

  const attempt = db
    .prepare("SELECT id, test_id, user_id, status FROM test_attempts WHERE id = ?")
    .get(attemptId) as { id: string; test_id: string; user_id: string; status: string } | undefined;
  if (!attempt || attempt.user_id !== user.id) return { ok: false, error: "Attempt not found." };
  if (attempt.status === "submitted") return { ok: false, error: "This attempt is already submitted." };

  const questions = db
    .prepare("SELECT id, subject, text, opt_a, opt_b, opt_c, opt_d, correct, marks, negative FROM questions WHERE test_id = ? ORDER BY order_idx")
    .all(attempt.test_id) as { id: string; subject: string; text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string; correct: string; marks: number; negative: number }[];

  let score = 0, total = 0, correct = 0, wrong = 0, unattempted = 0;
  const review: ReviewItem[] = [];
  for (const q of questions) {
    total += q.marks;
    const chosen = answers[q.id] ?? null;
    if (!chosen) unattempted++;
    else if (chosen === q.correct) { score += q.marks; correct++; }
    else { score -= q.negative; wrong++; }
    review.push({ id: q.id, subject: q.subject, text: q.text, a: q.opt_a, b: q.opt_b, c: q.opt_c, d: q.opt_d, correct: q.correct, chosen });
  }
  score = Math.round(score * 100) / 100;

  db.prepare(
    `UPDATE test_attempts SET score=?, total=?, correct_cnt=?, wrong_cnt=?, unattempted=?, answers=?, status='submitted', submitted_at=datetime('now') WHERE id=?`
  ).run(score, total, correct, wrong, unattempted, JSON.stringify(answers), attemptId);

  // All-India rank & percentile among submitted attempts for this test.
  const takers = (db.prepare("SELECT COUNT(*) n FROM test_attempts WHERE test_id=? AND status='submitted'").get(attempt.test_id) as { n: number }).n;
  const above = (db.prepare("SELECT COUNT(*) n FROM test_attempts WHERE test_id=? AND status='submitted' AND score > ?").get(attempt.test_id, score) as { n: number }).n;
  const below = (db.prepare("SELECT COUNT(*) n FROM test_attempts WHERE test_id=? AND status='submitted' AND score < ?").get(attempt.test_id, score) as { n: number }).n;
  const rank = above + 1;
  const percentile = takers > 1 ? Math.round((below / (takers - 1)) * 100) : 100;

  revalidatePath("/");
  return { ok: true, score, total, correct, wrong, unattempted, rank, percentile, takers, review };
}

// ────────────────────────────────────────────────────────────
// Teacher / Admin — author
// ────────────────────────────────────────────────────────────
export async function createTestAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "mock");
  const courseId = String(formData.get("courseId") ?? "") || null;
  const duration = Math.max(5, Math.round(Number(formData.get("duration") ?? 60) || 60));
  if (!title) return;

  db.prepare(
    `INSERT INTO tests (id, title, description, type, course_id, duration_min, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`
  ).run(newId(), title, description, ["mock", "sectional", "pyq"].includes(type) ? type : "mock", courseId, duration, user.id);

  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
}

export async function addQuestionAction(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const testId = String(formData.get("testId") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const a = String(formData.get("a") ?? "").trim();
  const b = String(formData.get("b") ?? "").trim();
  const c = String(formData.get("c") ?? "").trim();
  const d = String(formData.get("d") ?? "").trim();
  const correct = String(formData.get("correct") ?? "a");
  const subject = String(formData.get("subject") ?? "").trim();
  if (!testId || !text || !a || !b || !c || !d || !["a", "b", "c", "d"].includes(correct)) return;

  const n = (db.prepare("SELECT COUNT(*) n FROM questions WHERE test_id=?").get(testId) as { n: number }).n;
  db.prepare(
    `INSERT INTO questions (id, test_id, subject, text, opt_a, opt_b, opt_c, opt_d, correct, order_idx)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(newId(), testId, subject, text, a, b, c, d, correct, n);

  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
}

export async function setTestStatusAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const testId = String(formData.get("testId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["draft", "published"].includes(status)) return;
  const t = db.prepare("SELECT title FROM tests WHERE id=?").get(testId) as { title: string } | undefined;
  db.prepare("UPDATE tests SET status=? WHERE id=?").run(status, testId);
  logAudit(user, status === "published" ? "Published test" : "Unpublished test", t?.title ?? testId);
  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
  revalidatePath("/");
}

export async function deleteTestAction(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const testId = String(formData.get("testId") ?? "");
  db.prepare("DELETE FROM tests WHERE id=?").run(testId);
  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
  revalidatePath("/");
}
