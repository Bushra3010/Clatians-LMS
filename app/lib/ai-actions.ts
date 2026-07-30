"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { runTutor, generateQuestions, explainAnswer, aiConfigured, type ChatMsg, type Role } from "./ai";

export type AskResult = { threadId: string; reply: string };

/**
 * Send a message to the AI Tutor. Creates a thread on the first message,
 * persists both sides, and returns the assistant's reply. Threads are
 * private to the user who owns them.
 */
export async function askTutorAction(threadId: string | null, userText: string): Promise<AskResult> {
  const user = await requireRole(["student", "teacher", "admin"]);
  const text = userText.trim().slice(0, 8000);
  if (!text) return { threadId: threadId ?? "", reply: "" };

  if (!aiConfigured()) {
    return {
      threadId: threadId ?? "",
      reply: "⚠️ The AI Tutor isn't switched on yet. An admin needs to add a GEMINI_API_KEY in the app's environment settings.",
    };
  }

  // Resolve the thread — create one if missing, or if the given id isn't the user's.
  let tid = threadId;
  if (tid) {
    const owned = await db.prepare("SELECT id FROM ai_threads WHERE id = ? AND user_id = ?").get(tid, user.id);
    if (!owned) tid = null;
  }
  if (!tid) {
    tid = newId();
    await db.prepare("INSERT INTO ai_threads (id, user_id, title) VALUES (?, ?, ?)").run(tid, user.id, text.slice(0, 60));
  }

  await db.prepare("INSERT INTO ai_messages (id, thread_id, role, content) VALUES (?, ?, 'user', ?)").run(newId(), tid, text);

  // Last ~24 turns of context (oldest first).
  const history = (await db.prepare(
    "SELECT role, content FROM (SELECT role, content, created_at FROM ai_messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT 24) t ORDER BY created_at ASC"
  ).all(tid)) as ChatMsg[];

  let reply: string;
  try {
    reply = await runTutor(history, user.role as Role);
  } catch (err) {
    console.error("AI tutor error:", err);
    reply = "Sorry — I hit a problem generating a response. Please try again in a moment.";
  }

  await db.prepare("INSERT INTO ai_messages (id, thread_id, role, content) VALUES (?, ?, 'assistant', ?)").run(newId(), tid, reply);
  return { threadId: tid, reply };
}

/** Start a brand-new conversation (returns nothing; the client just clears state). */
export async function newTutorThreadAction(): Promise<void> {
  await requireRole(["student", "teacher", "admin"]);
}

export type GenerateInput = { testId: string; topic: string; subject: string; difficulty: string; count: number };
export type GenerateOutcome = { ok: boolean; added: number; error?: string };

/**
 * Generate CLAT MCQs with AI and append them to a test. Returns an outcome the
 * UI can display (added count or a friendly error). Teachers may only add to
 * their own tests; admins to any.
 */
export async function generateQuestionsAction(input: GenerateInput): Promise<GenerateOutcome> {
  const user = await requireRole(["teacher", "admin"]);
  const testId = String(input.testId ?? "");
  const topic = String(input.topic ?? "").trim().slice(0, 300);
  const subject = String(input.subject ?? "").trim();
  const difficulty = String(input.difficulty ?? "medium");
  const count = Math.min(10, Math.max(1, Math.round(Number(input.count) || 5)));
  if (!aiConfigured()) return { ok: false, added: 0, error: "AI generation is off — an admin needs to set GEMINI_API_KEY." };
  if (!testId || !topic) return { ok: false, added: 0, error: "Please enter a topic first." };

  // Ownership: teachers can only extend their own tests.
  const test = (await db.prepare("SELECT id, created_by FROM tests WHERE id = ?").get(testId)) as
    | { id: string; created_by: string | null }
    | undefined;
  if (!test) return { ok: false, added: 0, error: "That test no longer exists." };
  if (user.role !== "admin" && test.created_by !== user.id) return { ok: false, added: 0, error: "You can only add to your own tests." };

  const { questions, error } = await generateQuestions(topic, count, subject, difficulty);
  if (error) return { ok: false, added: 0, error };
  if (questions.length === 0) return { ok: false, added: 0, error: "No questions were generated — try again." };

  const startIdx = (await db.prepare("SELECT COUNT(*) n FROM questions WHERE test_id = ?").get(testId) as { n: number }).n;
  const insert = await db.prepare(
    `INSERT INTO questions (id, test_id, subject, text, opt_a, opt_b, opt_c, opt_d, correct, order_idx)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await insert.run(newId(), testId, q.subject, q.text, q.a, q.b, q.c, q.d, q.correct, startIdx + i);
  }

  revalidatePath("/teacher/tests");
  revalidatePath("/admin/tests");
  return { ok: true, added: questions.length };
}

export type ExplainOutcome = { ok: boolean; text?: string; error?: string };

/**
 * Explain a reviewed MCQ to a student with AI. The question is re-read from the
 * database by id (authoritative), so the client can't spoof the correct answer;
 * `chosen` is the student's selected option (a/b/c/d) or null.
 */
export async function explainAnswerAction(input: { questionId: string; chosen: string | null }): Promise<ExplainOutcome> {
  const user = await requireRole(["student", "teacher", "admin"]);
  if (!aiConfigured()) return { ok: false, error: "The AI Tutor isn't switched on — an admin needs to set GEMINI_API_KEY." };

  const questionId = String(input.questionId ?? "");
  if (!questionId) return { ok: false, error: "Missing question." };
  const chosen = ["a", "b", "c", "d"].includes(String(input.chosen)) ? String(input.chosen) : null;

  const q = (await db.prepare(
    "SELECT subject, text, opt_a, opt_b, opt_c, opt_d, correct FROM questions WHERE id = ?"
  ).get(questionId)) as
    | { subject: string; text: string; opt_a: string; opt_b: string; opt_c: string; opt_d: string; correct: string }
    | undefined;
  if (!q) return { ok: false, error: "That question no longer exists." };

  // Students may only get explanations for tests they've actually submitted —
  // the explanation reveals the correct answer. Teachers/admins are exempt.
  if (user.role === "student") {
    const attempted = await db.prepare(
      `SELECT 1 FROM test_attempts a
       JOIN questions q ON q.test_id = a.test_id
       WHERE q.id = ? AND a.user_id = ? AND a.status = 'submitted' LIMIT 1`
    ).get(questionId, user.id);
    if (!attempted) return { ok: false, error: "Explanations are available after you submit the test." };
  }

  const { text, error } = await explainAnswer({
    subject: q.subject,
    text: q.text,
    a: q.opt_a,
    b: q.opt_b,
    c: q.opt_c,
    d: q.opt_d,
    correct: q.correct,
    chosen,
  });
  if (error) return { ok: false, error };
  return { ok: true, text };
}
