// Timezone helpers. The platform serves Indian students, so all times are
// displayed in IST. Timestamps come in two shapes from the DB:
//   • "YYYY-MM-DD HH:MM:SS" (UTC, no T/Z) — Postgres to_char defaults (created_at)
//   • full ISO with T…Z — values we stored via Date.toISOString() (start_at)
// Both represent a true UTC instant; we normalise then format in IST.

const IST = "Asia/Kolkata";

/**
 * Parse a server timestamp robustly. Safari/iOS returns Invalid Date for the
 * space-separated form, so normalise to real ISO first. Client-safe.
 */
export function parseServerDate(s: string): Date {
  if (!s) return new Date(NaN);
  const norm = s.includes("T") ? s : s.replace(" ", "T") + (s.endsWith("Z") ? "" : "Z");
  return new Date(norm);
}

/** Format a stored UTC timestamp in IST (en-IN). Returns "" for bad input. */
export function fmtIST(s: string, opts: Intl.DateTimeFormatOptions): string {
  const d = parseServerDate(s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { ...opts, timeZone: IST });
}

/**
 * Convert an <input type="datetime-local"> value (an IST wall-clock with no
 * timezone) into a true UTC ISO string for storage. India has no DST, so the
 * offset is a fixed +05:30.
 */
export function datetimeLocalToUtcISO(local: string): string {
  const d = new Date(local + "+05:30");
  return isNaN(d.getTime()) ? new Date(local).toISOString() : d.toISOString();
}

/**
 * Convert a stored UTC timestamp back to a "YYYY-MM-DDTHH:MM" IST wall-clock
 * string suitable for a datetime-local input's defaultValue.
 */
export function toDatetimeLocalIST(s: string): string {
  const d = parseServerDate(s);
  if (isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 16);
}
