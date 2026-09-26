"use server";

import { db, newId } from "./db";
import { requireRole } from "./auth";

/**
 * Live-class chat. It works like a YouTube live chat box, but every message
 * is private: a student's questions go only to the class's teacher, and the
 * teacher's reply goes back only to that student. Clients poll these actions
 * while the class is on screen.
 */
export type ClassChatMessage = { id: string; role: "student" | "teacher"; sender: string | null; body: string; createdAt: string };

export type ClassThread = {
  studentId: string;
  studentName: string;
  messages: ClassChatMessage[];
  /** The student spoke last — the teacher hasn't answered yet. */
  awaitingReply: boolean;
};

type ClassRow = { id: string; status: string; course_id: string | null; teacher_id: string | null };

const MAX_LEN = 1000;

async function loadClass(classId: string) {
  return await db.prepare(
    "SELECT id, status, course_id, teacher_id FROM live_classes WHERE id = ?"
  ).get(String(classId ?? "")) as ClassRow | undefined;
}

async function isEnrolled(userId: string, cls: ClassRow): Promise<boolean> {
  if (!cls.course_id) return true; // a class with no batch is open to every student
  return !!(await db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(userId, cls.course_id));
}

type MsgRow = { id: string; student_id: string; sender_role: string; body: string; created_at: string; sender: string | null };

const toMsg = (m: MsgRow): ClassChatMessage => ({
  id: m.id,
  role: m.sender_role === "teacher" ? "teacher" : "student",
  sender: m.sender,
  body: m.body,
  createdAt: m.created_at,
});

// ── Student side ─────────────────────────────────────────────

export async function getMyClassChatAction(classId: string): Promise<{ ok: boolean; status: string; messages: ClassChatMessage[] }> {
  const user = await requireRole(["student"]);
  const cls = await loadClass(classId);
  if (!cls || !(await isEnrolled(user.id, cls))) return { ok: false, status: "", messages: [] };

  const rows = await db.prepare(
    `SELECT m.id, m.student_id, m.sender_role, m.body, m.created_at, u.name AS sender
     FROM class_messages m LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.class_id = ? AND m.student_id = ? ORDER BY m.created_at ASC`
  ).all(cls.id, user.id) as MsgRow[];
  return { ok: true, status: cls.status, messages: rows.map(toMsg) };
}

export async function sendClassQuestionAction(classId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireRole(["student"]);
  const text = String(body ?? "").trim().slice(0, MAX_LEN);
  if (!text) return { ok: false, error: "Type your question first." };
  const cls = await loadClass(classId);
  if (!cls || !(await isEnrolled(user.id, cls))) return { ok: false, error: "You're not in this class." };
  if (cls.status !== "live") return { ok: false, error: "Chat opens when the class is live." };

  await db.prepare(
    "INSERT INTO class_messages (id, class_id, student_id, sender_id, sender_role, body) VALUES (?, ?, ?, ?, 'student', ?)"
  ).run(newId(), cls.id, user.id, user.id, text);
  // Asking a question in a live class is as good as being present.
  await db.prepare(
    "INSERT INTO class_attendance (class_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING"
  ).run(cls.id, user.id);
  return { ok: true };
}

// ── Teacher side ─────────────────────────────────────────────

async function assertTeacherOf(classId: string) {
  const user = await requireRole(["teacher", "admin"]);
  const cls = await loadClass(classId);
  if (!cls) return null;
  if (user.role !== "admin" && cls.teacher_id !== user.id) return null;
  return { user, cls };
}

export async function getClassInboxAction(classId: string): Promise<{ ok: boolean; status: string; attendees: number; threads: ClassThread[] }> {
  const ctx = await assertTeacherOf(classId);
  if (!ctx) return { ok: false, status: "", attendees: 0, threads: [] };

  const rows = await db.prepare(
    `SELECT m.id, m.student_id, m.sender_role, m.body, m.created_at, u.name AS sender
     FROM class_messages m LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.class_id = ? ORDER BY m.created_at ASC`
  ).all(ctx.cls.id) as MsgRow[];
  const names = await db.prepare(
    `SELECT DISTINCT u.id, u.name FROM class_messages m JOIN users u ON u.id = m.student_id WHERE m.class_id = ?`
  ).all(ctx.cls.id) as { id: string; name: string }[];
  const att = await db.prepare("SELECT COUNT(*) AS n FROM class_attendance WHERE class_id = ?").get(ctx.cls.id) as { n: number };

  const byStudent = new Map<string, ClassChatMessage[]>();
  for (const r of rows) {
    const list = byStudent.get(r.student_id) ?? [];
    list.push(toMsg(r));
    byStudent.set(r.student_id, list);
  }
  const threads: ClassThread[] = [...byStudent.entries()].map(([studentId, messages]) => ({
    studentId,
    studentName: names.find((n) => n.id === studentId)?.name ?? "Student",
    messages,
    awaitingReply: messages[messages.length - 1]?.role === "student",
  }));
  // Unanswered first, then the most recently active.
  threads.sort((a, b) =>
    Number(b.awaitingReply) - Number(a.awaitingReply) ||
    (b.messages[b.messages.length - 1]?.createdAt ?? "").localeCompare(a.messages[a.messages.length - 1]?.createdAt ?? ""));

  return { ok: true, status: ctx.cls.status, attendees: att.n, threads };
}

export async function replyClassQuestionAction(classId: string, studentId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const ctx = await assertTeacherOf(classId);
  if (!ctx) return { ok: false, error: "Not your class." };
  const text = String(body ?? "").trim().slice(0, MAX_LEN);
  if (!text) return { ok: false, error: "Type a reply first." };
  // Only reply into a thread the student actually opened.
  const thread = await db.prepare("SELECT 1 FROM class_messages WHERE class_id = ? AND student_id = ? LIMIT 1").get(ctx.cls.id, studentId);
  if (!thread) return { ok: false, error: "No such question." };

  await db.prepare(
    "INSERT INTO class_messages (id, class_id, student_id, sender_id, sender_role, body) VALUES (?, ?, ?, ?, 'teacher', ?)"
  ).run(newId(), ctx.cls.id, studentId, ctx.user.id, text);
  return { ok: true };
}
