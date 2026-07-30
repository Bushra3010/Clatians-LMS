"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookSlotAction, cancelBookingAction } from "../../lib/slot-actions";

export type SlotOpen = { id: string; startAt: string; durationMin: number; teacher: string };
export type SlotBooking = { id: string; startAt: string; durationMin: number; teacher: string; topic: string };

const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
  });
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
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 28 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        1:1 Slots
      </button>

      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ background: gradient, borderRadius: 18, padding: "16px", color: "#F7EFE2", boxShadow: "0 6px 20px rgba(61,36,17,0.28)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>◷</span>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>1:1 Doubt &amp; Mentorship Slots</p>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#D9C6A8" }}>Book a personal session with your faculty.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "14px 14px 0" }}>
        {([["open", `Open slots (${open.length})`], ["mine", `My bookings (${mine.length})`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setBookingId(null); setErr(null); }} style={{
            flex: 1, padding: "10px", borderRadius: 12, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
            background: tab === key ? "#3D2411" : "#EDE3D3", color: tab === key ? "white" : "#6B5842",
          }}>{label}</button>
        ))}
      </div>

      {err && <p style={{ margin: "12px 14px 0", fontSize: 12.5, color: "#B45309", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 12px" }}>⚠️ {err}</p>}

      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {tab === "open" && open.length === 0 && (
          <p style={{ margin: "10px 0", fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>No open slots right now — check back soon.</p>
        )}
        {tab === "mine" && mine.length === 0 && (
          <p style={{ margin: "10px 0", fontSize: 13, color: "#9CA3AF", textAlign: "center" }}>You have no upcoming bookings.</p>
        )}

        {tab === "open" && open.map((s) => (
          <div key={s.id} style={{ background: "white", borderRadius: 14, padding: "13px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#1A1A2E" }}>{fmt(s.startAt)}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6B7280" }}>{s.teacher} · {s.durationMin} min</p>
              </div>
              {bookingId !== s.id && (
                <button onClick={() => { setBookingId(s.id); setTopic(""); setErr(null); }} style={{ background: gradient, color: "white", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Book</button>
              )}
            </div>
            {bookingId === s.id && (
              <div style={{ marginTop: 10, borderTop: "1px solid #F0EADD", paddingTop: 10 }}>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} disabled={busy} placeholder="What do you want to cover? (optional)" style={{ width: "100%", border: "1.5px solid #E1D3BC", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#231911", outline: "none", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button onClick={() => setBookingId(null)} disabled={busy} style={{ flex: 1, background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                  <button onClick={() => book(s)} disabled={busy} style={{ flex: 2, background: gradient, color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 800, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>{busy ? "Booking…" : "Confirm booking"}</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {tab === "mine" && mine.map((s) => (
          <div key={s.id} style={{ background: "white", borderRadius: 14, padding: "13px 14px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: "#DCFCE7", color: "#15803D", fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>BOOKED</span>
                  <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#1A1A2E" }}>{fmt(s.startAt)}</p>
                </div>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6B7280" }}>{s.teacher} · {s.durationMin} min{s.topic ? ` · “${s.topic}”` : ""}</p>
              </div>
              <button onClick={() => cancel(s.id)} disabled={busy} style={{ flexShrink: 0, background: "white", color: "#B45309", border: "1px solid #FDE68A", borderRadius: 10, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: busy ? "default" : "pointer" }}>Cancel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
