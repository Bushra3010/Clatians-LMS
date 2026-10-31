"use client";

import { useRef, useState } from "react";
import { requestDoubtUploadAction } from "../lib/upload-actions";
import { AppIcon } from "./AppIcon";

export type Attachment = { url: string; name: string };

const isPdf = (s: string) => /\.pdf($|[?#])/i.test(s);

/**
 * "Attach photo / PDF" for a student's doubt. Uploads straight to storage as
 * soon as a file is picked, then hands the stored URL back via onChange.
 */
export function AttachmentPicker({ value, onChange, disabled }: { value: Attachment | null; onChange: (a: Attachment | null) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState("");

  const pick = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError("");
    const ticket = await requestDoubtUploadAction(file.name, file.size);
    if (!ticket.ok) { setError(ticket.error); return; }
    if (!ticket.direct) { setError("Attachments aren't available right now."); return; }
    setPct(0);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", ticket.uploadUrl);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      setPct(null);
      if (xhr.status >= 200 && xhr.status < 300) onChange({ url: ticket.publicUrl, name: file.name });
      else setError(`Upload failed (${xhr.status}). Please try again.`);
    };
    xhr.onerror = () => { setPct(null); setError("Network error during upload. Please try again."); };
    xhr.send(file);
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*,.pdf,application/pdf" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />
      {value ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--blue-tint)", borderRadius: 12, padding: "8px 10px" }}>
          {isPdf(value.url) ? (
            <span style={{ width: 40, height: 40, borderRadius: 8, background: "var(--red, #E03131)", color: "white", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>PDF</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0, background: "white" }} />
          )}
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: "var(--ink-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value.name}</span>
          <button type="button" onClick={() => onChange(null)} aria-label="Remove attachment" disabled={disabled} style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="close" size={14} color="var(--text-muted)" strokeWidth={2.5} />
          </button>
        </div>
      ) : pct !== null ? (
        <div style={{ background: "var(--app-bg)", borderRadius: 12, padding: "9px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}><span>Uploading…</span><span>{pct}%</span></div>
          <div style={{ marginTop: 5, height: 4, borderRadius: 4, background: "white", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: "var(--blue)" }} /></div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} style={{ display: "flex", alignItems: "center", gap: 7, background: "white", border: "1.5px dashed var(--border)", borderRadius: 12, padding: "9px 12px", width: "100%", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>
          <AppIcon name="paperclip" size={16} color="var(--blue)" />
          Attach photo or PDF
          <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, color: "var(--text-disabled)" }}>optional · max 10 MB</span>
        </button>
      )}
      {error && <p style={{ margin: "6px 2px 0", fontSize: 12, color: "var(--error-text)" }}>{error}</p>}
    </div>
  );
}

/** A doubt's attachment as shown in its card: image thumbnail or a PDF chip; both open full size. */
export function AttachmentPreview({ url }: { url: string }) {
  if (!url) return null;
  const pdf = isPdf(url);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, textDecoration: "none", background: "var(--app-bg)", borderRadius: 10, padding: 6, maxWidth: "100%" }}>
      {pdf ? (
        <span style={{ width: 34, height: 34, borderRadius: 7, background: "var(--red, #E03131)", color: "white", fontSize: 9.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>PDF</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Attached photo" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", background: "white" }} />
      )}
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)", paddingRight: 6, display: "flex", alignItems: "center", gap: 4 }}>
        <AppIcon name={pdf ? "file" : "image"} size={13} color="var(--blue)" />{pdf ? "Attached PDF" : "Attached photo"}
      </span>
    </a>
  );
}
