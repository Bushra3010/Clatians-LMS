"use client";

import { fmtIST } from "../../lib/dates";

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
  body{font-family:Georgia,'Times New Roman',serif;color:#231911;margin:0;background:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh}
  .sheet{width:1000px;max-width:96vw;padding:14px;background:linear-gradient(135deg,#3D2411,#8A5A08)}
  .inner{background:#FDFBF5;border:3px double #B8935A;padding:52px 64px;text-align:center;position:relative}
  .crest{font-size:44px;line-height:1}
  .brand{font-size:24px;font-weight:700;color:#3D2411;letter-spacing:.14em;text-transform:uppercase;margin-top:8px}
  .brand small{display:block;font-size:11px;letter-spacing:.3em;color:#8A6A45;margin-top:4px}
  h1{font-size:40px;font-weight:400;margin:30px 0 6px;color:#3D2411;letter-spacing:.06em}
  .sub{font-size:13px;color:#8A6A45;letter-spacing:.2em;text-transform:uppercase}
  .certify{margin-top:34px;font-size:15px;color:#6B5842}
  .name{font-size:34px;color:#231911;margin:12px 0;font-style:italic;border-bottom:2px solid #B8935A;display:inline-block;padding:0 34px 8px}
  .course{font-size:20px;font-weight:700;color:#3D2411;margin-top:14px}
  .meta{display:flex;justify-content:space-between;align-items:flex-end;margin-top:58px;font-size:12px;color:#6B5842}
  .sig{border-top:1.5px solid #8A6A45;padding-top:8px;min-width:190px}
  .certno{font-family:ui-monospace,monospace;letter-spacing:.05em}
  .seal{position:absolute;right:56px;top:46px;width:92px;height:92px;border-radius:50%;border:3px solid #B8935A;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#8A5A08;font-size:10px;letter-spacing:.1em;transform:rotate(8deg)}
  .seal b{font-size:22px}
  @media print{body{min-height:0}.sheet{max-width:none}}
</style></head><body>
<div class="sheet"><div class="inner">
  <div class="seal"><b>⚖️</b>VERIFIED<span style="font-size:9px">${esc(c.certNo.slice(-6))}</span></div>
  <div class="crest">🎓</div>
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
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Certificates
      </button>

      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ background: "linear-gradient(135deg,#3D2411,#5C3A00)", borderRadius: 18, padding: "18px", color: "#F7EFE2", boxShadow: "0 6px 20px rgba(61,36,17,0.28)" }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>🎓 Course Certificates</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#D9C6A8", lineHeight: 1.5 }}>
            Finish 100% of a course&apos;s study material to unlock its completion certificate.
          </p>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {certificates.length === 0 && (
          <p style={{ margin: "10px 0", fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>Enrol in a batch to start working towards a certificate.</p>
        )}
        {certificates.map((c) => {
          const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
          return (
            <div key={c.courseId} style={{ background: "white", borderRadius: 14, padding: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1A1A2E" }}>{c.course}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#9CA3AF" }}>
                    {c.total === 0 ? "No study material yet" : `${c.done}/${c.total} items completed`}
                  </p>
                </div>
                <span style={{
                  flexShrink: 0, fontSize: 9.5, fontWeight: 800, padding: "3px 9px", borderRadius: 20,
                  background: c.eligible ? "#DCFCE7" : "#FEF3C7",
                  color: c.eligible ? "#15803D" : "#92400E",
                }}>{c.eligible ? "✓ Earned" : "In progress"}</span>
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: 10, height: 8, borderRadius: 6, background: "#F0EADD", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: c.eligible ? "linear-gradient(90deg,#15803D,#22C55E)" : "linear-gradient(90deg,#3D2411,#8A5A08)", transition: "width .3s" }} />
              </div>

              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11.5, color: "#6B7280" }}>
                  {c.eligible ? `Completed ${fmtDate(c.completedAt)}` : `${pct}% done`}
                </span>
                {c.eligible ? (
                  <button onClick={() => printCertificate(c)} style={{ background: "linear-gradient(135deg,#F5A623,#E8930A)", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 3px 10px rgba(245,166,35,0.35)" }}>
                    🎓 Download Certificate
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>Keep going! 💪</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
