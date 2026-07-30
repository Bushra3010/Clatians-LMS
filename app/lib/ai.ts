import "server-only";
import { GoogleGenAI, Type } from "@google/genai";

// ────────────────────────────────────────────────────────────
// Gemini client — reads GEMINI_API_KEY (or GOOGLE_API_KEY) from the
// environment. Set it in .env.local (dev) and in Vercel project env vars (prod).
// ────────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __genai: GoogleGenAI | undefined;
}
const MODEL = "gemini-flash-latest";
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const client: GoogleGenAI = global.__genai ?? new GoogleGenAI({ apiKey });
global.__genai = client;

/** True only when an API key is configured, so the UI can degrade gracefully. */
export function aiConfigured(): boolean {
  return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
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
 */
export async function runTutor(history: ChatMsg[], role: Role): Promise<string> {
  const res = await client.models.generateContent({
    model: MODEL,
    config: {
      systemInstruction: tutorSystem(role),
      maxOutputTokens: 4096,
      temperature: 0.6,
    },
    // Gemini uses "model" for the assistant role.
    contents: history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });

  const text = res.text?.trim();
  if (text) return text;

  // Empty text usually means a safety block or an empty candidate.
  const reason = res.candidates?.[0]?.finishReason;
  if (reason === "SAFETY" || res.promptFeedback?.blockReason) {
    return "I can't help with that particular request, but I'm happy to help with anything CLAT-related — legal reasoning, current affairs, English, logical reasoning, or quant.";
  }
  return "…";
}

export type GeneratedMCQ = {
  subject: string;
  text: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: "a" | "b" | "c" | "d";
};

export type GenerateResult = { questions: GeneratedMCQ[]; error?: string };

/** Turn a raw Gemini/SDK error into a short, teacher-friendly message. */
function friendlyAiError(err: unknown): string {
  const status = (err as { status?: number })?.status;
  const msg = String((err as { message?: string })?.message ?? err ?? "");
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(msg)) {
    return "Daily AI limit reached — the free Gemini tier allows 20 generations per day. Enable billing on the Google AI project, or try again tomorrow.";
  }
  if (status === 401 || status === 403 || /API key|permission|unauthenticated/i.test(msg)) {
    return "The AI key was rejected. An admin needs to check GEMINI_API_KEY.";
  }
  if (status === 503 || /overloaded|unavailable/i.test(msg)) {
    return "The AI service is busy right now — please try again in a moment.";
  }
  return "Couldn't generate questions right now — please try again in a moment.";
}

/**
 * Generate CLAT-pattern MCQs on a topic as structured JSON. Returns
 * { questions, error? } — `error` is a friendly message when generation failed.
 */
export async function generateQuestions(
  topic: string,
  count: number,
  subject: string,
  difficulty: string
): Promise<GenerateResult> {
  const sub = subject.trim() || "mixed CLAT sections";
  const prompt = `Create ${count} original CLAT UG multiple-choice questions on: "${topic}".
Section: ${sub}. Difficulty: ${difficulty}.
Rules:
- Match the real CLAT UG exam style. For Legal Reasoning, embed a clear PRINCIPLE and FACTS in the question text, and make the answer follow from applying the principle to the facts.
- Exactly four options and exactly one correct answer per question.
- Options must be plausible; avoid "All/None of the above".
- Keep each question self-contained and unambiguous.`;

  try {
    const res = await client.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction:
          "You are a senior CLAT question setter. You produce accurate, exam-realistic MCQs with a single defensible correct answer.",
        maxOutputTokens: 8192,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              text: { type: Type.STRING },
              a: { type: Type.STRING },
              b: { type: Type.STRING },
              c: { type: Type.STRING },
              d: { type: Type.STRING },
              correct: { type: Type.STRING, enum: ["a", "b", "c", "d"] },
            },
            required: ["subject", "text", "a", "b", "c", "d", "correct"],
            propertyOrdering: ["subject", "text", "a", "b", "c", "d", "correct"],
          },
        },
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = res.text?.trim();
    if (!raw) return { questions: [], error: friendlyAiError(res.candidates?.[0]?.finishReason ?? "empty") };
    const parsed = JSON.parse(raw) as GeneratedMCQ[];
    const questions = parsed
      .filter((q) => q && q.text && q.a && q.b && q.c && q.d && ["a", "b", "c", "d"].includes(q.correct))
      .slice(0, count)
      .map((q) => ({
        subject: (q.subject || sub).slice(0, 80),
        text: q.text.trim(),
        a: q.a.trim(),
        b: q.b.trim(),
        c: q.c.trim(),
        d: q.d.trim(),
        correct: q.correct,
      }));
    if (questions.length === 0) return { questions, error: "The AI returned no usable questions — try rephrasing the topic." };
    return { questions };
  } catch (err) {
    console.error("generateQuestions error:", err);
    return { questions: [], error: friendlyAiError(err) };
  }
}
