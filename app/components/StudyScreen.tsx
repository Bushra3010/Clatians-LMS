"use client";

import { useState } from "react";
import { pushBack, goBack } from "../lib/back-stack";
import type { ContentItem } from "./detail/ContentListPage";
import type { TestListItem } from "./detail/TestPages";
import type { StudentProgress } from "./detail/ProgressPage";
import type { LiveClassItem } from "./detail/LiveClassesPage";
import { fmtTime, subjectStyle } from "./detail/LiveClassesPage";
import { ChevronRight, CheckCircle2 } from "./icons";

const baseTabs = ["Videos", "Notes", "Tests", "Current Affairs"] as const;
type Tab = "Syllabus" | typeof baseTabs[number];

const blueGradient = "linear-gradient(135deg,var(--blue-dark),var(--blue))";

/** A course's syllabus tree: subject → chapter → topic. */
export type SyllabusTopic = { id: string; title: string; durationMin: number; isFree: boolean; hasVideo: boolean; hasNotes: boolean; hasTest: boolean; completed: boolean };
export type SyllabusChapter = { id: string; title: string; topics: SyllabusTopic[] };
export type SyllabusSubject = { id: string; name: string; slug: string; icon: string; chapters: SyllabusChapter[] };

interface StudyScreenProps {
  videos: ContentItem[];
  notes: ContentItem[];
  currentAffairs: ContentItem[];
  tests: TestListItem[];
  progress: StudentProgress;
  onStartTest: (id: string) => void;
  upcomingClasses: LiveClassItem[];
  pastClasses: LiveClassItem[];
  onJoinClass: (id: string) => void;
  onWatchRecording: (cls: LiveClassItem) => void;
  subjects?: SyllabusSubject[];
  onOpenTopic?: (topicId: string) => void;
  /** Open subject/chapter live in the parent, so they survive opening a topic. */
  syllabusNav?: { subjectId: string | null; chapterId: string | null };
  onSyllabusNav?: (nav: { subjectId: string | null; chapterId: string | null }) => void;
}

function EmptyCard({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "28px 18px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 34, marginBottom: 6 }}>{emoji}</div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)" }}>{text}</p>
    </div>
  );
}

const topicCount = (s: SyllabusSubject) => s.chapters.reduce((n, c) => n + c.topics.length, 0);
const doneCount = (topics: SyllabusTopic[]) => topics.filter((t) => t.completed).length;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "6px 2px 0", fontSize: 11.5, fontWeight: 800, color: "var(--text-disabled)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{children}</p>;
}

const recordings = (past: LiveClassItem[]) => past.filter((c) => c.recordingUrl);

/** Live now, coming up next, and recordings of past classes — all played in-app. */
function LiveClassesBlock({ upcoming, past, onJoin, onWatch }: { upcoming: LiveClassItem[]; past: LiveClassItem[]; onJoin: (id: string) => void; onWatch: (cls: LiveClassItem) => void }) {
  const live = upcoming.filter((c) => c.status === "live");
  const next = upcoming.filter((c) => c.status !== "live").slice(0, 3);
  const recs = recordings(past).slice(0, 5);
  if (live.length + next.length + recs.length === 0) return null;

  return (
    <>
      <SectionLabel>Live classes</SectionLabel>
      {live.map((c) => (
        <button key={c.id} onClick={() => onJoin(c.id)} className="press" style={{ textAlign: "left", width: "100%", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#B91C1C,#EF4444)", borderRadius: 18, padding: "14px 16px", color: "white", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 22px rgba(185,28,28,0.3)" }}>
          <span style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{subjectStyle(c.subject).emoji}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 900, background: "white", color: "#B91C1C", padding: "2px 8px", borderRadius: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#B91C1C" }} /> LIVE NOW
            </span>
            <span style={{ display: "block", marginTop: 5, fontSize: 14.5, fontWeight: 800 }}>{c.title}</span>
            <span style={{ display: "block", fontSize: 11.5, opacity: 0.85 }}>{[c.subject, c.teacher].filter(Boolean).join(" · ")}</span>
          </span>
          <span style={{ background: "white", color: "#B91C1C", borderRadius: 12, padding: "9px 13px", fontSize: 12.5, fontWeight: 900, flexShrink: 0 }}>Join →</span>
        </button>
      ))}
      {next.map((c) => (
        <div key={c.id} style={{ background: "white", borderRadius: 16, border: "1px solid var(--line)", padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: subjectStyle(c.subject).bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{subjectStyle(c.subject).emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{c.title}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>⏰ {fmtTime(c.startAt)}{c.teacher ? ` · ${c.teacher}` : ""}</p>
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--blue)", background: "var(--info-border)", padding: "4px 9px", borderRadius: 20, flexShrink: 0 }}>Upcoming</span>
        </div>
      ))}
      {recs.map((c) => (
        <button key={c.id} onClick={() => onWatch(c)} className="press" style={{ textAlign: "left", width: "100%", cursor: "pointer", background: "white", borderRadius: 16, border: "1px solid var(--line)", padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>▶</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{c.title}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>Recording · {fmtTime(c.startAt)}{c.attended ? " · ✓ attended" : ""}</p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--blue)", flexShrink: 0 }}>Watch →</span>
        </button>
      ))}
    </>
  );
}

export default function StudyScreen({ videos, notes, currentAffairs, tests, progress, onStartTest, upcomingClasses, pastClasses, onJoinClass, onWatchRecording, subjects = [], onOpenTopic, syllabusNav = { subjectId: null, chapterId: null }, onSyllabusNav }: StudyScreenProps) {
  // The syllabus tab leads whenever the student's course actually has one.
  const hasSyllabus = subjects.length > 0;
  const studyTabs: Tab[] = hasSyllabus ? ["Syllabus", ...baseTabs] : [...baseTabs];
  const [activeTab, setActiveTab] = useState<Tab>(hasSyllabus ? "Syllabus" : "Videos");
  const { subjectId, chapterId: openChapter } = syllabusNav;
  const setOpenChapter = (chapterId: string | null) => onSyllabusNav?.({ subjectId, chapterId });
  const subject = subjects.find((s) => s.id === subjectId) ?? null;

  // Opening a subject is a step the phone's back gesture should undo.
  const closeSubject = () => onSyllabusNav?.({ subjectId: null, chapterId: null });
  const openSubject = (id: string, firstChapter: string | null) => {
    pushBack(closeSubject);
    onSyllabusNav?.({ subjectId: id, chapterId: firstChapter });
  };

  const pct = progress.contentTotal > 0 ? Math.round((progress.contentDone / progress.contentTotal) * 100) : 0;
  const open = (url: string) => { if (url && /^(https?:\/\/|\/uploads\/)/i.test(url.trim())) window.open(url.trim(), "_blank", "noopener"); };

  return (
    <div style={{ background: "var(--app-bg)", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ background: "white", padding: "16px 16px 0", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Study Material</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)" }}>Everything for your batch, in one place</p>
          </div>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: 16, padding: "12px 14px", marginBottom: 14, border: "1px solid var(--line)", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Course Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "var(--line)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,var(--blue-dark),var(--blue))", borderRadius: 20, transition: "width 0.3s" }} />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>{progress.contentDone} of {progress.contentTotal} items done · {progress.testsTaken} test{progress.testsTaken === 1 ? "" : "s"} taken</p>
        </div>

        <div style={{ display: "flex", gap: 8, paddingBottom: 14, overflowX: "auto" }} className="no-scroll">
          {studyTabs.map((tab) => (
            <button key={tab} onClick={() => { if (tab !== activeTab && subjectId) goBack(closeSubject); setActiveTab(tab); }} style={{
              padding: "9px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 600, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: activeTab === tab ? "var(--blue)" : "transparent",
              color: activeTab === tab ? "white" : "var(--text-secondary)",
            }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* ── Syllabus: subject → chapter → topic ── */}
        {activeTab === "Syllabus" && !subject && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {subjects.map((subj) => {
              const all = subj.chapters.flatMap((c) => c.topics);
              const pctDone = all.length ? Math.round((doneCount(all) / all.length) * 100) : 0;
              return (
                <button key={subj.id} onClick={() => openSubject(subj.id, subj.chapters[0]?.id ?? null)} className="press" style={{ textAlign: "left", background: "white", borderRadius: 18, border: "1px solid var(--border)", padding: "14px", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{subj.icon}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3 }}>{subj.name}</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{subj.chapters.length} chapter{subj.chapters.length === 1 ? "" : "s"} · {topicCount(subj)} topics</span>
                  <span style={{ height: 5, background: "var(--line)", borderRadius: 3, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${pctDone}%`, background: "var(--green)" }} />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "Syllabus" && subject && (
          <div>
            <button onClick={() => goBack(closeSubject)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "var(--ink-primary)", fontSize: 13, fontWeight: 700, padding: "0 0 10px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-primary)" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              All subjects
            </button>
            <h3 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 900, color: "var(--text-primary)" }}>{subject.icon} {subject.name}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {subject.chapters.map((ch, ci) => {
                const open = openChapter === ch.id;
                return (
                  <div key={ch.id} style={{ background: "white", borderRadius: 16, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                    <button onClick={() => setOpenChapter(open ? null : ch.id)} style={{ width: "100%", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--blue)", color: "white", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ci + 1}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--text-primary)" }}>{ch.title}</span>
                        <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{ch.topics.length} topics · {doneCount(ch.topics)} done</span>
                      </span>
                      <span style={{ display: "flex", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}><ChevronRight color="var(--text-muted)" /></span>
                    </button>
                    {open && (
                      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                        {ch.topics.map((t) => (
                          <button key={t.id} onClick={() => onOpenTopic?.(t.id)} className="press" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left" }}>
                            {t.completed
                              ? <CheckCircle2 size={18} style={{ color: "var(--success-text)", flexShrink: 0 }} />
                              : <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--line)", flexShrink: 0 }} />}
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{t.title}</span>
                              <span style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 10.5, color: "var(--ink-mute)" }}>
                                <span style={{ opacity: t.hasVideo ? 1 : 0.35 }}>🎥 Video</span>
                                <span style={{ opacity: t.hasNotes ? 1 : 0.35 }}>📄 Notes</span>
                                <span style={{ opacity: t.hasTest ? 1 : 0.35 }}>📝 Test</span>
                                <span>💬 Doubts</span>
                              </span>
                            </span>
                            <span style={{ display: "flex", flexShrink: 0 }}><ChevronRight color="var(--blue)" /></span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Flat content lists ── */}
        {activeTab !== "Syllabus" && (
          <>
            {activeTab === "Videos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <LiveClassesBlock upcoming={upcomingClasses} past={pastClasses} onJoin={onJoinClass} onWatch={onWatchRecording} />

                {videos.length > 0 && <SectionLabel>Video lectures</SectionLabel>}
                {videos.length === 0 && upcomingClasses.length === 0 && recordings(pastClasses).length === 0 && <EmptyCard emoji="🎥" text="No videos yet" />}
                {videos.map((item) => (
                  <div key={item.id} style={{ background: "white", borderRadius: 16, border: "1px solid var(--line)", padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 20 }}>🎥</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>{item.done ? "✓ Completed" : "Not started"}</p>
                    </div>
                    {item.body && <button onClick={() => open(item.body)} style={{ background: "var(--blue)", color: "white", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Open →</button>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Notes" && (
              notes.length === 0 ? <EmptyCard emoji="📄" text="No notes yet" /> :
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notes.map((item) => (
                  <div key={item.id} style={{ background: "white", borderRadius: 16, border: "1px solid var(--line)", padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--teal-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 20 }}>📄</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>{item.done ? "✓ Completed" : "Not started"}</p>
                    </div>
                    {item.body && <button onClick={() => open(item.body)} style={{ background: "var(--blue)", color: "white", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Open →</button>}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Tests" && (
              tests.length === 0 ? <EmptyCard emoji="📝" text="No tests available" /> :
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tests.map((t) => (
                  <div key={t.id} style={{ background: "white", borderRadius: 18, border: "1px solid var(--border)", padding: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{t.title}</p>
                        <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--text-muted)" }}>{t.questionCount} questions · {t.durationMin} min · {t.type}</p>
                        {t.myAttempts > 0 && t.bestScore != null && t.bestTotal ? (
                          <div style={{ display: "inline-flex", gap: 6, alignItems: "center", background: "var(--success)", border: "1px solid var(--success-border)", borderRadius: 20, padding: "3px 10px" }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--success-text)" }}>Best: {Math.round((t.bestScore / t.bestTotal) * 100)}%</span>
                          </div>
                        ) : null}
                      </div>
                      <button onClick={() => onStartTest(t.id)} style={{ background: blueGradient, color: "white", border: "none", borderRadius: 12, padding: "10px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(61,36,17,0.3)", whiteSpace: "nowrap" }}>
                        {t.myAttempts > 0 ? "Retake" : "Start →"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Current Affairs" && (
              currentAffairs.length === 0 ? <EmptyCard emoji="🗞" text="No current affairs items yet" /> :
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentAffairs.map((item) => (
                  <div key={item.id} style={{ background: "white", borderRadius: 18, border: "1px solid var(--border)", padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--orange-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 20 }}>🗞</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{item.done ? "✓ Completed" : "Not started"}</p>
                    </div>
                    {item.body && <button onClick={() => open(item.body)} style={{ background: "var(--blue)", color: "white", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Open →</button>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
