"use client";

import { useActionState, startTransition, useState } from "react";
import Link from "next/link";
import ClatLogo from "../components/ClatLogo";
import { loginAction, type LoginState } from "../lib/session-actions";

const initial: LoginState = {};

const DEMOS = [
  { role: "Student", email: "rahul@student.in", password: "student123", emoji: "🎓" },
  { role: "Teacher", email: "anita@clatlms.in", password: "teach123", emoji: "👩‍🏫" },
  { role: "Admin", email: "admin@clatlms.in", password: "admin123", emoji: "🛡️" },
];

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillAndSubmit = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    const fd = new FormData();
    fd.set("email", e);
    fd.set("password", p);
    startTransition(() => action(fd));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#2B1700 0%,#4A2800 55%,#2B1700 100%)",
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
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Sign in</h1>
          <p style={{ margin: "0 0 22px", fontSize: 14, color: "#6B7280" }}>
            One login for students, teachers &amp; admins
          </p>

          <form action={action}>
            <label style={labelStyle}>Email</label>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />

            <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
            <input
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              style={inputStyle}
            />

            {state.error && (
              <p style={{ margin: "14px 0 0", fontSize: 13, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{
                width: "100%",
                marginTop: 18,
                background: "linear-gradient(135deg,#2B1700,#5C3A00)",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "15px",
                fontSize: 16,
                fontWeight: 700,
                cursor: pending ? "default" : "pointer",
                opacity: pending ? 0.7 : 1,
                boxShadow: "0 4px 14px rgba(43,23,0,0.3)",
              }}
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Demo quick-fill */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 14px" }}>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>Quick demo login</span>
            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {DEMOS.map((d) => (
              <button
                key={d.role}
                type="button"
                disabled={pending}
                onClick={() => fillAndSubmit(d.email, d.password)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: "#F9FAFB",
                  border: "1.5px solid #E5E7EB",
                  borderRadius: 12,
                  padding: "12px 6px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  cursor: pending ? "default" : "pointer",
                }}
              >
                <span style={{ fontSize: 20 }}>{d.emoji}</span>
                {d.role}
              </button>
            ))}
          </div>

          <p style={{ margin: "18px 0 0", textAlign: "center", fontSize: 13, color: "#6B7280" }}>
            New here?{" "}
            <Link href="/enquiry" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>
              Enquire &amp; book a free demo
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
  color: "#374151",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid #E5E7EB",
  borderRadius: 12,
  background: "#F9FAFB",
  padding: "13px 14px",
  fontSize: 15,
  outline: "none",
  color: "#1A1A2E",
};
