"use client";

import { useState } from "react";
import { AppIcon } from "../AppIcon";
import { ScreenHeader, SectionTitle, card, goldBtn, gradient, page, body } from "../ui/kit";

const faqs = [
  { q: "How do I enrol in a course?", a: "Go to the Courses tab, pick a batch and tap the card to see the full syllabus, then Buy / Enroll. Enrolling unlocks that batch's videos, notes, live classes and tests." },
  { q: "Where do I watch live classes?", a: "Open Live Classes from the Home screen. Tap Join on a live session to watch it in-app; recordings appear there after the class." },
  { q: "How can AI help me study?", a: "Tap AI Tutor any time to chat about a concept or a question. Use AI Practice on the Home screen to generate an instant quiz on any topic with explanations — your results count towards your streak. On My Progress, the AI Study Coach reviews your mock scores and suggests where to focus." },
  { q: "How do I book a 1:1 session with a teacher?", a: "On the Home screen tap “Book a 1:1 Slot”, choose an open time and add what you'd like to cover. It appears under My bookings, and the Home banner reminds you of your next session. You can cancel from My bookings." },
  { q: "How is my test rank calculated?", a: "After you submit a test, your All-India rank and percentile are computed against every student who has attempted that test. On the review screen you can tap Explain with AI on any question." },
  { q: "Where can I see my fee receipts?", a: "Profile → Payments & Invoices lists every payment, including cash/office payments. Tap Invoice on any entry to print it or save it as a PDF." },
  { q: "How do I ask a doubt?", a: "Open the Doubts tab → Ask Faculty. A teacher will answer and you'll get a notification when they reply." },
  { q: "How do I change my password?", a: "Profile → Settings → Change password. Enter your current password and a new one (at least 6 characters)." },
  { q: "Where are my saved notes?", a: "Profile → Saved Content. Anything you save from Tips & Tricks or mark as learned in Vocabulary shows up there." },
];

export default function HelpSupportPage({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={page}>
      <ScreenHeader title="Help & Support" onBack={onBack} />

      <div style={body}>
        {/* Contact */}
        <div style={{ background: gradient, borderRadius: 20, padding: 18, color: "white", boxShadow: "0 8px 24px rgba(11,92,255,0.22)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AppIcon name="help" size={21} color="white" />
            </span>
            <span>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Need help?</p>
              <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>Our team responds within a few hours.</p>
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <a href="mailto:support@clatlms.in" style={{ flex: 1, textDecoration: "none", background: "rgba(255,255,255,0.16)", color: "white", borderRadius: 14, padding: "12px", fontSize: 13.5, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <AppIcon name="mail" size={16} color="white" />Email us
            </a>
            <a href="tel:+911800000000" style={{ ...goldBtn, flex: 1, textDecoration: "none", padding: "12px", fontSize: 13.5 }}>
              <AppIcon name="phone" size={16} color="var(--ink)" />Call
            </a>
          </div>
        </div>

        {/* FAQ */}
        <SectionTitle title="Frequently asked" />
        {faqs.map((f, i) => (
          <div key={i} style={{ ...card, overflow: "hidden" }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{f.q}</span>
              <AppIcon name="chevronDown" size={17} color={open === i ? "var(--blue)" : "var(--ink-mute)"} strokeWidth={2.5} style={{ transform: open === i ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
            </button>
            {open === i && <p style={{ margin: 0, padding: "0 16px 14px", fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.6 }}>{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
