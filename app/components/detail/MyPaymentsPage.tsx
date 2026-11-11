"use client";

import { fmtIST } from "../../lib/dates";
import { AppIcon } from "../AppIcon";
import { ScreenHeader, IconTile, EmptyState, Pill, card, smallBtn, gradient, page, body, type Tone } from "../ui/kit";

export type PaymentItem = {
  invoiceNo: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  course: string | null;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const methodLabel: Record<string, string> = {
  upi: "UPI", card: "Card", netbanking: "Net Banking", cash: "Cash", cheque: "Cheque", bank: "Bank transfer",
};

const statusTone: Record<string, Tone> = {
  paid: "green",
  pending: "gold",
  failed: "red",
};

// Line-art scale mark for the printed invoice (the app never prints emoji).
const scaleSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0847c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px;margin-right:6px"><path d="M12 3v18"/><path d="M7 21h10"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0z"/><path d="m19 7-3 7a3 3 0 0 0 6 0z"/></svg>`;

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
  *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f1729;margin:0;padding:40px;background:#fff}
  .wrap{max-width:640px;margin:0 auto}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0847c7;padding-bottom:18px}
  .brand{font-size:22px;font-weight:800;color:#0847c7}
  .brand span{font-size:12px;font-weight:500;color:#0847c7;display:block;margin-top:2px}
  .inv{text-align:right;font-size:12px;color:#5b6478}
  .inv b{display:block;font-size:16px;color:#0f1729}
  .grid{display:flex;justify-content:space-between;margin:24px 0}
  .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#98a1b5;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th{text-align:left;font-size:11px;text-transform:uppercase;color:#98a1b5;border-bottom:1px solid #dbeafe;padding:8px 0}
  td{padding:12px 0;border-bottom:1px solid #e6eaf5;font-size:14px}
  .tot{display:flex;justify-content:space-between;margin-top:16px;font-size:18px;font-weight:800}
  .pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;background:#dcfce7;color:#15803d;text-transform:capitalize}
  .foot{margin-top:36px;font-size:11px;color:#98a1b5;border-top:1px solid #e6eaf5;padding-top:14px}
  @media print{body{padding:0}.wrap{max-width:none}}
</style></head><body><div class="wrap">
  <div class="head">
    <div><div class="brand">${scaleSvg}CLATians LMS<span>CLAT Coaching &amp; Test Prep</span></div></div>
    <div class="inv">INVOICE<b>${esc(p.invoiceNo)}</b>${esc(fmt(p.createdAt))}</div>
  </div>
  <div class="grid">
    <div><div class="lbl">Billed to</div><div style="font-weight:700">${esc(studentName)}</div><div style="font-size:12px;color:#5b6478">${esc(studentEmail)}</div></div>
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
    <div style={page}>
      <ScreenHeader title="Payments & Invoices" onBack={onBack} />

      <div style={body}>
        <div style={{ background: gradient, borderRadius: 20, padding: 18, color: "white", boxShadow: "0 8px 24px rgba(11,92,255,0.22)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.75)" }}>Total paid</p>
            <p style={{ margin: "6px 0 0", fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em" }}>{inr(totalPaid)}</p>
            <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.78)" }}>{payments.length} transaction{payments.length === 1 ? "" : "s"}</p>
          </div>
          <span style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="wallet" size={26} color="white" />
          </span>
        </div>

        {payments.length === 0 && (
          <EmptyState icon="receipt" title="No payments yet" text="Enrol in a batch to see your invoices here." />
        )}
        {payments.map((p) => (
          <div key={p.invoiceNo} style={{ ...card, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <IconTile icon="receipt" tone={statusTone[p.status] ?? "green"} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{p.course ?? "Fee payment"}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "var(--ink-mute)", fontFamily: "ui-monospace, monospace" }}>{p.invoiceNo}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 900, color: "var(--ink)" }}>{p.amount > 0 ? inr(p.amount) : "FREE"}</p>
                <Pill tone={statusTone[p.status] ?? "green"}><span style={{ textTransform: "capitalize" }}>{p.status}</span></Pill>
              </div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 11.5, color: "var(--ink-soft)" }}>
              <span>{methodLabel[p.method] ?? p.method} · {fmt(p.createdAt)}</span>
              <button onClick={() => printInvoice(p)} style={smallBtn}>
                <AppIcon name="receipt" size={14} />Invoice
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
