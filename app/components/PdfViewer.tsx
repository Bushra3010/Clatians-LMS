"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

export const isPdfUrl = (s: string) => /\.pdf($|[?#])/i.test((s || "").trim());

/**
 * Renders a PDF inline with pdf.js, one page at a time: swipe left/right (or
 * use the arrows) to turn pages. Phones can't show a PDF in an <iframe>
 * (Android Chrome just offers a download), so pages are drawn onto canvases
 * instead — the same on every device. A page paints when it is next to the
 * one on screen. Give it `key={url}` so a new file starts from a clean slate.
 */
export default function PdfViewer({ url, title, allowDownload = true }: {
  url: string; title?: string;
  /** false: view-only — no open/download link, and no long-press or right-click menu on the pages. */
  allowDownload?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState(false);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const goTo = (n: number) => {
    const el = scrollRef.current;
    if (!el || !doc) return;
    const target = Math.min(Math.max(n, 1), doc.numPages);
    el.scrollTo({ left: (target - 1) * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;
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
    <div onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()} style={allowDownload ? undefined : { userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>
      <div ref={boxRef}>
        {error ? (
          <p style={{ margin: 0, padding: "22px 16px", background: "white", borderRadius: 14, textAlign: "center", fontSize: 13, color: "var(--text-secondary)" }}>
            {allowDownload ? <>Couldn&apos;t show this PDF here. Use the button below to open it.</> : <>Couldn&apos;t show this PDF here. Please try again in a moment.</>}
          </p>
        ) : !doc ? (
          <div style={{ height: 320, background: "white", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--text-disabled)" }}>
            Loading notes…
          </div>
        ) : width > 0 && (
          <>
            <div
              ref={scrollRef}
              onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)) + 1)}
              style={{ display: "flex", alignItems: "flex-start", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", borderRadius: 10 }}
            >
              {Array.from({ length: doc.numPages }, (_, i) => (
                <div key={i} style={{ flex: "0 0 100%", scrollSnapAlign: "start", scrollSnapStop: "always" }}>
                  <PdfPage doc={doc} pageNo={i + 1} width={width} near={Math.abs(i + 1 - page) <= 1} />
                </div>
              ))}
            </div>
            {doc.numPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 10 }}>
                <button onClick={() => goTo(page - 1)} disabled={page <= 1} aria-label="Previous page" style={pageBtn(page <= 1)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span style={{ flex: 1, textAlign: "center" }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "var(--ink-primary)" }}>Page {page} of {doc.numPages}</span>
                  <span style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 5 }}>
                    {Array.from({ length: Math.min(doc.numPages, 12) }, (_, i) => (
                      <span key={i} style={{ width: i + 1 === page ? 16 : 6, height: 6, borderRadius: 3, background: i + 1 === page ? "var(--blue)" : "var(--line)", transition: "width 0.2s" }} />
                    ))}
                  </span>
                </span>
                <button onClick={() => goTo(page + 1)} disabled={page >= doc.numPages} aria-label="Next page" style={pageBtn(page >= doc.numPages)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {allowDownload && <a
        href={url.trim()}
        target="_blank"
        rel="noreferrer"
        style={{ display: "block", marginTop: 10, textAlign: "center", textDecoration: "none", background: "white", border: "1px solid var(--gold-100)", color: "var(--ink-primary)", borderRadius: 12, padding: "10px", fontSize: 12.5, fontWeight: 700 }}
      >
        Open / download {title ? `“${title}”` : "PDF"}
      </a>}
    </div>
  );
}

const pageBtn = (off: boolean): React.CSSProperties => ({
  width: 40, height: 40, borderRadius: "50%", flexShrink: 0, cursor: off ? "default" : "pointer",
  border: "1.5px solid var(--line)", background: "white", color: off ? "var(--text-disabled)" : "var(--blue)",
  display: "flex", alignItems: "center", justifyContent: "center", opacity: off ? 0.5 : 1,
});

function PdfPage({ doc, pageNo, width, near }: { doc: PDFDocumentProxy; pageNo: number; width: number; near: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ratio, setRatio] = useState(1.414); // A4 until the real page size is known
  // Paint once the page is on screen or next to it; keep it painted after that.
  const [visible, setVisible] = useState(near);
  if (near && !visible) setVisible(true);

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
