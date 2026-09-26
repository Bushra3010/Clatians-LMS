/** Extract an 11-char YouTube video/live id from common URL shapes (or a bare id). */
export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const u = url.trim();
  const m = u.match(
    /(?:youtube\.com\/(?:watch\?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(u)) return u;
  return null;
}
