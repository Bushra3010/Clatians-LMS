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
 * Save an uploaded file to /public/uploads and return its public URL.
 *
 * This is LOCAL disk storage — perfect for dev / a single self-hosted server.
 * For production at scale (or serverless), swap this one function to push to
 * S3 / Cloudinary and return the CDN URL; nothing else needs to change.
 */
export async function saveUpload(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("File too large (max 50 MB).");

  mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = randomBytes(10).toString("hex") + safeExt(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
