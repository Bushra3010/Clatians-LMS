"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { logAudit } from "./audit";
import { normalizeTestType, normalizeDuration, type TestType } from "./test-types";

// ────────────────────────────────────────────────────────────
// Student — take & submit
// ────────────────────────────────────────────────────────────
export type TakeQuestion = { id: string; subject: string; passage: string; text: string; a: string; b: string; c: string; d: string };
export type StartResult =
  | { ok: true; attemptId: string; title: string; type: TestType; durationMin: number; questions: TakeQuestion[] }
  | { ok: false; error: string };

export async function startTestAction(testId: string): Promise<StartResult> {
  const user = await requireRole(["student"]);

  const test = await db
    .prepare(
      `SELECT id, title, type, duration_min FROM tests
       WHERE id = ? AND status = 'published'
         AND (course_id IN (SELECT course_id FROM enrollments WHERE user_id = ?) OR course_id IS NULL)`
    )
    .get(testId, user.id) as { id: string; title: string; type: string; duration_min: number } | undefined;
  if (!test) return { ok: false, error: "This test isn't available for your batch." };

  const questions = await db
    .prepare("SELECT id, subject, passage, text, opt_a, opt_b, opt_c, opt_d FROM questions WHERE test_id = ? ORDER BY order_idx")
    .all(testId) as { id: string; subject: string; passage: string; text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string }[];
  if (questions.length === 0) return { ok: false, error: "This test has no questions yet." };

  const attemptId = newId();
  await db.prepare("INSERT INTO test_attempts (id, test_id, user_id) VALUES (?, ?, ?)").run(attemptId, testId, user.id);

  return {
    ok: true,
    attemptId,
    title: test.title,
    type: normalizeTestType(test.type),
    durationMin: test.duration_min,
    questions: questions.map((q) => ({ id: q.id, subject: q.subject, passage: q.passage, text: q.text, a: q.opt_a, b: q.opt_b, c: q.opt_c, d: q.opt_d })),
  };
}

export type ReviewItem = { id: string; subject: string; passage: string; text: string; a: string; b: string; c: string; d: string; correct: string; chosen: string | null; explanation: string };
export type SubmitResult =
  | { ok: true; score: number; total: number; correct: number; wrong: number; unattempted: number; rank: number; percentile: number; takers: number; review: ReviewItem[] }
  | { ok: false; error: string };

export async function submitAttemptAction(attemptId: string, answers: Record<string, string>): Promise<SubmitResult> {
  const user = await requireRole(["student"]);

  const attempt = await db
    .prepare("SELECT id, test_id, user_id, status FROM test_attempts WHERE id = ?")
    .get(attemptId) as { id: string; test_id: string; user_id: string; status: string } | undefined;
  if (!attempt || attempt.user_id !== user.id) return { ok: false, error: "Attempt not found." };
  if (attempt.status === "submitted") return { ok: false, error: "This attempt is already submitted." };

  const questions = await db
    .prepare("SELECT id, subject, passage, text, opt_a, opt_b, opt_c, opt_d, correct, marks, negative, explanation FROM questions WHERE test_id = ? ORDER BY order_idx")
    .all(attempt.test_id) as { id: string; subject: string; passage: string; text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string; correct: string; marks: number; negative: number; explanation: string }[];

  let score = 0, total = 0, correct = 0, wrong = 0, unattempted = 0;
  const review: ReviewItem[] = [];
  for (const q of questions) {
    total += q.marks;
    const chosen = answers[q.id] ?? null;
    if (!chosen) unattempted++;
    else if (chosen === q.correct) { score += q.marks; correct++; }
    else { score -= q.negative; wrong++; }
    review.push({ id: q.id, subject: q.subject, passage: q.passage, text: q.text, a: q.opt_a, b: q.opt_b, c: q.opt_c, d: q.opt_d, correct: q.correct, chosen, explanation: q.explanation });
  }
  score = Math.round(score * 100) / 100;

  await db.prepare(
    `UPDATE test_attempts SET score=?, total=?, correct_cnt=?, wrong_cnt=?, unattempted=?, answers=?, status='submitted', submitted_at=to_char((now() at time zone 'utc'), 'YYYY-MM-DD HH24:MI:SS') WHERE id=?`
  ).run(score, total, correct, wrong, unattempted, JSON.stringify(answers), attemptId);

  // All-India rank & percentile among submitted attempts for this test.
  const takers = (await db.prepare("SELECT COUNT(*) n FROM test_attempts WHERE test_id=? AND status='submitted'").get(attempt.test_id) as { n: number }).n;
  const above = (await db.prepare("SELECT COUNT(*) n FROM test_attempts WHERE test_id=? AND status='submitted' AND score > ?").get(attempt.test_id, score) as { n: number }).n;
  const below = (await db.prepare("SELECT COUNT(*) n FROM test_attempts WHERE test_id=? AND status='submitted' AND score < ?").get(attempt.test_id, score) as { n: number }).n;
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
  const duration = normalizeDuration(formData.get("duration"));
  if (!title) return;

  await db.prepare(
    `INSERT INTO tests (id, title, description, type, course_id, duration_min, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`
  ).run(newId(), title, description, normalizeTestType(type), courseId, duration, user.id);

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
  const explanation = String(formData.get("explanation") ?? "").trim();
  const passage = String(formData.get("passage") ?? "").trim();
  if (!testId || !text || !a || !b || !c || !d || !["a", "b", "c", "d"].includes(correct)) return;

  const n = (await db.prepare("SELECT COUNT(*) n FROM questions WHERE test_id=?").get(testId) as { n: number }).n;
  await db.prepare(
    `INSERT INTO questions (id, test_id, subject, passage, text, opt_a, opt_b, opt_c, opt_d, correct, explanation, order_idx)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(newId(), testId, subject, passage, text, a, b, c, d, correct, explanation, n);

  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
}

/**
 * A comprehension set: one passage (principle + facts, or an RC passage) and
 * the questions that hang off it, added in one go so every question carries
 * the identical passage and they land consecutively in the paper.
 */
export async function addComprehensionAction(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const testId = String(formData.get("testId") ?? "");
  const passage = String(formData.get("passage") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  if (!testId || !passage) return;

  const rows: { text: string; a: string; b: string; c: string; d: string; correct: string; explanation: string }[] = [];
  for (let k = 1; k <= 5; k++) {
    const f = (name: string) => String(formData.get(`q${k}_${name}`) ?? "").trim();
    const row = { text: f("text"), a: f("a"), b: f("b"), c: f("c"), d: f("d"), correct: f("correct") || "a", explanation: f("explanation") };
    if (!row.text) continue;
    if (!row.a || !row.b || !row.c || !row.d || !["a", "b", "c", "d"].includes(row.correct)) continue;
    rows.push(row);
  }
  if (rows.length === 0) return;

  let n = (await db.prepare("SELECT COUNT(*) n FROM questions WHERE test_id=?").get(testId) as { n: number }).n;
  for (const q of rows) {
    await db.prepare(
      `INSERT INTO questions (id, test_id, subject, passage, text, opt_a, opt_b, opt_c, opt_d, correct, explanation, order_idx)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(newId(), testId, subject, passage, q.text, q.a, q.b, q.c, q.d, q.correct, q.explanation, n++);
  }

  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
  revalidatePath("/");
}

export async function setTestStatusAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const testId = String(formData.get("testId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["draft", "published"].includes(status)) return;
  const t = await db.prepare("SELECT title FROM tests WHERE id=?").get(testId) as { title: string } | undefined;
  await db.prepare("UPDATE tests SET status=? WHERE id=?").run(status, testId);
  await logAudit(user, status === "published" ? "Published test" : "Unpublished test", t?.title ?? testId);
  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
  revalidatePath("/");
}

export async function deleteTestAction(formData: FormData) {
  await requireRole(["teacher", "admin"]);
  const testId = String(formData.get("testId") ?? "");
  await db.prepare("DELETE FROM tests WHERE id=?").run(testId);
  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
  revalidatePath("/");
}

/** Edit a test's details. Teachers may only edit their own tests. */
export async function editTestAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const testId = String(formData.get("testId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "mock");
  const courseId = String(formData.get("courseId") ?? "") || null;
  const duration = normalizeDuration(formData.get("duration"));
  if (!testId || !title) return;

  const test = await db.prepare("SELECT created_by FROM tests WHERE id=?").get(testId) as { created_by: string | null } | undefined;
  if (!test) return;
  if (user.role !== "admin" && test.created_by !== user.id) return;

  await db.prepare(
    "UPDATE tests SET title=?, description=?, type=?, course_id=?, duration_min=? WHERE id=?"
  ).run(title, description, normalizeTestType(type), courseId, duration, testId);

  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
  revalidatePath("/");
}

/** Delete a single question. Teachers may only touch their own tests. */
export async function deleteQuestionAction(formData: FormData) {
  const user = await requireRole(["teacher", "admin"]);
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId) return;

  const owner = await db.prepare(
    "SELECT t.created_by FROM questions q JOIN tests t ON t.id = q.test_id WHERE q.id = ?"
  ).get(questionId) as { created_by: string | null } | undefined;
  if (!owner) return;
  if (user.role !== "admin" && owner.created_by !== user.id) return;

  await db.prepare("DELETE FROM questions WHERE id=?").run(questionId);
  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
  revalidatePath("/");
}
