"use client";

import { useState } from "react";
import type { StudentProfile } from "../../StudentApp";
import { changePasswordAction } from "../../lib/session-actions";

export default function SettingsPage({ onBack, profile, onLogout }: { onBack: () => void; profile: StudentProfile; onLogout: () => void }) {
  const [prefs, setPrefs] = useState({ push: true, email: true, sms: false });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwBusy || !pw.current || pw.next.length < 6) return;
    setPwBusy(true);
    setPwMsg(null);
    try {
      const res = await changePasswordAction(pw.current, pw.next);
      if (res.ok) {
        setPwMsg({ kind: "ok", text: "Password updated." });
        setPw({ current: "", next: "" });
      } else {
        setPwMsg({ kind: "err", text: res.error ?? "Couldn't update password." });
      }
    } catch {
      setPwMsg({ kind: "err", text: "Couldn't update password." });
    } finally {
      setPwBusy(false);
    }
  };

  const pwInput: React.CSSProperties = { width: "100%", border: "1.5px solid #E1D3BC", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "#231911", outline: "none", boxSizing: "border-box" };

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ width: 44, height: 26, borderRadius: 20, border: "none", cursor: "pointer", background: on ? "#3D2411" : "#D1D5DB", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );

  const row = (label: string, sub: string, control: React.ReactNode) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#1A1A2E" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF" }}>{sub}</p>
      </div>
      {control}
    </div>
  );

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Settings
      </button>

      <div style={{ padding: "14px 14px 0" }}>
        {/* Account */}
        <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>Account</h3>
        <div style={{ background: "white", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: 20 }}>
          {row("Name", profile.name, null)}
          {row("Email", profile.email, null)}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#1A1A2E" }}>Batch</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF" }}>{profile.batches[0] ?? "Not enrolled"}</p>
            </div>
          </div>
        </div>

        {/* Change password */}
        <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>Security</h3>
        <form onSubmit={changePassword} style={{ background: "white", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", padding: "16px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#1A1A2E" }}>Change password</p>
          <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="Current password" style={pwInput} />
          <input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="New password (min 6 characters)" style={pwInput} />
          {pwMsg && <p style={{ margin: 0, fontSize: 12, color: pwMsg.kind === "ok" ? "#15803D" : "#B45309" }}>{pwMsg.kind === "ok" ? "✅ " : "⚠️ "}{pwMsg.text}</p>}
          <button type="submit" disabled={pwBusy || !pw.current || pw.next.length < 6} style={{ alignSelf: "flex-start", background: "#3D2411", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13.5, fontWeight: 700, cursor: pwBusy || !pw.current || pw.next.length < 6 ? "default" : "pointer", opacity: pwBusy || !pw.current || pw.next.length < 6 ? 0.6 : 1 }}>
            {pwBusy ? "Updating…" : "Update password"}
          </button>
        </form>

        {/* Notifications */}
        <h3 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>Notifications</h3>
        <div style={{ background: "white", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden", marginBottom: 24 }}>
          {row("Push notifications", "Doubt replies, class reminders", <Toggle on={prefs.push} onClick={() => setPrefs((p) => ({ ...p, push: !p.push }))} />)}
          {row("Email updates", "Weekly progress & announcements", <Toggle on={prefs.email} onClick={() => setPrefs((p) => ({ ...p, email: !p.email }))} />)}
          <div style={{ borderBottom: "none" }}>{row("SMS alerts", "Important reminders only", <Toggle on={prefs.sms} onClick={() => setPrefs((p) => ({ ...p, sms: !p.sms }))} />)}</div>
        </div>

        <button onClick={onLogout} style={{ width: "100%", background: "#FEF2F2", color: "#E63946", border: "1.5px solid #FECACA", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          Log out
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", marginTop: 12 }}>CLATians LMS v1.0.0</p>
      </div>
    </div>
  );
}
