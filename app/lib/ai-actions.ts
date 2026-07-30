"use server";

import { revalidatePath } from "next/cache";
import { db, newId } from "./db";
import { requireRole } from "./auth";
import { runTutor, generateQuestions, generatePractice, explainAnswer, coachStudy, draftDoubtAnswer, generateCurrentAffairs, aiConfigured, type ChatMsg, type Role, type PracticeMCQ } from "./ai";

export type { PracticeMCQ };

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

/**
 * Generate a personalised CLAT study plan from the current student's own
 * mock-test data. Subject accuracy is recomputed here from the database, so the
 * plan always reflects real, authoritative performance.
 */
export async function aiCoachAction(): Promise<ExplainOutcome> {
  const user = await requireRole(["student", "teacher", "admin"]);
  if (!aiConfigured()) return { ok: false, error: "The AI Tutor isn't switched on — an admin needs to set GEMINI_API_KEY." };

  const attempts = (await db.prepare(
    "SELECT test_id, score, total, answers FROM test_attempts WHERE user_id = ? AND status = 'submitted'"
  ).all(user.id)) as { test_id: string; score: number; total: number; answers: string }[];
  if (attempts.length === 0) return { ok: false, error: "Take at least one mock test first — then I can build your study plan." };

  const pcts = attempts.filter((a) => a.total > 0).map((a) => (a.score / a.total) * 100);
  const avgPct = pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : null;
  const bestPct = pcts.length ? Math.round(Math.max(...pcts)) : null;

  // Per-subject accuracy across attempted questions.
  const testIds = [...new Set(attempts.map((a) => a.test_id))];
  const qRows = (await db.prepare(
    `SELECT id, subject, correct FROM questions WHERE test_id IN (${testIds.map(() => "?").join(",")})`
  ).all(...testIds)) as { id: string; subject: string; correct: string }[];
  const qById = new Map(qRows.map((q) => [q.id, q]));

  const subjAgg = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    let answers: Record<string, string> = {};
    try { answers = JSON.parse(a.answers); } catch { answers = {}; }
    for (const [qid, chosen] of Object.entries(answers)) {
      const q = qById.get(qid);
      if (!q) continue;
      const subj = q.subject || "General";
      const agg = subjAgg.get(subj) ?? { correct: 0, total: 0 };
      agg.total += 1;
      if (chosen === q.correct) agg.correct += 1;
      subjAgg.set(subj, agg);
    }
  }
  const subjects = [...subjAgg.entries()]
    .map(([subject, v]) => ({ subject, correct: v.correct, total: v.total, pct: Math.round((v.correct / v.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);
  if (subjects.length === 0) return { ok: false, error: "Attempt a few questions in a test first — I need some answers to analyse." };

  const { text, error } = await coachStudy({ testsTaken: attempts.length, avgPct, bestPct, subjects });
  if (error) return { ok: false, error };
  return { ok: true, text };
}

/**
 * Draft an AI reply to a student's doubt for a teacher to review and edit.
 * The doubt is read from the database by id; only teachers/admins may draft.
 */
export async function draftDoubtAnswerAction(doubtId: string): Promise<ExplainOutcome> {
  await requireRole(["teacher", "admin"]);
  if (!aiConfigured()) return { ok: false, error: "The AI Tutor isn't switched on — an admin needs to set GEMINI_API_KEY." };

  const id = String(doubtId ?? "");
  if (!id) return { ok: false, error: "Missing doubt." };

  const doubt = (await db.prepare("SELECT subject, body FROM doubts WHERE id = ?").get(id)) as
    | { subject: string; body: string }
    | undefined;
  if (!doubt) return { ok: false, error: "That doubt no longer exists." };

  const { text, error } = await draftDoubtAnswer({ subject: doubt.subject, body: doubt.body });
  if (error) return { ok: false, error };
  return { ok: true, text };
}

export type DigestOutcome = { ok: boolean; title?: string; body?: string; error?: string };

/**
 * Draft a CLAT current-affairs digest (title + body) from a teacher-supplied
 * theme or notes. Teacher/admin only; the teacher edits and submits the result
 * through the normal content-approval flow.
 */
export async function generateCurrentAffairsAction(input: string): Promise<DigestOutcome> {
  await requireRole(["teacher", "admin"]);
  if (!aiConfigured()) return { ok: false, error: "The AI Tutor isn't switched on — an admin needs to set GEMINI_API_KEY." };

  const topic = String(input ?? "").trim().slice(0, 2000);
  if (!topic) return { ok: false, error: "Enter a topic or paste some notes first." };

  const { title, body, error } = await generateCurrentAffairs(topic);
  if (error) return { ok: false, error };
  return { ok: true, title, body };
}

export type PracticeOutcome = { ok: boolean; questions?: PracticeMCQ[]; error?: string };

/**
 * Generate an on-demand practice quiz (with explanations) for a student.
 * Any signed-in learner may use it; count is clamped to 3–10.
 */
export async function generatePracticeAction(input: {
  topic: string;
  subject: string;
  difficulty: string;
  count: number;
}): Promise<PracticeOutcome> {
  await requireRole(["student", "teacher", "admin"]);
  if (!aiConfigured()) return { ok: false, error: "The AI Tutor isn't switched on — an admin needs to set GEMINI_API_KEY." };

  const topic = String(input.topic ?? "").trim().slice(0, 300);
  const subject = String(input.subject ?? "").trim();
  const difficulty = String(input.difficulty ?? "medium");
  const count = Math.min(10, Math.max(3, Math.round(Number(input.count) || 5)));
  if (!topic) return { ok: false, error: "Enter a topic to practise first." };

  const { questions, error } = await generatePractice(topic, count, subject, difficulty);
  if (error) return { ok: false, error };
  return { ok: true, questions };
}
