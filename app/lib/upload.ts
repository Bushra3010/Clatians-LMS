import "server-only";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

function safeExt(name: string): string {
  const ext = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext && ext.length <= 6 ? ext : "";
}

/**
 * Save an uploaded file and return its public URL.
 *
 * Two backends, chosen automatically:
 *  • Vercel Blob — used whenever BLOB_READ_WRITE_TOKEN is set (the token is
 *    added automatically once you create a Blob store in the Vercel dashboard).
 *    This is what makes uploads work on Vercel, whose filesystem is read-only.
 *  • Local disk (/public/uploads) — the dev / self-hosted fallback.
 *
 * To use a different CDN (S3, Cloudinary, …) swap this one function; nothing
 * else in the app needs to change.
 */
export async function saveUpload(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("File too large (max 50 MB).");

  const filename = randomBytes(10).toString("hex") + safeExt(file.name);

  // ── Vercel Blob (production / serverless) ──
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const { url } = await put(`uploads/${filename}`, file, { access: "public" });
    return url;
  }

  // ── Local disk (dev / self-hosted) ──
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
