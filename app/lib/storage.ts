import "server-only";
import { randomBytes } from "node:crypto";
import path from "node:path";

/**
 * Supabase Storage — where uploaded files live in production.
 *
 * Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only). Files go in
 * one public bucket, so a stored file's URL can be handed straight to students.
 *
 * Big files never pass through our server: the browser asks for a signed
 * upload URL (signUpload) and PUTs the file to Supabase directly. That keeps
 * uploads working on serverless hosts, whose request bodies are capped at a
 * few MB — far below a lecture PDF or video.
 */

export const BUCKET = "uploads";
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB — Supabase's free-plan per-file cap

const baseUrl = () => process.env.SUPABASE_URL?.trim().replace(/\/+$/, "") || "";
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export const storageConfigured = () => !!(baseUrl() && serviceKey());

const headers = (extra: Record<string, string> = {}) => ({
  Authorization: `Bearer ${serviceKey()}`,
  apikey: serviceKey(),
  ...extra,
});

/** Public URL of a stored object. */
export const publicUrl = (objectPath: string) => `${baseUrl()}/storage/v1/object/public/${BUCKET}/${objectPath}`;

/** True when a URL points into our bucket — used to trust client-reported URLs. */
export const isOurFileUrl = (url: string) => storageConfigured() && url.startsWith(publicUrl(""));

/** Only letters, digits, dot, dash in stored names; keep a short extension. */
export function objectPathFor(fileName: string, folder = "content"): string {
  const ext = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, "");
  const safeExt = ext && ext.length <= 6 ? ext : "";
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  return `${folder}/${month}/${randomBytes(10).toString("hex")}${safeExt}`;
}

let bucketReady = false;

/** Create the public bucket on first use; "already exists" counts as success. */
async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  const res = await fetch(`${baseUrl()}/storage/v1/bucket`, {
    method: "POST",
    headers: headers({ "content-type": "application/json" }),
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_UPLOAD_BYTES }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (!/already exists|Duplicate/i.test(text)) throw new Error(`Storage bucket setup failed: ${text.slice(0, 200)}`);
  }
  bucketReady = true;
}

/** A one-time URL the browser can PUT a file to, plus the file's final public URL. */
export async function signUpload(objectPath: string): Promise<{ uploadUrl: string; publicUrl: string }> {
  await ensureBucket();
  const res = await fetch(`${baseUrl()}/storage/v1/object/upload/sign/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: headers({ "content-type": "application/json" }),
    body: "{}",
  });
  if (!res.ok) throw new Error(`Could not start the upload: ${(await res.text()).slice(0, 200)}`);
  const { url } = await res.json() as { url: string };
  return { uploadUrl: `${baseUrl()}/storage/v1${url}`, publicUrl: publicUrl(objectPath) };
}

/** Server-side upload, for small files that already reached the server. */
export async function uploadObject(objectPath: string, data: Blob): Promise<string> {
  await ensureBucket();
  const res = await fetch(`${baseUrl()}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: headers({ "content-type": data.type || "application/octet-stream" }),
    body: data,
  });
  if (!res.ok) throw new Error(`Upload failed: ${(await res.text()).slice(0, 200)}`);
  return publicUrl(objectPath);
}
