"use client";

import { useActionState } from "react";
import Link from "next/link";
import ClatLogo from "../components/ClatLogo";
import { signupAction, type SignupState } from "../lib/session-actions";

const initial: SignupState = {};

const PERKS = [
  { icon: "🎁", text: "Free study material & scholarship mock test" },
  { icon: "✨", text: "AI Tutor — ask any CLAT doubt, 24×7" },
  { icon: "🎓", text: "Buy a batch to unlock live classes & full course" },
];

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, initial);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,var(--blue-dark) 0%,var(--blue-dark) 55%,var(--blue-dark) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "14px 28px", boxShadow: "0 8px 28px rgba(0,0,0,0.25)" }}>
            <ClatLogo size="md" showTagline={true} />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: 24, padding: "28px 24px", boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Create your free account</h1>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--text-muted)" }}>
            Start your CLAT prep in under a minute
          </p>

          {/* What you get */}
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--info-border)", borderRadius: 16, padding: "12px 14px", marginBottom: 18 }}>
            {PERKS.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: i < PERKS.length - 1 ? 8 : 0 }}>
                <span style={{ fontSize: 14, lineHeight: "18px" }}>{p.icon}</span>
                <span style={{ fontSize: 12.5, color: "var(--ink-primary)", lineHeight: 1.45, fontWeight: 600 }}>{p.text}</span>
              </div>
            ))}
          </div>

          <form action={action}>
            <label style={labelStyle}>Full name</label>
            <input name="name" required minLength={2} placeholder="e.g. Ananya Verma" style={inputStyle} />

            <label style={{ ...labelStyle, marginTop: 14 }}>Email</label>
            <input name="email" type="email" required placeholder="you@example.com" style={inputStyle} />

            <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
            <input name="password" type="password" required minLength={6} placeholder="Minimum 6 characters" style={inputStyle} />

            {state.error && (
              <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--error-text)", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{
                width: "100%",
                marginTop: 18,
                background: "linear-gradient(135deg,var(--blue-dark),var(--blue))",
                color: "var(--ink-primary)",
                border: "none",
                borderRadius: 16,
                padding: "15px",
                fontSize: 16,
                fontWeight: 800,
                cursor: pending ? "default" : "pointer",
                opacity: pending ? 0.7 : 1,
                boxShadow: "0 6px 16px rgba(6,53,154,0.35)",
              }}
            >
              {pending ? "Creating account…" : "Create free account →"}
            </button>
          </form>

          <p style={{ margin: "18px 0 0", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
          <p style={{ margin: "8px 0 0", textAlign: "center", fontSize: 12, color: "var(--text-disabled)" }}>
            Prefer talking to us first?{" "}
            <Link href="/enquiry" style={{ color: "#C8860A", fontWeight: 600, textDecoration: "none" }}>
              Book a free demo
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--border)",
  borderRadius: 12,
  background: "var(--surface-input)",
  padding: "13px 14px",
  fontSize: 15,
  outline: "none",
  color: "#1A1A2E",
};
