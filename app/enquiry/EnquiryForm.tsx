"use client";

import { useActionState } from "react";
import Link from "next/link";
import ClatLogo from "../components/ClatLogo";
import { createLeadAction, type LeadState } from "../lib/lead-actions";

const initial: LeadState = {};

const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const input: React.CSSProperties = { width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12, background: "#F9FAFB", padding: "12px 14px", fontSize: 15, outline: "none", color: "#1A1A2E" };

export default function EnquiryForm({ courses, defaultRef = "" }: { courses: string[]; defaultRef?: string }) {
  const [state, action, pending] = useActionState(createLeadAction, initial);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#2B1700 0%,#4A2800 55%,#2B1700 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <div style={{ background: "white", borderRadius: 20, padding: "14px 28px", boxShadow: "0 8px 28px rgba(0,0,0,0.25)" }}>
            <ClatLogo size="md" showTagline={true} />
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 24, padding: "26px 24px", boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
          {state.ok ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 10 }}>🎉</div>
              <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Thanks — we&apos;ll be in touch!</h1>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6B7280" }}>Our counsellor will call you shortly about your CLAT preparation.</p>
              <Link href="/login" style={{ textDecoration: "none", display: "inline-block", background: "linear-gradient(135deg,#2B1700,#5C3A00)", color: "white", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700 }}>
                Go to login
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Enquire about courses</h1>
              <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6B7280" }}>Tell us a bit about you and book a free demo class.</p>

              <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={label}>Full name *</label>
                  <input name="name" required style={input} placeholder="Your name" />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={label}>Phone *</label>
                    <input name="phone" required style={input} placeholder="+91…" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={label}>Email</label>
                    <input name="email" type="email" style={input} placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label style={label}>Interested in</label>
                  <select name="interest" style={input} defaultValue="">
                    <option value="">Not sure yet</option>
                    {courses.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>Preferred demo date (optional)</label>
                  <input name="demoDate" type="date" style={input} />
                </div>
                <div>
                  <label style={label}>Message</label>
                  <textarea name="message" rows={3} style={{ ...input, resize: "vertical" }} placeholder="Anything you'd like us to know?" />
                </div>

                <div>
                  <label style={label}>Referral code (optional)</label>
                  <input name="ref" defaultValue={defaultRef} style={{ ...input, textTransform: "uppercase" }} placeholder="Friend's code, if any" />
                </div>

                {state.error && (
                  <p style={{ margin: 0, fontSize: 13, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 12px" }}>{state.error}</p>
                )}

                <button type="submit" disabled={pending} style={{ background: "linear-gradient(135deg,#2B1700,#5C3A00)", color: "white", border: "none", borderRadius: 14, padding: "15px", fontSize: 16, fontWeight: 700, cursor: pending ? "default" : "pointer", opacity: pending ? 0.7 : 1, boxShadow: "0 4px 14px rgba(43,23,0,0.3)" }}>
                  {pending ? "Submitting…" : "Book my free demo"}
                </button>
              </form>

              <p style={{ margin: "16px 0 0", textAlign: "center", fontSize: 13, color: "#9CA3AF" }}>
                Already a student? <Link href="/login" style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>Log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
