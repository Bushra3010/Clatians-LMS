"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

export const isPdfUrl = (s: string) => /\.pdf($|[?#])/i.test((s || "").trim());

/**
 * Renders a PDF inline, page by page, with pdf.js. Phones can't show a PDF in
 * an <iframe> (Android Chrome just offers a download), so notes are drawn onto
 * canvases instead — the same on every device. Pages paint as they scroll near.
 */
export default function PdfViewer({ url, title }: { url: string; title?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
    setDoc(null);
    setError(false);
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        if (cancelled) return;
        const t = pdfjs.getDocument({ url: url.trim() });
        task = t;
        const loaded = await t.promise;
        if (!cancelled) setDoc(loaded);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; task?.destroy(); };
  }, [url]);

  // Pages are drawn at the box's width; re-draw when it changes (rotation).
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.round(el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div>
      <div ref={boxRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {error ? (
          <p style={{ margin: 0, padding: "22px 16px", background: "white", borderRadius: 14, textAlign: "center", fontSize: 13, color: "var(--text-secondary)" }}>
            Couldn&apos;t show this PDF here. Use the button below to open it.
          </p>
        ) : !doc ? (
          <div style={{ height: 320, background: "white", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--text-disabled)" }}>
            Loading notes…
          </div>
        ) : width > 0 && (
          Array.from({ length: doc.numPages }, (_, i) => (
            <PdfPage key={i} doc={doc} pageNo={i + 1} width={width} />
          ))
        )}
      </div>
      <a
        href={url.trim()}
        target="_blank"
        rel="noreferrer"
        style={{ display: "block", marginTop: 10, textAlign: "center", textDecoration: "none", background: "white", border: "1px solid var(--gold-100)", color: "var(--ink-primary)", borderRadius: 12, padding: "10px", fontSize: 12.5, fontWeight: 700 }}
      >
        📥 Open / download {title ? `“${title}”` : "PDF"}
      </a>
    </div>
  );
}

function PdfPage({ doc, pageNo, width }: { doc: PDFDocumentProxy; pageNo: number; width: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ratio, setRatio] = useState(1.414); // A4 until the real page size is known
  const [visible, setVisible] = useState(pageNo <= 2);

  // Wait until the page is near the screen before rendering it.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    let task: { cancel: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageNo);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      setRatio(base.height / base.width);
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const viewport = page.getViewport({ scale: (width / base.width) * dpr });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const t = page.render({ canvas, viewport });
      task = t;
      await t.promise.catch(() => {});
    })();
    return () => { cancelled = true; task?.cancel(); };
  }, [doc, pageNo, width, visible]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Page ${pageNo}`}
      style={{ width: "100%", height: width * ratio, display: "block", background: "white", borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
    />
  );
}
