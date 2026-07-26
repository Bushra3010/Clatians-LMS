"use client";

import { useState } from "react";
import type { ContentItem } from "./detail/ContentListPage";
import type { TestListItem } from "./detail/TestPages";
import type { StudentProgress } from "./detail/ProgressPage";
import type { VocabItem } from "../lib/resource-types";

const studyTabs = ["Videos", "Notes", "Tests", "Flashcards", "Current Affairs"] as const;
type Tab = typeof studyTabs[number];

const isUrl = (s: string) => /^(https?:\/\/|\/uploads\/)/i.test((s || "").trim());
const gradient = "linear-gradient(135deg,#3D2411,#5C3A00)";

interface StudyScreenProps {
  videos: ContentItem[];
  notes: ContentItem[];
  currentAffairs: ContentItem[];
  tests: TestListItem[];
  progress: StudentProgress;
  savedVocabKeys: string[];
  vocab: VocabItem[];
  onStartTest: (id: string) => void;
  onToggleVocab: (word: string, meaning: string) => void;
  onOpenTools: () => void;
}

function EmptyCard({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "26px 18px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 30, marginBottom: 6 }}>{emoji}</div>
      <p style={{ margin: 0, fontSize: 12.5, color: "#9CA3AF" }}>{text}</p>
    </div>
  );
}

export default function StudyScreen({ videos, notes, currentAffairs, tests, progress, savedVocabKeys, vocab, onStartTest, onToggleVocab, onOpenTools }: StudyScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Videos");
  const [flipped, setFlipped] = useState<number | null>(null);

  const pct = progress.contentTotal > 0 ? Math.round((progress.contentDone / progress.contentTotal) * 100) : 0;
  const open = (url: string) => { if (isUrl(url)) window.open(url.trim(), "_blank", "noopener"); };

  return (
    <div style={{ background: "#F7F3EA", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: "white", padding: "16px 16px 0", borderBottom: "1px solid #F3F4F6" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>Study Material</h2>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>Everything for your batch, in one place</p>

        <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "12px 14px", marginBottom: 14, border: "1px solid #E5E7EB" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Course Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#3D2411" }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "#E5E7EB", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#3D2411,#8A5A08)", borderRadius: 20, transition: "width 0.3s" }} />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9CA3AF" }}>{progress.contentDone} of {progress.contentTotal} items done · {progress.testsTaken} test{progress.testsTaken === 1 ? "" : "s"} taken</p>
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 14 }} className="no-scroll">
          {studyTabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "8px 16px", borderRadius: 22, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: activeTab === tab ? "#3D2411" : "#F3F4F6", color: activeTab === tab ? "white" : "#374151",
            }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        {/* VIDEOS */}
        {activeTab === "Videos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {videos.length === 0 && <EmptyCard emoji="🎥" text="No video lectures published for your batch yet." />}
            {videos.map((v) => (
              <div key={v.id} style={{ background: "white", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: v.done ? "linear-gradient(135deg,#DCFCE7,#BBF7D0)" : gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{v.done ? "✓" : "🎥"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{v.title}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "#9CA3AF" }}>{v.author ?? "Faculty"}{v.course ? ` · ${v.course}` : ""}</p>
                </div>
                {isUrl(v.body) && (
                  <button onClick={() => open(v.body)} style={{ background: "#3D2411", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>▶ Play</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* NOTES */}
        {activeTab === "Notes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {notes.length === 0 && <EmptyCard emoji="📄" text="No study notes published for your batch yet." />}
            {notes.map((n) => (
              <div key={n.id} style={{ background: "white", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#F6ECD9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{n.title}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "#9CA3AF" }}>{isUrl(n.body) ? "PDF · tap to open" : n.body || n.author || "Notes"}</p>
                </div>
                {isUrl(n.body) && (
                  <button onClick={() => open(n.body)} style={{ background: "#3D2411", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Open</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TESTS */}
        {activeTab === "Tests" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Tests taken", value: String(progress.testsTaken), icon: "✅" },
                { label: "Average", value: progress.testAvgPct === null ? "—" : `${progress.testAvgPct}%`, icon: "📊" },
                { label: "Best", value: progress.testBestPct === null ? "—" : `${progress.testBestPct}%`, icon: "🏆" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: "white", borderRadius: 14, padding: "12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <p style={{ margin: 0, fontSize: 20 }}>{s.icon}</p>
                  <p style={{ margin: "4px 0 2px", fontSize: 18, fontWeight: 800, color: "#3D2411" }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#9CA3AF" }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tests.length === 0 && <EmptyCard emoji="📝" text="No tests published for your batch yet." />}
              {tests.map((t) => (
                <div key={t.id} style={{ background: "white", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>{t.title}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 11, color: "#9CA3AF" }}>{t.questionCount} Qs · {t.durationMin} min</p>
                    </div>
                    {t.bestScore !== null && (
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#059669" }}>{t.bestScore}/{t.bestTotal}</p>
                        <p style={{ margin: 0, fontSize: 10.5, color: "#9CA3AF" }}>best</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => onStartTest(t.id)} style={{ width: "100%", background: gradient, color: "white", border: "none", borderRadius: 10, padding: "10px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                    {t.myAttempts > 0 ? "Re-attempt →" : "Start Test →"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FLASHCARDS — real vocabulary, persistent "learned" */}
        {activeTab === "Flashcards" && (
          <div>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>Tap a card to flip · mark words you&apos;ve learned</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {vocab.length === 0 && <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>No vocabulary words published yet.</p>}
              {vocab.map((f, i) => {
                const learned = savedVocabKeys.includes(f.word);
                return (
                  <div key={i} style={{ background: flipped === i ? gradient : "white", borderRadius: 18, padding: "18px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", transition: "all 0.2s" }}>
                    <div onClick={() => setFlipped(flipped === i ? null : i)} style={{ cursor: "pointer", textAlign: "center", minHeight: 60, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      {flipped !== i ? (
                        <>
                          <span style={{ fontSize: 10.5, color: "#9CA3AF", marginBottom: 4 }}>VOCABULARY</span>
                          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#3D2411" }}>{f.word}</p>
                          <span style={{ fontSize: 10.5, color: "#D1D5DB", marginTop: 6 }}>Tap to see meaning</span>
                        </>
                      ) : (
                        <>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white" }}>{f.meaning}</p>
                          <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.75)", fontStyle: "italic" }}>“{f.example}”</p>
                        </>
                      )}
                    </div>
                    <button onClick={() => onToggleVocab(f.word, f.meaning)} style={{ width: "100%", marginTop: 12, background: learned ? "#DCFCE7" : (flipped === i ? "rgba(255,255,255,0.15)" : "#F6ECD9"), color: learned ? "#15803D" : (flipped === i ? "white" : "#3D2411"), border: "none", borderRadius: 10, padding: "9px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      {learned ? "✓ Learned" : "Mark learned"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CURRENT AFFAIRS */}
        {activeTab === "Current Affairs" && (
          <div>
            <button onClick={onOpenTools} style={{ width: "100%", background: "linear-gradient(135deg,#8B5CF6,#6D28D9)", borderRadius: 14, padding: "14px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", cursor: "pointer" }}>
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "white" }}>🗞 Daily CA Quiz</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Test your current-affairs knowledge</p>
              </div>
              <span style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 20 }}>Start →</span>
            </button>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentAffairs.length === 0 && <EmptyCard emoji="🗞" text="No current-affairs material published yet — try the CA quiz above." />}
              {currentAffairs.map((ca) => (
                <div key={ca.id} style={{ background: "white", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.4 }}>{ca.title}</p>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{isUrl(ca.body) ? "Tap to open." : ca.body}</p>
                  {isUrl(ca.body) ? (
                    <button onClick={() => open(ca.body)} style={{ background: "#F6ECD9", color: "#3D2411", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Read →</button>
                  ) : (
                    <span style={{ background: "#F6ECD9", color: "#3D2411", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{ca.author ?? "Faculty"}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
