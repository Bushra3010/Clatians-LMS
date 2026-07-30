/**
 * Parse a server timestamp that may be "YYYY-MM-DD HH:MM:SS" (UTC, no T/Z, as
 * produced by our Postgres to_char default) or an already-ISO string.
 *
 * Safari/iOS returns Invalid Date for the space-separated form, so we normalise
 * to real ISO first. Safe to import from client components (no server deps).
 */
export function parseServerDate(s: string): Date {
  if (!s) return new Date(NaN);
  const norm = s.includes("T") ? s : s.replace(" ", "T") + (s.endsWith("Z") ? "" : "Z");
  return new Date(norm);
}
