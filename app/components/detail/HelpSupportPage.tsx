"use client";

import { useState } from "react";

const faqs = [
  { q: "How do I enrol in a course?", a: "Go to the Courses tab, pick a batch and tap the card to see the full syllabus, then Buy / Enroll. Enrolling unlocks that batch's videos, notes, live classes and tests." },
  { q: "Where do I watch live classes?", a: "Open Live Classes from the Home screen. Tap Join on a live session to watch it in-app; recordings appear there after the class." },
  { q: "How can AI help me study?", a: "Tap ✨ AI Tutor any time to chat about a concept or a question. Use ✨ AI Practice on the Home screen to generate an instant quiz on any topic with explanations — your results count towards your streak. On My Progress, the AI Study Coach reviews your mock scores and suggests where to focus." },
  { q: "How do I book a 1:1 session with a teacher?", a: "On the Home screen tap “Book a 1:1 Slot”, choose an open time and add what you'd like to cover. It appears under My bookings, and the Home banner reminds you of your next session. You can cancel from My bookings." },
  { q: "How is my test rank calculated?", a: "After you submit a test, your All-India rank and percentile are computed against every student who has attempted that test. On the review screen you can tap ✨ Explain with AI on any question." },
  { q: "Where can I see my fee receipts?", a: "Profile → Payments & Invoices lists every payment, including cash/office payments. Tap 🧾 Invoice on any entry to print it or save it as a PDF." },
  { q: "How do I ask a doubt?", a: "Open the Doubts tab → Ask Faculty. A teacher will answer and you'll get a notification when they reply." },
  { q: "How do I change my password?", a: "Profile → Settings → Change password. Enter your current password and a new one (at least 6 characters)." },
  { q: "Where are my saved notes?", a: "Profile → Saved Content. Anything you save from Tips & Tricks or mark as learned in Vocabulary shows up there." },
];

export default function HelpSupportPage({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ background: "#F7F3EA", minHeight: "100%", paddingBottom: 24 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#2B1700", fontSize: 14, fontWeight: 700, padding: "14px 16px 0" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B1700" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Help & Support
      </button>

      {/* Contact */}
      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ background: "linear-gradient(135deg,#3D2411,#5C3A00)", borderRadius: 18, padding: "18px", color: "white", boxShadow: "0 6px 20px rgba(61,36,17,0.3)" }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Need help?</p>
          <p style={{ margin: "4px 0 14px", fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>Our team responds within a few hours.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <a href="mailto:support@clatlms.in" style={{ flex: 1, textAlign: "center", textDecoration: "none", background: "rgba(255,255,255,0.15)", color: "white", borderRadius: 12, padding: "11px", fontSize: 13, fontWeight: 700 }}>✉ Email us</a>
            <a href="tel:+911800000000" style={{ flex: 1, textAlign: "center", textDecoration: "none", background: "#F5A623", color: "white", borderRadius: 12, padding: "11px", fontSize: 13, fontWeight: 700 }}>📞 Call</a>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: "18px 14px 0" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>Frequently asked</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "#1A1A2E" }}>{f.q}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{ transform: open === i ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }}><polyline points="9 18 15 12 9 6" /></svg>
              </button>
              {open === i && <p style={{ margin: 0, padding: "0 16px 14px", fontSize: 12.5, color: "#6B7280", lineHeight: 1.6 }}>{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
