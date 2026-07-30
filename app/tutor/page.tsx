import { requireRole } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { aiConfigured } from "@/app/lib/ai";
import AiTutorChat, { type ChatTurn } from "@/app/components/AiTutorChat";

export const dynamic = "force-dynamic";

export default async function TutorPage() {
  const user = await requireRole(["student", "teacher", "admin"]);

  // Resume the most recent conversation.
  const thread = (await db.prepare(
    "SELECT id FROM ai_threads WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
  ).get(user.id)) as { id: string } | undefined;

  let messages: ChatTurn[] = [];
  if (thread) {
    messages = (await db.prepare(
      "SELECT role, content FROM ai_messages WHERE thread_id = ? ORDER BY created_at ASC LIMIT 100"
    ).all(thread.id)) as ChatTurn[];
  }

  return (
    <AiTutorChat
      role={user.role as "student" | "teacher" | "admin"}
      name={user.name}
      backHref={user.role === "student" ? "/" : user.role === "teacher" ? "/teacher" : "/admin"}
      configured={aiConfigured()}
      initialThreadId={thread?.id ?? null}
      initialMessages={messages}
    />
  );
}
