"use server";

import { requireRole } from "./auth";
import { storageConfigured, objectPathFor, signUpload, MAX_UPLOAD_BYTES } from "./storage";

/** What a student may attach to a doubt: a photo of the question, or a PDF. */
const DOUBT_EXT = /\.(pdf|png|jpe?g|webp)$/i;
const DOUBT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/** Kinds of file faculty may upload: documents, slides, images, video, audio. */
const ALLOWED_EXT = /\.(pdf|docx?|pptx?|xlsx?|txt|png|jpe?g|webp|gif|mp4|webm|mov|m4v|mp3|m4a)$/i;

export type UploadTicket =
  | { ok: true; direct: true; uploadUrl: string; publicUrl: string }
  /** Storage isn't configured (local dev) — post the file with the form instead. */
  | { ok: true; direct: false }
  | { ok: false; error: string };

/**
 * Step 1 of a direct upload: faculty ask for a signed URL, then the browser
 * PUTs the file straight to Supabase Storage and submits only the resulting
 * public URL with the form.
 */
export async function requestUploadAction(fileName: string, size: number): Promise<UploadTicket> {
  await requireRole(["teacher", "admin"]);
  const name = String(fileName ?? "");
  if (!ALLOWED_EXT.test(name)) return { ok: false, error: "This file type isn't allowed. Upload a PDF, document, slides, image, audio or video." };
  if (!(size > 0)) return { ok: false, error: "The file is empty." };
  if (size > MAX_UPLOAD_BYTES) return { ok: false, error: "File too large — max 50 MB. For longer videos, upload to YouTube and paste the link." };
  if (!storageConfigured()) return { ok: true, direct: false };

  try {
    const { uploadUrl, publicUrl } = await signUpload(objectPathFor(name));
    return { ok: true, direct: true, uploadUrl, publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not start the upload." };
  }
}

/**
 * A student's doubt attachment: same direct-to-storage upload as faculty files,
 * limited to images and PDFs under 10 MB, kept in their own folder.
 */
export async function requestDoubtUploadAction(fileName: string, size: number): Promise<UploadTicket> {
  await requireRole(["student"]);
  const name = String(fileName ?? "");
  if (!DOUBT_EXT.test(name)) return { ok: false, error: "Attach a photo (JPG, PNG, WebP) or a PDF." };
  if (!(size > 0)) return { ok: false, error: "The file is empty." };
  if (size > DOUBT_MAX_BYTES) return { ok: false, error: "File too large — max 10 MB." };
  if (!storageConfigured()) return { ok: false, error: "Attachments aren't available right now." };
  try {
    const { uploadUrl, publicUrl } = await signUpload(objectPathFor(name, "doubts"));
    return { ok: true, direct: true, uploadUrl, publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not start the upload." };
  }
}
