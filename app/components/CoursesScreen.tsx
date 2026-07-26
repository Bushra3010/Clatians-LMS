"use client";

import { useState } from "react";

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  enrolled: boolean;
  contentCount: number;
  classCount: number;
};

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const METHODS = [
  { id: "upi", icon: "📱", label: "UPI / GPay / PhonePe", sub: "Instant" },
  { id: "card", icon: "💳", label: "Credit / Debit Card", sub: "Visa, Mastercard, Rupay" },
  { id: "netbanking", icon: "🏦", label: "Net Banking", sub: "All major banks" },
];

const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";

interface CoursesScreenProps {
  catalog: CatalogItem[];
  onEnroll: (courseId: string, method: string) => Promise<{ ok: boolean; invoiceNo?: string; amount?: number; error?: string }>;
}

type View =
  | { name: "list" }
  | { name: "checkout"; course: CatalogItem }
  | { name: "success"; course: CatalogItem; invoiceNo: string; amount: number };

export default function CoursesScreen({ catalog, onEnroll }: CoursesScreenProps) {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [view, setView] = useState<View>({ name: "list" });
  const [method, setMethod] = useState("upi");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const mine = catalog.filter((c) => c.enrolled);
  const shown = tab === "mine" ? mine : catalog;

  const pay = async (course: CatalogItem) => {
    setPaying(true);
    setError("");
    const res = await onEnroll(course.id, method);
    setPaying(false);
    if (res.ok) {
      setView({ name: "success", course, invoiceNo: res.invoiceNo ?? "", amount: res.amount ?? course.price });
    } else {
      setError(res.error ?? "Payment failed. Please try again.");
    }
  };

  // ── SUCCESS ──
  if (view.name === "success") {
    return (
      <div style={{ background: "#F7F3EA", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>🎉</div>
        <div style={{ background: gradient, borderRadius: 24, padding: "26px 22px", width: "100%", maxWidth: 340, marginBottom: 20, boxShadow: "0 12px 36px rgba(61,36,17,0.35)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 14px" }}>✅</div>
          <p style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "white" }}>You&apos;re enrolled!</p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{view.course.name}</p>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 14, padding: "12px 16px" }}>
            {[
              { label: "Amount paid", value: view.amount > 0 ? inr(view.amount) : "FREE" },
              { label: "Invoice", value: view.invoiceNo || "—" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: i === 0 ? 8 : 0, paddingBottom: i === 0 ? 8 : 0, borderBottom: i === 0 ? "1px solid rgba(255,255,255,0.12)" : "none" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "#6B7280", maxWidth: 300 }}>
          This batch&apos;s videos, notes, practice and live classes are now unlocked for you.
        </p>
        <button onClick={() => { setView({ name: "list" }); setTab("mine"); }} style={{
          background: gradient, color: "white", border: "none", borderRadius: 14,
          padding: "15px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 6px 16px rgba(61,36,17,0.35)",
        }}>Go to My Batches</button>
      </div>
    );
  }

  // ── CHECKOUT ──
  if (view.name === "checkout") {
    const c = view.course;
    const gst = Math.round(c.price * 0.18);
    const total = c.price + gst;
    return (
      <div style={{ background: "#F7F3EA", paddingBottom: 30, minHeight: "100vh" }}>
        <button onClick={() => setView({ name: "list" })} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 4px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          Checkout
        </button>

        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>Order Summary</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: 12, borderBottom: "1px solid #F3F4F6", marginBottom: 12 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>⚖️</div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{c.name}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#9CA3AF" }}>{c.contentCount} study items · {c.classCount} classes</p>
              </div>
            </div>
            {c.price > 0 ? (
              <>
                {[["Batch price", inr(c.price)], ["GST (18%)", inr(gst)]].map(([l, v], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "#6B7280" }}>{l}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#3D2411" }}>{inr(total)}</span>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#059669" }}>Free — no payment needed</p>
            )}
          </div>

          {c.price > 0 && (
            <div style={{ background: "white", borderRadius: 18, padding: "16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>Payment Method</p>
              {METHODS.map((m) => (
                <div key={m.id} onClick={() => setMethod(m.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  borderRadius: 12, marginBottom: 8, cursor: "pointer",
                  border: `1.5px solid ${method === m.id ? "#3D2411" : "#E5E7EB"}`,
                  background: method === m.id ? "#F6ECD9" : "white",
                }}>
                  <span style={{ fontSize: 22 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1A1A2E" }}>{m.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>{m.sub}</p>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${method === m.id ? "#3D2411" : "#D1D5DB"}`, background: method === m.id ? "#3D2411" : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {method === m.id && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />}
                  </div>
                </div>
              ))}
              <div style={{ background: "#FEF3E2", borderRadius: 10, padding: "8px 12px", marginTop: 4 }}>
                <p style={{ margin: 0, fontSize: 11, color: "#92400E" }}>🧪 Test mode — this is a simulated payment. No real money is charged.</p>
              </div>
            </div>
          )}

          {error && <p style={{ margin: "0 0 12px", fontSize: 13, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px" }}>{error}</p>}

          <button onClick={() => pay(c)} disabled={paying} style={{
            width: "100%", background: gradient, color: "white", border: "none",
            borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 800,
            cursor: paying ? "default" : "pointer", opacity: paying ? 0.7 : 1,
            boxShadow: "0 6px 18px rgba(61,36,17,0.35)",
          }}>
            {paying ? "Processing…" : c.price > 0 ? `Pay ${inr(total)}` : "Enroll Free"}
          </button>
        </div>
      </div>
    );
  }

  // ── LIST ──
  return (
    <div style={{ background: "#F7F3EA", paddingBottom: 24 }}>
      <div style={{ background: "white", padding: "16px 16px 0", borderBottom: "1px solid #F0F0F5" }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Courses</h2>
        <div style={{ display: "flex", gap: 8, paddingBottom: 14 }}>
          {([["all", "All Batches"], ["mine", `My Batches (${mine.length})`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "10px", borderRadius: 12, fontSize: 13, fontWeight: 700,
              border: "none", cursor: "pointer",
              background: tab === key ? "#3D2411" : "#F3F4F6",
              color: tab === key ? "white" : "#374151",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 14 }}>
        {shown.length === 0 && (
          <p style={{ margin: "10px 0", fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>
            {tab === "mine" ? "You haven't enrolled in any batch yet." : "No batches available."}
          </p>
        )}

        {shown.map((c) => (
          <div key={c.id} style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            <div style={{ height: 84, background: gradient, display: "flex", alignItems: "center", padding: "0 18px", gap: 14, position: "relative" }}>
              <div style={{ position: "absolute", right: -20, top: -20, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>⚖️</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "white" }}>{c.name}</h3>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</p>
              </div>
              {c.enrolled && (
                <span style={{ position: "absolute", top: 12, right: 12, background: "#059669", color: "white", fontSize: 9.5, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>✓ ENROLLED</span>
              )}
            </div>

            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
                <span>📚 {c.contentCount} study items</span>
                <span>🎥 {c.classCount} classes</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: c.price === 0 ? "#059669" : "#1A1A2E" }}>
                  {c.price === 0 ? "FREE" : inr(c.price)}
                </span>
                {c.enrolled ? (
                  <span style={{ background: "#DCFCE7", color: "#15803D", fontSize: 13, fontWeight: 700, padding: "11px 20px", borderRadius: 14 }}>Enrolled</span>
                ) : (
                  <button onClick={() => { setError(""); setMethod("upi"); setView({ name: "checkout", course: c }); }} style={{
                    background: gradient, color: "white", border: "none", borderRadius: 14,
                    padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(61,36,17,0.3)",
                  }}>
                    {c.price === 0 ? "Enroll Free" : "Buy Now →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
