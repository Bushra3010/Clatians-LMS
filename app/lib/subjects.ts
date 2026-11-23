// ─────────────────────────────────────────────────────────────
// The five CLAT sections, in the order the paper runs them.
//
// Free Resources is built on these: a student picks a format
// (videos / notes / practice / current affairs / live classes)
// and then a subject, so every list is one section's worth of
// free material. The names match the `subjects` table seeded by
// catalog/sync.ts, so content tagged in the admin panel lines up
// with what the app shows.
// ─────────────────────────────────────────────────────────────

export type SubjectDef = { name: string; slug: string };

export const CLAT_SUBJECTS: SubjectDef[] = [
  { name: "English Language", slug: "english" },
  { name: "Current Affairs & GK", slug: "current-affairs" },
  { name: "Legal Reasoning", slug: "legal-reasoning" },
  { name: "Logical Reasoning", slug: "logical-reasoning" },
  { name: "Quantitative Techniques", slug: "quantitative" },
];

/** Anything that doesn't belong to one section — exam strategy, pattern, planning. */
export const GENERAL_SUBJECT = "General & Exam Strategy";

/**
 * Keyword → subject. Checked in order, so the narrow words come first:
 * "Legal Reasoning" also contains "reasoning", which is why the logical
 * bucket asks for "logic" rather than "reasoning".
 */
const RULES: [string[], string][] = [
  [["legal", "law of tort", "tort", "constitution", "constitutional", "judgment", "judgement", "contract", "ipc", "jurisprudence", "principle and fact", "principle-and-fact", "article "], "Legal Reasoning"],
  [["english", "reading comprehension", " rc ", "vocab", "grammar", "passage", "idiom", "synonym"], "English Language"],
  [["logic", "syllogism", "assumption", "inference", "fallac", "argument", "critical reasoning", "blood relation", "seating"], "Logical Reasoning"],
  [["quant", "math", "percentage", "ratio", "average", "number system", "data interpretation", "formula", "arithmetic", "profit and loss"], "Quantitative Techniques"],
  [["current affairs", "general knowledge", "gk", "polity", "economy", "economic", "news", "awards", "summit", "scheme", "static"], "Current Affairs & GK"],
];

const NAMES = new Set(CLAT_SUBJECTS.map((s) => s.name));

/**
 * The subject a piece of material belongs to.
 *
 * `tagged` is what a teacher picked in the admin panel and always wins. Older
 * rows were saved before content carried a subject, so their title and body are
 * read for one of the exam's own words; nothing matching leaves them in
 * General, which is shown last rather than dropped.
 */
export function resolveSubject(tagged: string | null | undefined, ...text: (string | null | undefined)[]): string {
  const t = (tagged ?? "").trim();
  if (NAMES.has(t) || t === GENERAL_SUBJECT) return t;
  if (t) {
    const mapped = matchSubject(t);
    if (mapped) return mapped;
  }
  for (const s of text) {
    const mapped = matchSubject(s ?? "");
    if (mapped) return mapped;
  }
  return GENERAL_SUBJECT;
}

/** The first CLAT section this text names, or "" when it names none. */
export function matchSubject(text: string): string {
  const s = ` ${(text || "").toLowerCase()} `;
  for (const [words, subject] of RULES) {
    if (words.some((w) => s.includes(w))) return subject;
  }
  return "";
}

/** The five sections, plus General when something landed there. */
export function subjectOrder(used: Iterable<string>): string[] {
  const set = new Set(used);
  const list = CLAT_SUBJECTS.map((s) => s.name);
  return set.has(GENERAL_SUBJECT) ? [...list, GENERAL_SUBJECT] : list;
}
