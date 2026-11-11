"use client";

import { useState, useRef } from "react";
import type { StudentProfile } from "../../StudentApp";
import { changePasswordAction, updateNotifyPrefsAction, type NotifyPrefs } from "../../lib/session-actions";
import { AppIcon, type IconName } from "../AppIcon";
import { ScreenHeader, SectionTitle, IconTile, Pill, card, primaryBtn, input, page, body } from "../ui/kit";

const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{ width: 44, height: 26, borderRadius: 20, border: "none", cursor: "pointer", background: on ? "var(--blue)" : "var(--line-strong)", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
    <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(15,23,41,0.2)" }} />
  </button>
);

export default function SettingsPage({ onBack, profile, initialPrefs, onLogout }: { onBack: () => void; profile: StudentProfile; initialPrefs: NotifyPrefs; onLogout: () => void }) {
  const [prefs, setPrefs] = useState<NotifyPrefs>(initialPrefs);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Optimistic toggle: flip locally, persist in the background.
  const togglePref = (key: keyof NotifyPrefs) => {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] };
      updateNotifyPrefsAction(next).then((res) => {
        if (!res.ok) return;
        setPrefsSaved(true);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setPrefsSaved(false), 2000);
      });
      return next;
    });
  };
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

  const disabled = pwBusy || !pw.current || pw.next.length < 6;

  const row = (ic: IconName, label: string, sub: string, control: React.ReactNode, last = false) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderBottom: last ? "none" : "1px solid var(--line)" }}>
      <IconTile icon={ic} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 11.5, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</p>
      </div>
      {control}
    </div>
  );

  return (
    <div style={page}>
      <ScreenHeader title="Settings" onBack={onBack} />

      <div style={body}>
        {/* Account */}
        <SectionTitle title="Account" />
        <div style={{ ...card, overflow: "hidden" }}>
          {row("user", "Name", profile.name, null)}
          {row("mail", "Email", profile.email, null)}
          {row("graduation", "Batch", profile.batches[0] ?? "Not enrolled", null, true)}
        </div>

        {/* Change password */}
        <SectionTitle title="Security" />
        <form onSubmit={changePassword} style={{ ...card, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IconTile icon="lock" size={36} />
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>Change password</p>
          </div>
          <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} placeholder="Current password" style={input} />
          <input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="New password (min 6 characters)" style={input} />
          {pwMsg && (
            <p style={{ margin: 0, fontSize: 12, display: "flex", alignItems: "center", gap: 6, color: pwMsg.kind === "ok" ? "var(--success-text)" : "var(--error-text)" }}>
              <AppIcon name={pwMsg.kind === "ok" ? "checkCircle" : "alert"} size={15} />{pwMsg.text}
            </p>
          )}
          <button type="submit" disabled={disabled} style={{ ...primaryBtn, alignSelf: "flex-start", padding: "11px 18px", fontSize: 13.5, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1 }}>
            {pwBusy ? "Updating…" : "Update password"}
          </button>
        </form>

        {/* Notifications */}
        <SectionTitle title="Notifications" right={prefsSaved ? <Pill tone="green"><AppIcon name="check" size={11} strokeWidth={3} />Saved</Pill> : undefined} />
        <div style={{ ...card, overflow: "hidden" }}>
          {row("bell", "Push notifications", "Doubt replies, class reminders", <Toggle on={prefs.push} onClick={() => togglePref("push")} />)}
          {row("mail", "Email updates", "Weekly progress & announcements", <Toggle on={prefs.email} onClick={() => togglePref("email")} />)}
          {row("smartphone", "SMS alerts", "Important reminders only", <Toggle on={prefs.sms} onClick={() => togglePref("sms")} />, true)}
        </div>

        <button onClick={onLogout} style={{ ...card, marginTop: 8, width: "100%", color: "var(--error-text)", border: "1.5px solid var(--error)", padding: 14, fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <AppIcon name="logout" size={18} />
          Log out
        </button>
        <p style={{ margin: 0, textAlign: "center", fontSize: 11, color: "var(--ink-mute)" }}>CLATians LMS v1.0.0</p>
      </div>
    </div>
  );
}
