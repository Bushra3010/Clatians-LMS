// ─────────────────────────────────────────────────────────────
// Free Resources starter material — the free video lectures and
// free (open-to-all) live classes the app ships with, one per
// CLAT section so every subject has something in it on day one.
//
// Same rule as the rest of the starter library: seeded once, never
// overwritten, so an admin's edits always win. The video links are
// PLACEHOLDERS — replace each one from Teacher ▸ My Content (or
// Admin ▸ Content) with the real CLATians lecture for that section.
// ─────────────────────────────────────────────────────────────

export type SeedFreeVideo = { title: string; subject: string; url: string };
export type SeedFreeClass = {
  title: string;
  subject: string;
  /** Days from the seed run. Negative = already finished, so it needs a recording. */
  inDays: number;
  durationMin: number;
  recordingUrl?: string;
  notes?: string;
};

/** Stand-in link until real lectures are uploaded; the demo data uses it too. */
const PLACEHOLDER = "https://youtu.be/jNQXAC9IVRw";

export const SEED_FREE_VIDEOS: SeedFreeVideo[] = [
  { title: "English Language: cracking the CLAT passage in 6 minutes", subject: "English Language", url: PLACEHOLDER },
  { title: "Current Affairs & GK: building a daily 30-minute routine", subject: "Current Affairs & GK", url: PLACEHOLDER },
  { title: "Legal Reasoning: principle-and-facts, worked end to end", subject: "Legal Reasoning", url: PLACEHOLDER },
  { title: "Logical Reasoning: assumptions, inferences and traps", subject: "Logical Reasoning", url: PLACEHOLDER },
  { title: "Quantitative Techniques: percentages and ratios, fast", subject: "Quantitative Techniques", url: PLACEHOLDER },
];

export const SEED_FREE_CLASSES: SeedFreeClass[] = [
  { title: "Free Masterclass: reading comprehension under the clock", subject: "English Language", inDays: 2, durationMin: 60, notes: "Open to every CLATians student — no batch needed." },
  { title: "Free Masterclass: the month's current affairs, in one hour", subject: "Current Affairs & GK", inDays: 4, durationMin: 60, notes: "Bring your notes from the daily digest." },
  { title: "Free Masterclass: legal reasoning from first principles", subject: "Legal Reasoning", inDays: 6, durationMin: 75, notes: "We solve a full principle-and-facts set together." },
  { title: "Free Masterclass: logical reasoning puzzles demystified", subject: "Logical Reasoning", inDays: 9, durationMin: 60 },
  { title: "Free Masterclass: quant shortcuts that save ten minutes", subject: "Quantitative Techniques", inDays: 11, durationMin: 60 },
  { title: "Free Masterclass: how to read the CLAT paper (recording)", subject: "General & Exam Strategy", inDays: -6, durationMin: 70, recordingUrl: PLACEHOLDER, notes: "Full recording of the opening session." },
];
