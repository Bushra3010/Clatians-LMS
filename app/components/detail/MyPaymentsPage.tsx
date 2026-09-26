"use client";

import { fmtIST } from "../../lib/dates";

export type PaymentItem = {
  invoiceNo: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  course: string | null;
};

const gradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const methodLabel: Record<string, string> = {
  upi: "UPI", card: "Card", netbanking: "Net Banking", cash: "Cash", cheque: "Cheque", bank: "Bank transfer",
};

const statusStyle: Record<string, { bg: string; col: string }> = {
  paid: { bg: "var(--success)", col: "var(--success-text)" },
  pending: { bg: "var(--warning)", col: "var(--warning-text)" },
  failed: { bg: "var(--error)", col: "var(--error-text)" },
};

function fmt(iso: string) {
  return fmtIST(iso, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export default function MyPaymentsPage({ onBack, payments, studentName, studentEmail }: { onBack: () => void; payments: PaymentItem[]; studentName: string; studentEmail: string }) {
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  // Open a clean, print-ready invoice in a new window (also serves as Save-as-PDF).
  function printInvoice(p: PaymentItem) {
    const w = window.open("", "_blank", "width=820,height=920");
    if (!w) { alert("Please allow pop-ups to print your invoice."); return; }
    const amt = p.amount > 0 ? inr(p.amount) : "FREE";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(p.invoiceNo)}</title>
<style>
  *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#231911;margin:0;padding:40px;background:#fff}
  .wrap{max-width:640px;margin:0 auto}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid var(--blue-dark);padding-bottom:18px}
  .brand{font-size:22px;font-weight:800;color:var(--blue-dark)}
  .brand span{font-size:12px;font-weight:500;color:var(--blue-dark);display:block;margin-top:2px}
  .inv{text-align:right;font-size:12px;color:#5B7299}
  .inv b{display:block;font-size:16px;color:#1A1A2E}
  .grid{display:flex;justify-content:space-between;margin:24px 0}
  .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#9A8A73;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th{text-align:left;font-size:11px;text-transform:uppercase;color:#9A8A73;border-bottom:1px solid var(--info-border);padding:8px 0}
  td{padding:12px 0;border-bottom:1px solid #F0EADD;font-size:14px}
  .tot{display:flex;justify-content:space-between;margin-top:16px;font-size:18px;font-weight:800}
  .pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;background:var(--success);color:var(--success-text);text-transform:capitalize}
  .foot{margin-top:36px;font-size:11px;color:#9A8A73;border-top:1px solid #E7DCC9;padding-top:14px}
  @media print{body{padding:0}.wrap{max-width:none}}
</style></head><body><div class="wrap">
  <div class="head">
    <div><div class="brand">⚖️ CLATians LMS<span>CLAT Coaching &amp; Test Prep</span></div></div>
    <div class="inv">INVOICE<b>${esc(p.invoiceNo)}</b>${esc(fmt(p.createdAt))}</div>
  </div>
  <div class="grid">
    <div><div class="lbl">Billed to</div><div style="font-weight:700">${esc(studentName)}</div><div style="font-size:12px;color:#6B5842">${esc(studentEmail)}</div></div>
    <div style="text-align:right"><div class="lbl">Status</div><span class="pill">${esc(p.status)}</span></div>
  </div>
  <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody><tr><td>${esc(p.course ?? "Fee payment")}</td><td style="text-align:right">${amt}</td></tr></tbody>
  </table>
  <div class="tot"><span>Total ${esc((methodLabel[p.method] ?? p.method))}</span><span>${amt}</span></div>
  <div class="foot">This is a computer-generated receipt and does not require a signature. Thank you for choosing CLATians LMS.</div>
</div><script>window.onload=function(){setTimeout(function(){window.print()},150)}<\/script></body></html>`;
    w.document.write(html);
    w.document.close();
  }

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Payments &amp; Invoices
      </button>

      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ background: gradient, borderRadius: 18, padding: "18px", color: "white", boxShadow: "0 6px 20px rgba(61,36,17,0.28)" }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>Total paid</p>
          <p style={{ margin: "6px 0 0", fontSize: 34, fontWeight: 900 }}>{inr(totalPaid)}</p>
          <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.78)" }}>{payments.length} transaction{payments.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {payments.length === 0 && (
          <p style={{ margin: "10px 0", fontSize: 13, color: "var(--text-disabled)", textAlign: "center" }}>No payments yet. Enrol in a batch to see your invoices here.</p>
        )}
        {payments.map((p) => {
          const st = statusStyle[p.status] ?? statusStyle.paid;
          return (
            <div key={p.invoiceNo} style={{ background: "white", borderRadius: 16, padding: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{p.course ?? "Fee payment"}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--text-disabled)", fontFamily: "ui-monospace, monospace" }}>{p.invoiceNo}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "var(--ink-primary)" }}>{p.amount > 0 ? inr(p.amount) : "FREE"}</p>
                  <span style={{ display: "inline-block", marginTop: 4, background: st.bg, color: st.col, fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20, textTransform: "capitalize" }}>{p.status}</span>
                </div>
              </div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #F0EADD", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, color: "var(--text-muted)" }}>
                <span>{methodLabel[p.method] ?? p.method} · {fmt(p.createdAt)}</span>
                <button onClick={() => printInvoice(p)} style={{ background: "var(--info-border)", color: "var(--blue-dark)", border: "1px solid #93C5FD", borderRadius: 9, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                  🧾 Invoice
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
