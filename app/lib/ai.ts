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
 * ending with the latest user message. `profile`, when given, is a short
 * learner-performance summary the tutor uses to tailor its help. Returns the
 * assistant's reply text.
 */
export async function runTutor(history: ChatMsg[], role: Role, profile?: string | null): Promise<string> {
  const system = profile ? `${tutorSystem(role)}\n\n${profile}` : tutorSystem(role);
  const res = await client.models.generateContent({
    model: MODEL,
    config: {
      systemInstruction: system,
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

export type ExplainResult = { text: string; error?: string };

/**
 * Explain a single reviewed MCQ to a student: why the correct answer is right,
 * why their chosen option was a trap (if wrong), and a quick takeaway.
 */
export async function explainAnswer(q: {
  subject: string;
  text: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: string;
  chosen: string | null;
}): Promise<ExplainResult> {
  const chosenLine = q.chosen
    ? `The student chose option ${q.chosen.toUpperCase()}${q.chosen === q.correct ? " (correct)" : " (incorrect)"}.`
    : "The student did not attempt this question.";

  const prompt = `A CLAT UG aspirant is reviewing this multiple-choice question.
Section: ${q.subject || "CLAT"}
Question: ${q.text}
Options:
A) ${q.a}
B) ${q.b}
C) ${q.c}
D) ${q.d}
Correct answer: ${q.correct.toUpperCase()}
${chosenLine}

Explain in 4–7 short sentences:
1. Why the correct answer is right. For Legal Reasoning, apply the stated PRINCIPLE to the FACTS step by step — use only the principle given, not outside law.
2. If the student picked a wrong option, why that option is a trap and where the reasoning slips. (Skip if they were correct or didn't attempt.)
3. One quick takeaway for tackling questions like this.
Plain text and simple Markdown only — no LaTeX. Be encouraging and concise.`;

  try {
    const res = await client.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction:
          "You are the CLAT AI Tutor — an expert, encouraging mentor. Explain answers clearly, using the principle-application method for Legal Reasoning. Never invent facts.",
        maxOutputTokens: 1024,
        temperature: 0.5,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = res.text?.trim();
    if (text) return { text };
    const reason = res.candidates?.[0]?.finishReason;
    if (reason === "SAFETY" || res.promptFeedback?.blockReason) {
      return { text: "", error: "I couldn't generate an explanation for this one — try the AI Tutor for a hand." };
    }
    return { text: "", error: friendlyAiError("empty") };
  } catch (err) {
    console.error("explainAnswer error:", err);
    return { text: "", error: friendlyAiError(err) };
  }
}

export type CoachStats = {
  testsTaken: number;
  avgPct: number | null;
  bestPct: number | null;
  subjects: { subject: string; correct: number; total: number; pct: number }[];
};

/**
 * Turn a student's mock-test performance into a short, personalised CLAT study
 * plan — naming their strong/weak sections and concrete next actions.
 */
export async function coachStudy(stats: CoachStats): Promise<ExplainResult> {
  const lines = stats.subjects
    .map((s) => `- ${s.subject}: ${s.pct}% (${s.correct}/${s.total} correct)`)
    .join("\n");

  const prompt = `A CLAT UG aspirant's mock-test performance so far:
Tests taken: ${stats.testsTaken}
Average score: ${stats.avgPct ?? "n/a"}%   Best: ${stats.bestPct ?? "n/a"}%
Subject-wise accuracy (on attempted questions):
${lines}

As their CLAT mentor, write a short, motivating study plan:
1. Name their 1–2 strongest and 1–2 weakest sections (by name).
2. For each weak section, give 2 concrete, CLAT-specific actions — what to practise and the common traps to fix. (Legal Reasoning = principle-application drills; English = RC speed & inference; GK & Current Affairs = monthly compendium + editorials; Logical Reasoning = assumptions & parajumbles; Quantitative = DI from passages.)
3. A simple weekly focus split.
Keep it under ~180 words. Use short "## " headings and bullets. Be specific and encouraging — no fluff.`;

  try {
    const res = await client.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction:
          "You are the CLAT AI Tutor — a sharp, encouraging mentor who gives specific, actionable study plans based on a student's real data.",
        maxOutputTokens: 900,
        temperature: 0.6,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = res.text?.trim();
    if (text) return { text };
    return { text: "", error: friendlyAiError(res.candidates?.[0]?.finishReason ?? "empty") };
  } catch (err) {
    console.error("coachStudy error:", err);
    return { text: "", error: friendlyAiError(err) };
  }
}

/**
 * Draft a reply to a student's doubt in a CLAT faculty member's voice. The
 * teacher reviews and edits before sending — this is a first draft, not a
 * final answer.
 */
export async function draftDoubtAnswer(doubt: { subject: string; body: string }): Promise<ExplainResult> {
  const prompt = `A CLAT UG student raised this doubt${doubt.subject ? ` (section: ${doubt.subject})` : ""}:
"${doubt.body}"

Draft a reply a CLAT faculty member could send, in a warm, direct teacher's voice addressed to the student.
- Answer the actual question. For Legal Reasoning use principle-application; for GK & Current Affairs be factual and flag anything that may have since changed; for English/Logical/Quant teach the method, not just the result.
- Concise (under ~150 words), well structured — short steps or bullets where they help.
- Plain text and simple Markdown only — no LaTeX. End with a one-line encouragement.`;

  try {
    const res = await client.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction:
          "You are an experienced CLAT faculty member drafting a reply to a student's doubt. Be accurate, clear, and encouraging. Never invent facts.",
        maxOutputTokens: 800,
        temperature: 0.5,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = res.text?.trim();
    if (text) return { text };
    return { text: "", error: friendlyAiError(res.candidates?.[0]?.finishReason ?? "empty") };
  } catch (err) {
    console.error("draftDoubtAnswer error:", err);
    return { text: "", error: friendlyAiError(err) };
  }
}

export type PracticeMCQ = {
  subject: string;
  text: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: "a" | "b" | "c" | "d";
  explanation: string;
};
export type PracticeResult = { questions: PracticeMCQ[]; error?: string };

/**
 * Generate CLAT MCQs for a student's on-demand self-practice — each with a
 * short explanation so the app can show instant feedback. Returns { questions,
 * error? }.
 */
export async function generatePractice(
  topic: string,
  count: number,
  subject: string,
  difficulty: string
): Promise<PracticeResult> {
  const sub = subject.trim() || "mixed CLAT sections";
  const prompt = `Create ${count} original CLAT UG multiple-choice questions on: "${topic}".
Section: ${sub}. Difficulty: ${difficulty}.
Rules:
- Match real CLAT UG exam style. For Legal Reasoning, embed a clear PRINCIPLE and FACTS in the question text; the answer must follow from applying the principle to the facts.
- Exactly four options and exactly one correct answer per question. Avoid "All/None of the above".
- For each question include a short "explanation" (1–3 sentences) of why the correct option is right.
- Keep each question self-contained and unambiguous.`;

  try {
    const res = await client.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction:
          "You are a senior CLAT question setter. You produce accurate, exam-realistic MCQs with a single defensible correct answer and a clear short explanation.",
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
              explanation: { type: Type.STRING },
            },
            required: ["subject", "text", "a", "b", "c", "d", "correct", "explanation"],
            propertyOrdering: ["subject", "text", "a", "b", "c", "d", "correct", "explanation"],
          },
        },
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = res.text?.trim();
    if (!raw) return { questions: [], error: friendlyAiError(res.candidates?.[0]?.finishReason ?? "empty") };
    const parsed = JSON.parse(raw) as PracticeMCQ[];
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
        explanation: (q.explanation || "").trim(),
      }));
    if (questions.length === 0) return { questions, error: "The AI returned no usable questions — try rephrasing the topic." };
    return { questions };
  } catch (err) {
    console.error("generatePractice error:", err);
    return { questions: [], error: friendlyAiError(err) };
  }
}

export type VocabWord = { word: string; meaning: string; example: string };
export type VocabGenResult = { words: VocabWord[]; error?: string };

/** Generate CLAT English vocabulary flashcards (word, meaning, example). */
export async function generateVocab(theme: string, count: number): Promise<VocabGenResult> {
  const focus = theme.trim()
    ? `Focus on: "${theme.trim()}".`
    : "Mix moderately hard, CLAT-relevant words, including some legal/formal register.";
  const prompt = `Generate ${count} vocabulary words useful for the CLAT UG English section. ${focus}
For each word give: the word, a concise meaning (under 12 words), and one natural example sentence.
Avoid extremely obscure words — prefer words that realistically appear in CLAT reading passages and answer options.`;

  try {
    const res = await client.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction: "You are a CLAT English coach building vocabulary flashcards. Be accurate and natural.",
        maxOutputTokens: 2048,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              meaning: { type: Type.STRING },
              example: { type: Type.STRING },
            },
            required: ["word", "meaning", "example"],
            propertyOrdering: ["word", "meaning", "example"],
          },
        },
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = res.text?.trim();
    if (!raw) return { words: [], error: friendlyAiError(res.candidates?.[0]?.finishReason ?? "empty") };
    const parsed = JSON.parse(raw) as VocabWord[];
    const words = parsed
      .filter((w) => w && w.word && w.meaning)
      .slice(0, count)
      .map((w) => ({ word: w.word.trim().slice(0, 50), meaning: w.meaning.trim(), example: (w.example || "").trim() }));
    if (words.length === 0) return { words, error: "No words were generated — try again." };
    return { words };
  } catch (err) {
    console.error("generateVocab error:", err);
    return { words: [], error: friendlyAiError(err) };
  }
}

export type DigestResult = { title: string; body: string; error?: string };

/**
 * Draft a CLAT-focused current-affairs digest from a teacher-supplied theme or
 * raw notes. The model structures/expands what it's given — it is instructed
 * NOT to fabricate specific dates/case names, since it can't know live news.
 */
export async function generateCurrentAffairs(input: string): Promise<DigestResult> {
  const prompt = `A CLAT faculty member wants a Current Affairs digest for students, based on this topic or set of notes:
"${input}"

Produce a CLAT UG–focused current-affairs digest.
- If the input is raw notes or headlines, organise and expand them. If it's a theme, cover the key points you are confident about.
- For each item: a short "## " heading, then 2–4 sentences on what happened, then a bold "CLAT angle:" line — the legal / constitutional / polity significance and the kind of question it could appear in.
- Cover 3–6 items grouped under the theme.
- IMPORTANT: Do NOT invent specific dates, case names, statistics, or figures you are unsure of. If unsure, stay general and append "(verify)".
Return JSON with a concise "title" and the digest as Markdown in "body".`;

  try {
    const res = await client.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction:
          "You are a CLAT current-affairs editor. You write accurate, exam-focused digests and never fabricate specific facts, dates, or case names.",
        maxOutputTokens: 4096,
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ["title", "body"],
          propertyOrdering: ["title", "body"],
        },
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = res.text?.trim();
    if (!raw) return { title: "", body: "", error: friendlyAiError(res.candidates?.[0]?.finishReason ?? "empty") };
    const parsed = JSON.parse(raw) as { title?: string; body?: string };
    if (!parsed.body?.trim()) return { title: "", body: "", error: "The AI returned an empty digest — try rephrasing the topic." };
    return { title: (parsed.title || "Current Affairs Digest").slice(0, 160), body: parsed.body.trim() };
  } catch (err) {
    console.error("generateCurrentAffairs error:", err);
    return { title: "", body: "", error: friendlyAiError(err) };
  }
}
