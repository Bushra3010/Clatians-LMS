"use client";

export type PaymentItem = {
  invoiceNo: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  course: string | null;
};

const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const methodLabel: Record<string, string> = {
  upi: "UPI", card: "Card", netbanking: "Net Banking", cash: "Cash", cheque: "Cheque", bank: "Bank transfer",
};

const statusStyle: Record<string, { bg: string; col: string }> = {
  paid: { bg: "#DCFCE7", col: "#15803D" },
  pending: { bg: "#FEF3C7", col: "#92400E" },
  failed: { bg: "#FEF2F2", col: "#DC2626" },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

export default function MyPaymentsPage({ onBack, payments }: { onBack: () => void; payments: PaymentItem[] }) {
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Payments &amp; Invoices
      </button>

      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ background: gradient, borderRadius: 18, padding: "18px", color: "#F7EFE2", boxShadow: "0 6px 20px rgba(61,36,17,0.28)" }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>Total paid</p>
          <p style={{ margin: "6px 0 0", fontSize: 34, fontWeight: 900 }}>{inr(totalPaid)}</p>
          <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#D9C6A8" }}>{payments.length} transaction{payments.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {payments.length === 0 && (
          <p style={{ margin: "10px 0", fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>No payments yet. Enrol in a batch to see your invoices here.</p>
        )}
        {payments.map((p) => {
          const st = statusStyle[p.status] ?? statusStyle.paid;
          return (
            <div key={p.invoiceNo} style={{ background: "white", borderRadius: 14, padding: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1A1A2E" }}>{p.course ?? "Fee payment"}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#9CA3AF", fontFamily: "ui-monospace, monospace" }}>{p.invoiceNo}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#1A1A2E" }}>{p.amount > 0 ? inr(p.amount) : "FREE"}</p>
                  <span style={{ display: "inline-block", marginTop: 4, background: st.bg, color: st.col, fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20, textTransform: "capitalize" }}>{p.status}</span>
                </div>
              </div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #F0EADD", display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#6B7280" }}>
                <span>{methodLabel[p.method] ?? p.method}</span>
                <span>{fmt(p.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
