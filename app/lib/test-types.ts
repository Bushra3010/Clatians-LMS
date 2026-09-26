// Shared test vocabulary. This lives outside test-actions.ts because that file
// is "use server" — a server-action module may only export async functions.

export const TEST_TYPES = ["mock", "sectional", "pyq", "practice"] as const;
export type TestType = (typeof TEST_TYPES)[number];

/** Unknown types fall back to a full mock. */
export const normalizeTestType = (t: string): TestType =>
  (TEST_TYPES as readonly string[]).includes(t) ? (t as TestType) : "mock";

/** A practice paper is a test with no clock — `duration_min = 0` means untimed. */
export const normalizeDuration = (raw: unknown): number => {
  const n = Math.round(Number(raw ?? 60) || 0);
  return n <= 0 ? 0 : Math.max(5, n);
};
