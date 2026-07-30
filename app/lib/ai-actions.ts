"use server";

import { db, newId } from "./db";
import { requireRole } from "./auth";
import { runTutor, aiConfigured, type ChatMsg, type Role } from "./ai";

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
