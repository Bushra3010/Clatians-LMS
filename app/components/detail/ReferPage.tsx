"use client";

import { useState } from "react";

const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";

export type Referral = { code: string; total: number; enrolled: number };

export default function ReferPage({ onBack, referral }: { onBack: () => void; referral: Referral }) {
  const [copied, setCopied] = useState<"" | "code" | "link">("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/enquiry?ref=${referral.code}`;
  const shareText = `Join me at CLATians LMS for CLAT prep! Use my referral code ${referral.code} when you enquire: ${link}`;

  const copy = async (what: "code" | "link", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      setTimeout(() => setCopied(""), 1800);
    } catch { /* clipboard unavailable */ }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      try { await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({ title: "CLATians LMS", text: shareText, url: link }); return; } catch { /* cancelled */ }
    }
    copy("link", shareText);
  };

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Refer a Friend
      </button>

      <div style={{ padding: "12px 14px 0" }}>
        {/* Hero */}
        <div style={{ background: gradient, borderRadius: 20, padding: "22px", color: "#F7EFE2", textAlign: "center", boxShadow: "0 8px 24px rgba(61,36,17,0.3)" }}>
          <div style={{ fontSize: 40 }}>🎁</div>
          <p style={{ margin: "6px 0 0", fontSize: 17, fontWeight: 800 }}>Invite friends to CLATians</p>
          <p style={{ margin: "6px 0 16px", fontSize: 12.5, color: "#D9C6A8" }}>Share your code — when a friend enquires with it, you get credit.</p>
          <div style={{ background: "rgba(255,255,255,0.12)", border: "1.5px dashed rgba(255,255,255,0.35)", borderRadius: 14, padding: "14px", letterSpacing: "0.15em", fontSize: 28, fontWeight: 900 }}>
            {referral.code}
          </div>
          <button onClick={() => copy("code", referral.code)} style={{ marginTop: 12, background: "#F5A623", color: "#3D2411", border: "none", borderRadius: 12, padding: "11px 20px", fontSize: 13.5, fontWeight: 800, cursor: "pointer" }}>
            {copied === "code" ? "✓ Copied" : "Copy code"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {[
            { v: String(referral.total), l: "Enquiries referred" },
            { v: String(referral.enrolled), l: "Enrolled" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: "white", borderRadius: 14, padding: "16px 12px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#3D2411" }}>{s.v}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF" }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Share link */}
        <div style={{ marginTop: 14, background: "white", borderRadius: 14, padding: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 700, color: "#1A1A2E" }}>Your invite link</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} style={{ flex: 1, minWidth: 0, border: "1.5px solid #E1D3BC", borderRadius: 10, padding: "10px 12px", fontSize: 12.5, color: "#4A3826", background: "#FBF7EF", outline: "none" }} />
            <button onClick={() => copy("link", link)} style={{ flexShrink: 0, background: "#F6ECD9", color: "#6B4A28", border: "1px solid #E7D6BA", borderRadius: 10, padding: "10px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              {copied === "link" ? "✓" : "Copy"}
            </button>
          </div>
          <button onClick={share} style={{ marginTop: 10, width: "100%", background: gradient, color: "white", border: "none", borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
            Share invite
          </button>
        </div>

        <p style={{ margin: "14px 4px 0", fontSize: 11, color: "#9CA3AF", textAlign: "center" }}>
          Friends enter your code on the enquiry form (or open your link). You&apos;ll get a notification when a referral comes in.
        </p>
      </div>
    </div>
  );
}
