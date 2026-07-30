import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// ────────────────────────────────────────────────────────────
// Claude client — reads ANTHROPIC_API_KEY from the environment.
// Set it in .env.local (dev) and in Vercel project env vars (prod).
// ────────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __anthropic: Anthropic | undefined;
}
const MODEL = "claude-opus-5";
const client: Anthropic = global.__anthropic ?? new Anthropic();
global.__anthropic = client;

/** True only when an API key is configured, so the UI can degrade gracefully. */
export function aiConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export type ChatMsg = { role: "user" | "assistant"; content: string };
export type Role = "student" | "teacher" | "admin";

function tutorSystem(role: Role): string {
  const audience =
    role === "student"
      ? `You are helping a CLAT aspirant (a student). Explain patiently and build intuition. When they share a Legal Reasoning question, DON'T just give the letter — walk through the method: restate the PRINCIPLE, extract the relevant FACTS, apply the principle to the facts (using only what the principle says, never outside legal knowledge), then state the answer. For English/Logical/Quant, teach the technique, not just the result.`
      : `You are assisting a CLAT faculty member (teacher/admin). In addition to answering questions, help them CREATE exam content when asked: mock MCQs (with 4 options, the correct answer, and a one-line explanation each), legal-reasoning passages with principle+facts+question sets, current-affairs notes, and revision material. Match the real CLAT UG pattern and difficulty.`;
  return `You are "CLAT AI Tutor", an expert mentor for India's Common Law Admission Test (CLAT UG). You are deeply versed in the five CLAT sections — English Language, Current Affairs & General Knowledge, Legal Reasoning, Logical Reasoning, and Quantitative Techniques — the NLU ecosystem, the Constitution of India, landmark judgments, and the passage-based question format used since 2020.

${audience}

Ground rules:
- Be accurate and exam-focused. If unsure about a fast-changing fact (a very recent current-affairs item, a live cut-off), say so rather than inventing it.
- Legal Reasoning is principle-application: apply the given principle to the given facts, not your own knowledge of the actual law, unless asked about the real law.
- Keep answers tight and well-structured. Use short headings or numbered steps when it aids clarity. Plain text and simple Markdown only — no LaTeX.
- Encourage good habits (daily reading, timed practice, honest analysis) briefly, without lecturing.`;
}

/**
 * Run one tutor turn. `history` is the full conversation (oldest first),
 * ending with the latest user message. Returns the assistant's reply text.
 * Uses adaptive thinking at low effort for a responsive, still-strong tutor.
 */
export async function runTutor(history: ChatMsg[], role: Role): Promise<string> {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    output_config: { effort: "low" },
    system: tutorSystem(role),
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  if (res.stop_reason === "refusal") {
    return "I can't help with that particular request, but I'm happy to help with anything CLAT-related — legal reasoning, current affairs, English, logical reasoning, or quant.";
  }
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return text || "…";
}
