"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookSlotAction, cancelBookingAction } from "../../lib/slot-actions";
import { fmtIST } from "../../lib/dates";
import { AppIcon } from "../AppIcon";
import { card, gradient, primaryBtn, outlineBtn, input, page, body, ScreenHeader, IconTile, EmptyState, Pill } from "../ui/kit";

export type SlotOpen = { id: string; startAt: string; durationMin: number; teacher: string };
export type SlotBooking = { id: string; startAt: string; durationMin: number; teacher: string; topic: string };

function fmt(iso: string) {
  return fmtIST(iso, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export default function SlotsPage({ onBack, openSlots, myBookings }: { onBack: () => void; openSlots: SlotOpen[]; myBookings: SlotBooking[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"open" | "mine">("open");
  const [open, setOpen] = useState<SlotOpen[]>(openSlots);
  const [mine, setMine] = useState<SlotBooking[]>(myBookings);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const book = async (slot: SlotOpen) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await bookSlotAction(slot.id, topic.trim());
      if (res.ok) {
        setOpen((o) => o.filter((s) => s.id !== slot.id));
        setMine((m) => [...m, { ...slot, topic: topic.trim() }].sort((a, b) => a.startAt.localeCompare(b.startAt)));
        setBookingId(null);
        setTopic("");
        setTab("mine");
        router.refresh();
      } else {
        setErr(res.error ?? "Couldn't book that slot.");
        if (res.error) setOpen((o) => o.filter((s) => s.id !== slot.id)); // it was taken — drop it
      }
    } catch {
      setErr("Couldn't book that slot.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await cancelBookingAction(id);
      if (res.ok) {
        setMine((m) => m.filter((s) => s.id !== id));
        router.refresh();
      } else {
        setErr(res.error ?? "Couldn't cancel that booking.");
      }
    } catch {
      setErr("Couldn't cancel that booking.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={page}>
      <ScreenHeader title="1:1 Slots" onBack={onBack} />

      <div style={body}>
        <div style={{ background: gradient, borderRadius: 20, padding: "16px", color: "white", boxShadow: "0 8px 22px rgba(11,92,255,0.22)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon name="clock" size={20} color="white" />
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>1:1 Doubt &amp; Mentorship Slots</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.78)" }}>Book a personal session with your faculty.</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, background: "white", border: "1px solid var(--line)", borderRadius: 14, padding: 4 }}>
          {([["open", `Open slots (${open.length})`], ["mine", `My bookings (${mine.length})`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setBookingId(null); setErr(null); }} style={{
              flex: 1, padding: "9px", borderRadius: 10, fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer",
              background: tab === key ? gradient : "transparent", color: tab === key ? "white" : "var(--ink-soft)",
            }}>{label}</button>
          ))}
        </div>

        {err && (
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--error-text)", background: "var(--error)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <AppIcon name="alert" size={16} color="var(--error-text)" />
            {err}
          </p>
        )}

        {tab === "open" && open.length === 0 && (
          <EmptyState icon="calendar" title="No open slots right now" text="Check back soon." />
        )}
        {tab === "mine" && mine.length === 0 && (
          <EmptyState icon="calendar" title="You have no upcoming bookings." />
        )}

        {tab === "open" && open.map((s) => (
          <div key={s.id} style={{ ...card, padding: "13px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <IconTile icon="calendar" size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{fmt(s.startAt)}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>{s.teacher} · {s.durationMin} min</p>
              </div>
              {bookingId !== s.id && (
                <button onClick={() => { setBookingId(s.id); setTopic(""); setErr(null); }} style={{ ...primaryBtn, flexShrink: 0, padding: "9px 18px", fontSize: 13, borderRadius: 12 }}>Book</button>
              )}
            </div>
            {bookingId === s.id && (
              <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} disabled={busy} placeholder="What do you want to cover? (optional)" style={input} />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => setBookingId(null)} disabled={busy} style={{ ...outlineBtn, flex: 1, padding: "10px" }}>Cancel</button>
                  <button onClick={() => book(s)} disabled={busy} style={{ ...primaryBtn, flex: 2, padding: "10px", cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>{busy ? "Booking…" : "Confirm booking"}</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {tab === "mine" && mine.map((s) => (
          <div key={s.id} style={{ ...card, padding: "13px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <IconTile icon="checkCircle" tone="green" size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <Pill tone="green">BOOKED</Pill>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{fmt(s.startAt)}</p>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>{s.teacher} · {s.durationMin} min{s.topic ? ` · “${s.topic}”` : ""}</p>
              </div>
              <button onClick={() => cancel(s.id)} disabled={busy} style={{ flexShrink: 0, background: "white", color: "var(--error-text)", border: "1.5px solid var(--error)", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 800, cursor: busy ? "default" : "pointer" }}>Cancel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
