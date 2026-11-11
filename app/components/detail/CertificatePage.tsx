"use client";

import { fmtIST } from "../../lib/dates";
import { AppIcon } from "../AppIcon";
import { ScreenHeader, IconTile, EmptyState, Pill, card, primaryBtn, gradient, page, body } from "../ui/kit";

export type CertificateItem = {
  courseId: string;
  course: string;
  total: number;
  done: number;
  eligible: boolean;
  completedAt: string | null;
  certNo: string;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

// Line-art marks for the printed certificate (the app never prints emoji).
const svg = (size: number, paths: string) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#0847c7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
const scalePaths = `<path d="M12 3v18"/><path d="M7 21h10"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0z"/><path d="m19 7-3 7a3 3 0 0 0 6 0z"/>`;
const gradPaths = `<path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>`;

const fmtDate = (iso: string | null) =>
  iso ? fmtIST(iso, { day: "numeric", month: "long", year: "numeric" }) : "";

export default function CertificatePage({ onBack, certificates, studentName }: { onBack: () => void; certificates: CertificateItem[]; studentName: string }) {

  // Open a clean, print-ready certificate in a new window (also serves as Save-as-PDF).
  function printCertificate(c: CertificateItem) {
    const w = window.open("", "_blank", "width=1000,height=760");
    if (!w) { alert("Please allow pop-ups to download your certificate."); return; }
    const dateLabel = fmtDate(c.completedAt) || fmtDate(new Date().toISOString());
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Certificate — ${esc(c.course)}</title>
<style>
  *{box-sizing:border-box} @page{size:A4 landscape;margin:0}
  body{font-family:Georgia,'Times New Roman',serif;color:#0f1729;margin:0;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .sheet{width:1000px;max-width:96vw;padding:14px;background:linear-gradient(135deg,#0847c7,#0b5cff)}
  .inner{background:#ffffff;border:3px double #93C5FD;padding:52px 64px;text-align:center;position:relative}
  .crest{font-size:44px;line-height:1}
  .brand{font-size:24px;font-weight:700;color:#0847c7;letter-spacing:.14em;text-transform:uppercase;margin-top:8px}
  .brand small{display:block;font-size:11px;letter-spacing:.3em;color:#5b6478;margin-top:4px}
  h1{font-size:40px;font-weight:400;margin:30px 0 6px;color:#0847c7;letter-spacing:.06em}
  .sub{font-size:13px;color:#5b6478;letter-spacing:.2em;text-transform:uppercase}
  .certify{margin-top:34px;font-size:15px;color:#374151}
  .name{font-size:34px;color:#0f1729;margin:12px 0;font-style:italic;border-bottom:2px solid #93C5FD;display:inline-block;padding:0 34px 8px}
  .course{font-size:20px;font-weight:700;color:#0847c7;margin-top:14px}
  .meta{display:flex;justify-content:space-between;align-items:flex-end;margin-top:58px;font-size:12px;color:#374151}
  .sig{border-top:1.5px solid #93C5FD;padding-top:8px;min-width:190px}
  .certno{font-family:ui-monospace,monospace;letter-spacing:.05em}
  .seal{position:absolute;right:56px;top:46px;width:92px;height:92px;border-radius:50%;border:3px solid #93C5FD;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#0847c7;font-size:10px;letter-spacing:.1em;transform:rotate(8deg)}
  .seal svg{margin-bottom:2px}
  @media print{body{min-height:0}.sheet{max-width:none}}
</style></head><body>
<div class="sheet"><div class="inner">
  <div class="seal">${svg(26, scalePaths)}VERIFIED<span style="font-size:9px">${esc(c.certNo.slice(-6))}</span></div>
  <div class="crest">${svg(48, gradPaths)}</div>
  <div class="brand">CLATians<small>Learn · Practice · Achieve</small></div>
  <h1>Certificate of Completion</h1>
  <div class="sub">CLAT Coaching &amp; Test Preparation</div>
  <div class="certify">This is to certify that</div>
  <div class="name">${esc(studentName)}</div>
  <div class="certify">has successfully completed all study material of the course</div>
  <div class="course">${esc(c.course)}</div>
  <div class="meta">
    <div class="sig">Date of completion<br><b>${esc(dateLabel)}</b></div>
    <div class="certno">Certificate No.<br><b>${esc(c.certNo)}</b></div>
    <div class="sig">CLATians Academy<br><b>Programme Director</b></div>
  </div>
</div></div>
<script>window.onload=function(){setTimeout(function(){window.print()},200)}<\/script></body></html>`;
    w.document.write(html);
    w.document.close();
  }

  return (
    <div style={page}>
      <ScreenHeader title="Certificates" onBack={onBack} />

      <div style={body}>
        <div style={{ background: gradient, borderRadius: 20, padding: 18, color: "white", boxShadow: "0 8px 24px rgba(11,92,255,0.22)", display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 48, height: 48, borderRadius: 15, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="graduation" size={24} color="white" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Course Certificates</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
              Finish 100% of a course&apos;s study material to unlock its completion certificate.
            </p>
          </div>
        </div>

        {certificates.length === 0 && (
          <EmptyState icon="award" title="Enrol in a batch to start working towards a certificate." />
        )}
        {certificates.map((c) => {
          const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
          return (
            <div key={c.courseId} style={{ ...card, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <IconTile icon="award" tone={c.eligible ? "green" : "blue"} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{c.course}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--ink-soft)" }}>
                    {c.total === 0 ? "No study material yet" : `${c.done}/${c.total} items completed`}
                  </p>
                </div>
                {c.eligible
                  ? <Pill tone="green"><AppIcon name="check" size={11} strokeWidth={3} />Earned</Pill>
                  : <Pill tone="gold">In progress</Pill>}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 12, height: 8, borderRadius: 6, background: "var(--blue-tint)", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: c.eligible ? "linear-gradient(90deg,var(--success-text),var(--green-500))" : gradient, transition: "width .3s" }} />
              </div>

              <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                  {c.eligible ? `Completed ${fmtDate(c.completedAt)}` : `${pct}% done`}
                </span>
                {c.eligible ? (
                  <button onClick={() => printCertificate(c)} style={{ ...primaryBtn, padding: "9px 14px", fontSize: 12.5, borderRadius: 12 }}>
                    <AppIcon name="download" size={15} color="white" />Download Certificate
                  </button>
                ) : (
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--blue)" }}>Keep going!</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
