"use server";

import { requireRole } from "./auth";
import { storageConfigured, objectPathFor, signUpload, MAX_UPLOAD_BYTES } from "./storage";

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
