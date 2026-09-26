import "server-only";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { storageConfigured, objectPathFor, uploadObject, MAX_UPLOAD_BYTES } from "./storage";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function safeExt(name: string): string {
  const ext = path.extname(name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext && ext.length <= 6 ? ext : "";
}

/**
 * Save a file that was posted to the server and return its public URL.
 *
 * Two backends, chosen automatically:
 *  • Supabase Storage — whenever SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
 *    set. This is the production path (serverless hosts have no writable disk).
 *  • Local disk (/public/uploads) — the dev / self-hosted fallback.
 *
 * Large files should not come through here at all: the upload form sends them
 * from the browser straight to Supabase (see upload-actions.ts). This covers
 * forms without JavaScript and local development without Supabase.
 */
export async function saveUpload(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File too large (max 50 MB).");

  if (storageConfigured()) {
    return await uploadObject(objectPathFor(file.name), file);
  }

  // ── Local disk (dev / self-hosted) ──
  const filename = randomBytes(10).toString("hex") + safeExt(file.name);
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
