"use client";

import { useState } from "react";
import { pushBack, goBack } from "../lib/back-stack";
import type { ContentItem } from "./detail/ContentListPage";
import type { TestListItem } from "./detail/TestPages";
import type { StudentProgress } from "./detail/ProgressPage";
import type { LiveClassItem } from "./detail/LiveClassesPage";
import { fmtTime, subjectStyle } from "./detail/LiveClassesPage";
import { ChevronRight, CheckCircle2 } from "./icons";
import { AppIcon, subjectIconName } from "./AppIcon";
import { gradient, card, primaryBtn, smallBtn, goldBtn, ScreenHeader, SectionTitle, IconTile, EmptyState, Pill } from "./ui/kit";

const baseTabs = ["Videos", "Notes", "Tests", "Current Affairs"] as const;
type Tab = "Syllabus" | typeof baseTabs[number];

/** A course's syllabus tree: subject → chapter → topic. */
export type SyllabusTopic = { id: string; title: string; durationMin: number; isFree: boolean; hasVideo: boolean; hasNotes: boolean; hasTest: boolean; completed: boolean; /** Paid topic in a course the student hasn't enrolled in. */ locked: boolean };
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
  /** Sends a student with locked topics to the batches they can enrol in. */
  onBrowseCourses?: () => void;
  /** Open subject/chapter live in the parent, so they survive opening a topic. */
  syllabusNav?: { subjectId: string | null; chapterId: string | null };
  onSyllabusNav?: (nav: { subjectId: string | null; chapterId: string | null }) => void;
  /** Opens the website's blog (daily Current Affairs notes). */
  onOpenCurrentAffairs?: () => void;
}

/** "Completed" / "Not started" line under a content row. */
function DoneLine({ done }: { done: boolean }) {
  return done
    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--success-text)", fontWeight: 700 }}><AppIcon name="check" size={11} strokeWidth={2.8} />Completed</span>
    : <>Not started</>;
}

/** Small "Open" button on a content row. */
function OpenBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} style={smallBtn}>Open <AppIcon name="arrowRight" size={13} strokeWidth={2.5} /></button>;
}

const metaItem: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 3 };
const row: React.CSSProperties = { ...card, borderRadius: 16, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" };

const topicCount = (s: SyllabusSubject) => s.chapters.reduce((n, c) => n + c.topics.length, 0);
const doneCount = (topics: SyllabusTopic[]) => topics.filter((t) => t.completed).length;

function SectionLabel({ children }: { children: string }) {
  return <SectionTitle title={children} />;
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
          <span style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name={subjectStyle(c.subject).icon} size={21} color="white" /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 900, background: "white", color: "#B91C1C", padding: "2px 8px", borderRadius: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#B91C1C" }} /> LIVE NOW
            </span>
            <span style={{ display: "block", marginTop: 5, fontSize: 14.5, fontWeight: 800 }}>{c.title}</span>
            <span style={{ display: "block", fontSize: 11.5, opacity: 0.85 }}>{[c.subject, c.teacher].filter(Boolean).join(" · ")}</span>
          </span>
          <span style={{ background: "white", color: "#B91C1C", borderRadius: 12, padding: "9px 13px", fontSize: 12.5, fontWeight: 900, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>Join <AppIcon name="arrowRight" size={13} strokeWidth={2.6} /></span>
        </button>
      ))}
      {next.map((c) => (
        <div key={c.id} style={row}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: subjectStyle(c.subject).bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name={subjectStyle(c.subject).icon} size={20} color="white" /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{c.title}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}><AppIcon name="clock" size={11} />{fmtTime(c.startAt)}{c.teacher ? ` · ${c.teacher}` : ""}</p>
          </div>
          <Pill>Upcoming</Pill>
        </div>
      ))}
      {recs.map((c) => (
        <button key={c.id} onClick={() => onWatch(c)} className="press" style={{ ...row, textAlign: "left", width: "100%", cursor: "pointer" }}>
          <IconTile icon="play" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{c.title}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 3 }}>Recording · {fmtTime(c.startAt)}{c.attended && <> · <AppIcon name="check" size={11} color="var(--success-text)" strokeWidth={2.8} /> attended</>}</p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--blue)", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>Watch <AppIcon name="arrowRight" size={13} strokeWidth={2.5} /></span>
        </button>
      ))}
    </>
  );
}

export default function StudyScreen({ videos, notes, currentAffairs, tests, progress, onStartTest, upcomingClasses, pastClasses, onJoinClass, onWatchRecording, subjects = [], onOpenTopic, onBrowseCourses, syllabusNav = { subjectId: null, chapterId: null }, onSyllabusNav, onOpenCurrentAffairs }: StudyScreenProps) {
  // The syllabus tab leads whenever the student's course actually has one.
  const hasSyllabus = subjects.length > 0;
  const allTopics = subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics));
  const lockedCount = allTopics.filter((t) => t.locked).length;
  const freeCount = allTopics.length - lockedCount;
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
      <div style={{ background: "white", padding: "16px 16px 0", borderBottom: "1px solid var(--line)" }}>
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500 }}>Everything for your batch, in one place</p>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>Study Material</h2>
        </div>

        <div style={{ ...card, borderRadius: 16, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>Course Progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--blue)" }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: "var(--line)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: gradient, borderRadius: 20, transition: "width 0.3s" }} />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>{progress.contentDone} of {progress.contentTotal} items done · {progress.testsTaken} test{progress.testsTaken === 1 ? "" : "s"} taken</p>
        </div>

        <div style={{ display: "flex", gap: 8, paddingBottom: 14, overflowX: "auto" }} className="no-scroll">
          {studyTabs.map((tab) => (
            <button key={tab} onClick={() => { if (tab !== activeTab && subjectId) goBack(closeSubject); setActiveTab(tab); }} style={{
              padding: "9px 16px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: activeTab === tab ? gradient : "var(--app-bg)",
              color: activeTab === tab ? "white" : "var(--ink-soft)",
            }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* ── Syllabus: subject → chapter → topic ── */}
        {/* Not enrolled yet — the tree is a preview with the free topics open. */}
        {activeTab === "Syllabus" && lockedCount > 0 && (
          <div style={{ background: gradient, borderRadius: 18, padding: "14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 6px 18px rgba(11,92,255,0.25)" }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="lock" size={19} color="white" /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "white" }}>Free preview</span>
              <span style={{ display: "block", fontSize: 11.5, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                {freeCount} free topic{freeCount === 1 ? "" : "s"} open · enrol in a batch to unlock all {allTopics.length}
              </span>
            </span>
            <button onClick={() => onBrowseCourses?.()} className="press" style={{ ...goldBtn, borderRadius: 10, padding: "9px 12px", fontSize: 12, whiteSpace: "nowrap" }}>See batches</button>
          </div>
        )}

        {activeTab === "Syllabus" && !subject && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {subjects.map((subj) => {
              const all = subj.chapters.flatMap((c) => c.topics);
              const pctDone = all.length ? Math.round((doneCount(all) / all.length) * 100) : 0;
              return (
                <button key={subj.id} onClick={() => openSubject(subj.id, subj.chapters[0]?.id ?? null)} className="press" style={{ ...card, textAlign: "left", padding: "14px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}>
                  <IconTile icon={subjectIconName(subj.name)} size={40} />
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{subj.name}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{subj.chapters.length} chapter{subj.chapters.length === 1 ? "" : "s"} · {topicCount(subj)} topics</span>
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
            <div style={{ ...card, overflow: "hidden", marginBottom: 12 }}>
              <ScreenHeader title={subject.name} subtitle="All subjects" onBack={() => goBack(closeSubject)} right={<IconTile icon={subjectIconName(subject.name)} size={36} />} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {subject.chapters.map((ch, ci) => {
                const open = openChapter === ch.id;
                return (
                  <div key={ch.id} style={{ ...card, borderRadius: 16, overflow: "hidden" }}>
                    <button onClick={() => setOpenChapter(open ? null : ch.id)} style={{ width: "100%", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}>
                      <span style={{ width: 28, height: 28, borderRadius: 8, background: gradient, color: "white", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{ci + 1}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{ch.title}</span>
                        <span style={{ display: "block", fontSize: 11, color: "var(--ink-soft)", marginTop: 1 }}>{ch.topics.length} topics · {doneCount(ch.topics)} done</span>
                      </span>
                      <span style={{ display: "flex", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}><ChevronRight color="var(--text-muted)" /></span>
                    </button>
                    {open && (
                      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                        {ch.topics.map((t) => (
                          <button key={t.id} onClick={() => onOpenTopic?.(t.id)} className="press" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "var(--app-bg)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left" }}>
                            {t.locked
                              ? <span aria-label="Locked" style={{ width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="lock" size={15} color="var(--text-muted)" /></span>
                              : t.completed
                              ? <CheckCircle2 size={18} style={{ color: "var(--success-text)", flexShrink: 0 }} />
                              : <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--line)", flexShrink: 0 }} />}
                            <span style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                                {t.title}
                                {t.isFree && <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--success-text)", background: "var(--success)", borderRadius: 6, padding: "1px 6px" }}>FREE</span>}
                              </span>
                              <span style={{ display: "flex", gap: 9, marginTop: 4, fontSize: 10.5, color: "var(--ink-soft)" }}>
                                <span style={{ ...metaItem, opacity: t.hasVideo ? 1 : 0.35 }}><AppIcon name="video" size={11} />Video</span>
                                <span style={{ ...metaItem, opacity: t.hasNotes ? 1 : 0.35 }}><AppIcon name="file" size={11} />Notes</span>
                                <span style={{ ...metaItem, opacity: t.hasTest ? 1 : 0.35 }}><AppIcon name="clipboard" size={11} />Test</span>
                                <span style={metaItem}><AppIcon name="chat" size={11} />Doubts</span>
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
                {videos.length === 0 && upcomingClasses.length === 0 && recordings(pastClasses).length === 0 && <EmptyState icon="video" title="No videos yet" />}
                {videos.map((item) => (
                  <div key={item.id} style={row}>
                    <IconTile icon="video" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}><DoneLine done={item.done} /></p>
                    </div>
                    {item.body && <OpenBtn onClick={() => open(item.body)} />}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Notes" && (
              notes.length === 0 ? <EmptyState icon="file" title="No notes yet" /> :
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notes.map((item) => (
                  <div key={item.id} style={row}>
                    <IconTile icon="file" tone="teal" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}><DoneLine done={item.done} /></p>
                    </div>
                    {item.body && <OpenBtn onClick={() => open(item.body)} />}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Tests" && (
              tests.length === 0 ? <EmptyState icon="clipboard" title="No tests available" /> :
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tests.map((t) => (
                  <div key={t.id} style={{ ...card, padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <IconTile icon="clipboard" tone="purple" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 4px", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{t.title}</p>
                        <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--ink-soft)" }}>{t.questionCount} questions · {t.durationMin} min · {t.type}</p>
                        {t.myAttempts > 0 && t.bestScore != null && t.bestTotal ? (
                          <Pill tone="green">Best: {Math.round((t.bestScore / t.bestTotal) * 100)}%</Pill>
                        ) : null}
                      </div>
                      <button onClick={() => onStartTest(t.id)} style={{ ...primaryBtn, borderRadius: 12, padding: "10px 16px", fontSize: 12.5, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {t.myAttempts > 0 ? "Retake" : <>Start <AppIcon name="arrowRight" size={13} strokeWidth={2.5} /></>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Current Affairs" && onOpenCurrentAffairs && (
              <button onClick={onOpenCurrentAffairs} style={{ width: "100%", cursor: "pointer", textAlign: "left", border: "none", borderRadius: 18, padding: "16px", background: gradient, display: "flex", alignItems: "center", gap: 12, marginBottom: 12, boxShadow: "0 6px 18px rgba(11,92,255,0.25)" }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="newspaper" size={22} color="white" /></span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "white" }}>Daily Current Affairs notes</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>From The CLATians Journal, updated every day</span>
                </span>
                <AppIcon name="arrowRight" size={16} color="white" />
              </button>
            )}
            {activeTab === "Current Affairs" && currentAffairs.length > 0 && (
              currentAffairs.length === 0 ? <EmptyState icon="newspaper" title="No current affairs items yet" /> :
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentAffairs.map((item) => (
                  <div key={item.id} style={row}>
                    <IconTile icon="newspaper" tone="gold" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}><DoneLine done={item.done} /></p>
                    </div>
                    {item.body && <OpenBtn onClick={() => open(item.body)} />}
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
