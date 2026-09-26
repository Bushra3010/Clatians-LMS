"use client";

import { useEffect, useRef, useState } from "react";
import { requestUploadAction } from "@/app/lib/upload-actions";

type State =
  | { kind: "idle" }
  | { kind: "uploading"; name: string; pct: number }
  | { kind: "done"; name: string; url: string }
  /** No cloud storage configured — the file rides along with the form post. */
  | { kind: "inline"; name: string }
  | { kind: "error"; message: string };

/**
 * File picker that uploads straight from the browser to Supabase Storage, then
 * submits only the file's URL (as `name`, default `fileUrl`). While an upload is running the
 * surrounding form refuses to submit.
 */
export default function FileUploadField({ accept, hint, name = "fileUrl" }: { accept?: string; hint?: string; name?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = state.kind === "uploading";

  // Block the parent form's submit until the file has finished uploading.
  useEffect(() => {
    const form = wrapRef.current?.closest("form");
    if (!form) return;
    const guard = (e: Event) => {
      if (busy) { e.preventDefault(); alert("Please wait — the file is still uploading."); }
    };
    form.addEventListener("submit", guard);
    return () => form.removeEventListener("submit", guard);
  }, [busy]);

  // Clear the field after the form has been submitted and reset.
  useEffect(() => {
    const form = wrapRef.current?.closest("form");
    if (!form) return;
    const onReset = () => { setState({ kind: "idle" }); if (inputRef.current) inputRef.current.value = ""; };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  const onPick = async (file: File | undefined) => {
    if (!file) { setState({ kind: "idle" }); return; }
    const ticket = await requestUploadAction(file.name, file.size);
    if (!ticket.ok) {
      setState({ kind: "error", message: ticket.error });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (!ticket.direct) { setState({ kind: "inline", name: file.name }); return; }

    setState({ kind: "uploading", name: file.name, pct: 0 });
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", ticket.uploadUrl);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setState({ kind: "uploading", name: file.name, pct: Math.round((e.loaded / e.total) * 100) });
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setState({ kind: "done", name: file.name, url: ticket.publicUrl });
      } else {
        setState({ kind: "error", message: `Upload failed (${xhr.status}). Please try again.` });
      }
      if (inputRef.current) inputRef.current.value = "";
    };
    xhr.onerror = () => setState({ kind: "error", message: "Network error during upload. Please try again." });
    xhr.send(file);
  };

  return (
    <div ref={wrapRef}>
      <input
        ref={inputRef}
        // Only the inline fallback posts the file itself; the direct path posts its URL.
        name={state.kind === "inline" ? "file" : undefined}
        type="file"
        accept={accept}
        disabled={busy}
        onChange={(e) => onPick(e.target.files?.[0])}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gold-600 file:px-4 file:py-2 file:text-white file:text-sm file:font-medium hover:file:bg-gold-700 file:cursor-pointer disabled:opacity-60"
      />
      {state.kind === "done" && <input type="hidden" name={name} value={state.url} />}

      {state.kind === "uploading" && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span className="truncate">Uploading {state.name}…</span>
            <span className="tabular-nums">{state.pct}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-gold-600 transition-all" style={{ width: `${state.pct}%` }} />
          </div>
        </div>
      )}
      {state.kind === "done" && (
        <p className="mt-2 text-xs text-green-700">
          ✓ Uploaded <span className="font-medium">{state.name}</span> ·{" "}
          <a href={state.url} target="_blank" rel="noreferrer" className="underline">preview</a> ·{" "}
          <button type="button" onClick={() => setState({ kind: "idle" })} className="underline text-slate-500">remove</button>
        </p>
      )}
      {state.kind === "inline" && <p className="mt-2 text-xs text-slate-500">{state.name} will be saved when you submit.</p>}
      {state.kind === "error" && <p className="mt-2 text-xs text-red-600">{state.message}</p>}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </div>
  );
}
