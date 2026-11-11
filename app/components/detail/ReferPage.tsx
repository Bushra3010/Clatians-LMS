"use client";

import { useState } from "react";
import { AppIcon } from "../AppIcon";
import { ScreenHeader, card, primaryBtn, smallBtn, goldBtn, input, gradient, page, body } from "../ui/kit";

export type Referral = { code: string; total: number; enrolled: number; credit: number };

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
    <div style={page}>
      <ScreenHeader title="Refer a Friend" onBack={onBack} />

      <div style={body}>
        {/* Hero */}
        <div style={{ background: gradient, borderRadius: 20, padding: 22, color: "white", textAlign: "center", boxShadow: "0 8px 24px rgba(11,92,255,0.22)", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AppIcon name="gift" size={28} color="white" />
          </span>
          <p style={{ margin: "10px 0 0", fontSize: 17, fontWeight: 800 }}>Invite friends to CLATians</p>
          <p style={{ margin: "6px 0 16px", fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>Share your code — when a friend enquires with it, you get credit.</p>
          <div style={{ alignSelf: "stretch", background: "rgba(255,255,255,0.12)", border: "1.5px dashed rgba(255,255,255,0.4)", borderRadius: 16, padding: 14, letterSpacing: "0.15em", fontSize: 28, fontWeight: 900 }}>
            {referral.code}
          </div>
          <button onClick={() => copy("code", referral.code)} style={{ ...goldBtn, marginTop: 12, padding: "11px 20px", fontSize: 13.5 }}>
            <AppIcon name={copied === "code" ? "check" : "copy"} size={16} color="var(--ink)" strokeWidth={copied === "code" ? 3 : 2} />
            {copied === "code" ? "Copied" : "Copy code"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { v: String(referral.total), l: "Enquiries referred" },
            { v: String(referral.enrolled), l: "Enrolled" },
            { v: `₹${referral.credit.toLocaleString("en-IN")}`, l: "Credit earned" },
          ].map((s, i) => (
            <div key={i} style={{ ...card, flex: 1, padding: "16px 10px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "var(--blue)" }}>{s.v}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* Credit explainer */}
        <div style={{ background: "var(--success)", border: "1px solid var(--success-border)", borderRadius: 18, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <AppIcon name="wallet" size={18} color="var(--success-text)" style={{ marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--success-text)", lineHeight: 1.55 }}>
            <b>Earn ₹500 per enrollment.</b> When a friend you referred joins a batch, ₹500 credit lands here — it auto-applies as a discount on your next fee payment.
          </p>
        </div>

        {/* Share link */}
        <div style={{ ...card, padding: 14 }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Your invite link</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} style={{ ...input, flex: 1, minWidth: 0, width: "auto", padding: "10px 12px", fontSize: 12.5, color: "var(--ink-soft)", background: "var(--app-bg)" }} />
            <button onClick={() => copy("link", link)} style={{ ...smallBtn, padding: "10px 14px" }}>
              {copied === "link" ? <AppIcon name="check" size={15} strokeWidth={3} /> : "Copy"}
            </button>
          </div>
          <button onClick={share} style={{ ...primaryBtn, marginTop: 10, width: "100%" }}>
            <AppIcon name="share" size={16} color="white" />
            Share invite
          </button>
        </div>

        <p style={{ margin: "2px 4px 0", fontSize: 11, color: "var(--ink-mute)", textAlign: "center", lineHeight: 1.5 }}>
          Friends enter your code on the enquiry form (or open your link). You&apos;ll get a notification when a referral comes in.
        </p>
      </div>
    </div>
  );
}
