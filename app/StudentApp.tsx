"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import HomeScreen from "./components/HomeScreen";
import CoursesScreen, { type CatalogItem } from "./components/CoursesScreen";
import PracticePage from "./components/detail/PracticePage";
import StudyScreen, { type SyllabusSubject } from "./components/StudyScreen";
import DoubtsScreen from "./components/DoubtsScreen";
import ProfileScreen, { type ProfileMenuKey } from "./components/ProfileScreen";

import ContentListPage, { type ContentItem } from "./components/detail/ContentListPage";
import AiPracticePage from "./components/detail/AiPracticePage";
import SlotsPage, { type SlotOpen, type SlotBooking } from "./components/detail/SlotsPage";
import MyPaymentsPage, { type PaymentItem } from "./components/detail/MyPaymentsPage";
import StudyPlannerPage from "./components/detail/StudyPlannerPage";
import type { StudyTask } from "./lib/study-actions";
import NotesPage from "./components/detail/NotesPage";
import type { Note } from "./lib/note-actions";
import ReferPage, { type Referral } from "./components/detail/ReferPage";
import TopperStoriesPage from "./components/detail/TopperStoriesPage";
import WhatsNewPage from "./components/detail/WhatsNewPage";
import TipsTricksPage from "./components/detail/TipsTricksPage";
import LiveClassesPage, { type LiveClassItem } from "./components/detail/LiveClassesPage";
import ClassWatchPage, { youtubeId, type WatchTarget } from "./components/detail/ClassWatchPage";
import { TestSeriesPage, TestTakePage, TestResultPage, type TestListItem } from "./components/detail/TestPages";
import NotificationsPage, { type NotificationItem } from "./components/detail/NotificationsPage";
import ProgressPage, { type StudentProgress } from "./components/detail/ProgressPage";
import LeaderboardPage, { type Engagement } from "./components/detail/LeaderboardPage";
import ClatToolsPage from "./components/detail/ClatToolsPage";
import SavedItemsPage, { type SavedItem } from "./components/detail/SavedItemsPage";
import CertificatePage, { type CertificateItem } from "./components/detail/CertificatePage";
import HelpSupportPage from "./components/detail/HelpSupportPage";
import SettingsPage from "./components/detail/SettingsPage";
import TopicPage from "./components/detail/TopicPage";

import { logoutAction, selectCourseAction, type NotifyPrefs } from "./lib/session-actions";
import { markNotificationsReadAction } from "./lib/notification-actions";
import { toggleContentDoneAction } from "./lib/progress-actions";
import { toggleSavedAction } from "./lib/saved-actions";
import { joinClassAction } from "./lib/class-actions";
import { askDoubtAction, postDoubtMessageAction, type DoubtMessage } from "./lib/doubt-actions";
import { payForCourseAction, payForBatchAction } from "./lib/payment-actions";
import { startTestAction, submitAttemptAction, type StartResult, type SubmitResult } from "./lib/test-actions";
import { getTopicAction, setTopicDoneAction, askTopicDoubtAction, type TopicDetail } from "./lib/topic-actions";
import type { StudentResources } from "./lib/resource-types";
import { pushBack, goBack } from "./lib/back-stack";

export type DoubtItem = {
  id: string;
  subject: string;
  body: string;
  status: string;
  answer: string;
  teacher: string | null;
  createdAt: string;
  messages: DoubtMessage[];
};

export type StudentProfile = {
  name: string;
  email: string;
  batches: string[];
  contentCount: number;
  attendancePct: number | null;
  doubtsAsked: number;
};

type ContentBuckets = {
  video: ContentItem[];
  notes: ContentItem[];
  practice: ContentItem[];
  "current-affairs": ContentItem[];
};

type Screen = "home" | "courses" | "study" | "doubts";
type DetailPage = "videos" | "notes" | "practice" | "practice-material" | "ai-practice" | "current-affairs" | "toppers" | "whats-new" | "tips" | "live-classes" | "watch-class" | "slots" | "planner" | "my-notes" | "refer" | "tests" | "test-take" | "test-result" | "notifications" | "progress" | "leaderboard" | "clat-tools" | "ca-quiz" | "saved" | "payments" | "certificates" | "help" | "settings" | "topic" | null;

// Phone-app shell: fluid width up to a phablet cap, centered on desktop.
const SHELL_MAX_W = 430;

interface StudentAppProps {
  upcomingClasses: LiveClassItem[];
  pastClasses: LiveClassItem[];
  attendancePct: number | null;
  content: ContentBuckets;
  doubts: DoubtItem[];
  profile: StudentProfile;
  catalog: CatalogItem[];
  tests: TestListItem[];
  practicePapers: TestListItem[];
  notifications: NotificationItem[];
  unreadCount: number;
  progress: StudentProgress;
  engagement: Engagement;
  saved: SavedItem[];
  savedTipKeys: string[];
  savedVocabKeys: string[];
  resources: StudentResources;
  slots: { open: SlotOpen[]; mine: SlotBooking[] };
  payments: PaymentItem[];
  tasks: StudyTask[];
  notes: Note[];
  referral: Referral;
  notifyPrefs: NotifyPrefs;
  certificates: CertificateItem[];
  syllabus: SyllabusSubject[];
  /** The course heading the home screen — null until one is chosen or bought. */
  currentCourse: { id: string; name: string; purchased: boolean } | null;
}

export default function StudentApp({ upcomingClasses, pastClasses, attendancePct, content, doubts, profile, catalog, tests, practicePapers, notifications, unreadCount, progress, engagement, saved, savedTipKeys, savedVocabKeys, resources, slots, payments, tasks, notes, referral, notifyPrefs, certificates, syllabus, currentCourse }: StudentAppProps) {
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  const [showProfile, setShowProfile] = useState(false);
  const [detailPage, setDetailPage] = useState<DetailPage>(null);
  const [watchTarget, setWatchTarget] = useState<WatchTarget | null>(null);
  const [testSession, setTestSession] = useState<Extract<StartResult, { ok: true }> | null>(null);
  const [testResult, setTestResult] = useState<{ title: string; result: Extract<SubmitResult, { ok: true }> } | null>(null);
  const [coursesTab, setCoursesTab] = useState<"all" | "mine">("all");
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  // The Study tab's open subject/chapter, kept here so a student returning
  // from a topic lands back on the same chapter.
  const [syllabusNav, setSyllabusNav] = useState<{ subjectId: string | null; chapterId: string | null }>({ subjectId: null, chapterId: null });
  // Where a test was opened from, so Exit / Back return there instead of the test list.
  const [testOrigin, setTestOrigin] = useState<"tests" | "topic">("tests");

  useEffect(() => {
    const el = document.getElementById("screen-content");
    if (el) el.scrollTop = 0;
  }, [activeScreen, detailPage]);

  // ── Navigation ──
  // Every screen change goes through navigate(), which records how to undo it
  // (see back-stack.ts). That keeps the phone's back gesture inside the app
  // instead of dropping the student back on the login page.
  type Nav = { screen: Screen; detail: DetailPage; profile: boolean };
  const navRef = useRef<Nav>({ screen: activeScreen, detail: detailPage, profile: showProfile });
  const restore = (n: Nav) => {
    navRef.current = n;
    setActiveScreen(n.screen);
    setDetailPage(n.detail);
    setShowProfile(n.profile);
  };
  /** Go somewhere new. "replace" swaps the current step instead of adding one. */
  const navigate = (next: Partial<Nav>, mode: "push" | "replace" = "push") => {
    const prev = navRef.current;
    const target = { ...prev, ...next };
    if (target.screen === prev.screen && target.detail === prev.detail && target.profile === prev.profile) return;
    if (mode === "push") pushBack(() => restore(prev));
    restore(target);
  };
  const back = () => goBack(() => restore({ ...navRef.current, detail: null, profile: false }));

  const openDetail = (page: DetailPage) => navigate({ detail: page, profile: false });
  const closeDetail = back;
  const goScreen = (screen: Screen) => navigate({ screen, detail: null, profile: false });

  const handleToolClick = (tool: string) => {
    const map: Record<string, DetailPage> = {
      "videos": "videos",
      "notes": "notes",
      "practice": "practice",
      "ai-practice": "ai-practice",
      "current-affairs": "current-affairs",
      "slots": "slots",
    };
    if (map[tool]) openDetail(map[tool]);
  };

  const handleKnowMoreClick = (item: string) => {
    const map: Record<string, DetailPage> = {
      "study-tools": "clat-tools", // real CLAT tools (predictor / CA quiz / vocab)
      "toppers": "leaderboard", // real leaderboard replaces the mock toppers page
      "whats-new": "whats-new",
      "tips": "tips",
    };
    if (map[item]) openDetail(map[item]);
  };

  // Open a class: embed the YouTube stream/recording in-app (falling back to a
  // new tab for non-YouTube links), with the private teacher chat underneath.
  // Joining a class that is live records attendance.
  const openClass = async (cls: LiveClassItem | undefined, kind: "live" | "recording") => {
    if (!cls) return;
    const url = kind === "live" ? cls.joinUrl : cls.recordingUrl ?? "";
    const ytId = youtubeId(url);
    if (!ytId && url) {
      window.open(url, "_blank", "noopener");
    }
    const joined = kind === "live" && cls.status === "live" ? await joinClassAction(cls.id) : { attended: false };
    if (joined.attended) router.refresh();
    if (ytId) {
      setWatchTarget({
        title: cls.title,
        subtitle: [cls.subject, cls.teacher].filter(Boolean).join(" · "),
        ytId,
        notes: cls.notes,
        isLive: kind === "live" && cls.status === "live",
        classId: cls.id,
        attended: joined.attended || cls.attended,
      });
      openDetail("watch-class");
    }
  };

  const allClasses = [...upcomingClasses, ...pastClasses];
  const handleJoinClass = (id: string) => openClass(allClasses.find((c) => c.id === id), "live");
  const handleWatchRecording = (cls: LiveClassItem) => openClass(cls, "recording");

  const handleAskDoubt = async (subject: string, body: string) => {
    await askDoubtAction(subject, body);
    router.refresh(); // re-fetch server props so the new doubt shows
  };

  const handleFollowUp = async (doubtId: string, body: string) => {
    const res = await postDoubtMessageAction(doubtId, body);
    if (res.ok) router.refresh();
    return res;
  };

  const handleEnroll = async (courseId: string, method: string) => {
    const res = await payForCourseAction(courseId, method);
    if (res.ok) router.refresh(); // unlock the batch's content/classes
    return res;
  };

  const handleEnrollBatch = async (batchId: string, method: string) => {
    const res = await payForBatchAction(batchId, method);
    if (res.ok) router.refresh(); // unlock the batch's course content/classes
    return res;
  };

  const handleStartTest = async (testId: string, origin: "tests" | "topic" = "tests"): Promise<StartResult> => {
    const res = await startTestAction(testId);
    if (res.ok) {
      setTestOrigin(origin);
      setTestSession(res);
      openDetail("test-take");
    }
    return res;
  };

  // Re-read the open topic after anything that changes it (a doubt, a tick, a test).
  const reloadTopic = async (id: string) => {
    const res = await getTopicAction(id);
    if (res.ok) setTopic(res.topic);
  };

  const handleOpenTopic = async (id: string) => {
    const res = await getTopicAction(id);
    if (res.ok) {
      setTopic(res.topic);
      openDetail("topic");
    } else {
      alert(res.error);
    }
  };

  // The result screen replaced the test-taking step, so one step back lands
  // wherever the test was started from — the Test Series list or the topic.
  const leaveTest = () => {
    if (testOrigin === "topic" && topic) reloadTopic(topic.id);
    back();
  };

  const handleSubmitTest = async (answers: Record<string, string>) => {
    if (!testSession) return;
    const res = await submitAttemptAction(testSession.attemptId, answers);
    if (res.ok) {
      setTestResult({ title: testSession.title, result: res });
      navigate({ detail: "test-result" }, "replace");
      router.refresh();
    }
  };

  const openNotifications = () => {
    openDetail("notifications");
    if (unreadCount > 0) markNotificationsReadAction().then(() => router.refresh());
  };

  const handleProfileMenu = (key: ProfileMenuKey) => {
    // Leaving the profile sheet for a page replaces the sheet's step, so Back
    // from that page returns to the screen underneath, not to the sheet.
    const openFromProfile = (page: DetailPage) => navigate({ detail: page, profile: false }, "replace");
    switch (key) {
      case "progress": openFromProfile("progress"); break;
      case "planner": openFromProfile("planner"); break;
      case "notes": openFromProfile("my-notes"); break;
      case "ai-tutor": router.push("/tutor"); break;
      case "refer": openFromProfile("refer"); break;
      case "courses": setCoursesTab("mine"); navigate({ screen: "courses", detail: null, profile: false }, "replace"); break;
      case "browse-courses": setCoursesTab("all"); navigate({ screen: "courses", detail: null, profile: false }, "replace"); break;
      case "tests": openFromProfile("tests"); break;
      case "saved": openFromProfile("saved"); break;
      case "payments": openFromProfile("payments"); break;
      case "certificates": openFromProfile("certificates"); break;
      case "achievements": openFromProfile("leaderboard"); break;
      case "notifications":
        navigate({ detail: "notifications", profile: false }, "replace");
        if (unreadCount > 0) markNotificationsReadAction().then(() => router.refresh());
        break;
      case "help": openFromProfile("help"); break;
      case "settings": openFromProfile("settings"); break;
    }
  };

  const handleToggleDone = async (contentId: string) => {
    await toggleContentDoneAction(contentId);
    router.refresh();
  };

  const handleToggleSave = async (kind: string, key: string, title = "", subtitle = "") => {
    await toggleSavedAction(kind, key, title, subtitle);
    router.refresh();
  };

  const showNav = !detailPage;

  return (
    // Pinned to the viewport so the page itself never scrolls — only #screen-content does.
    // A scrolling document lets mobile Chrome slide its URL bar, and the bottom nav jumps with it.
    <div style={{ position:"fixed", inset:0, background:"var(--app-bg)", display:"flex", alignItems:"stretch", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:SHELL_MAX_W, height:"100%", display:"flex", flexDirection:"column", position:"relative", background:"var(--app-bg)", overflow:"hidden", boxShadow:"var(--shadow-float)" }}>

        {showProfile && (
          <ProfileScreen
            profile={profile}
            onLogout={() => { logoutAction(); }}
            onClose={back}
            onMenu={handleProfileMenu}
          />
        )}

        {/* Top Bar — hidden while taking a test, which needs the whole screen */}
        {detailPage !== "test-take" && <TopBar course={currentCourse} onProfileClick={() => navigate({ profile: true })} onLogoClick={() => goScreen("home")} onBellClick={openNotifications} unreadCount={unreadCount} onChangeCourse={() => { setCoursesTab("all"); goScreen("courses"); }} />}

        {/* Scrollable content */}
        <div
          id="screen-content"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
          className="no-scroll"
        >
          {/* ── Detail pages (no bottom nav) ── */}
          {detailPage === "videos"          && <ContentListPage onBack={closeDetail} type="video" items={content.video} onToggleDone={handleToggleDone} />}
          {detailPage === "notes"           && <ContentListPage onBack={closeDetail} type="notes" items={content.notes} onToggleDone={handleToggleDone} />}
          {detailPage === "practice" && (
            <PracticePage
              onBack={closeDetail}
              papers={practicePapers}
              material={content.practice}
              onStart={handleStartTest}
              onOpenMaterial={() => openDetail("practice-material")}
              onGenerate={() => openDetail("ai-practice")}
            />
          )}
          {detailPage === "practice-material" && <ContentListPage onBack={back} type="practice" items={content.practice} onToggleDone={handleToggleDone} />}
          {detailPage === "ai-practice"     && <AiPracticePage onBack={closeDetail} />}
          {detailPage === "slots"           && <SlotsPage onBack={closeDetail} openSlots={slots.open} myBookings={slots.mine} />}
          {detailPage === "payments"        && <MyPaymentsPage onBack={closeDetail} payments={payments} studentName={profile.name} studentEmail={profile.email} />}
          {detailPage === "planner"         && <StudyPlannerPage onBack={closeDetail} initialTasks={tasks} />}
          {detailPage === "my-notes"        && <NotesPage onBack={closeDetail} initialNotes={notes} />}
          {detailPage === "refer"           && <ReferPage onBack={closeDetail} referral={referral} />}
          {detailPage === "current-affairs" && (
            <ContentListPage
              onBack={closeDetail}
              type="current-affairs"
              items={content["current-affairs"]}
              onToggleDone={handleToggleDone}
              banner={resources.caq.length > 0 ? (
                <button onClick={() => openDetail("ca-quiz")} style={{
                  width: "100%", marginBottom: 14, cursor: "pointer", textAlign: "left",
                  background: "linear-gradient(135deg,var(--blue-dark),var(--blue))",
                  border: "none", borderRadius: 16, padding: "15px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  boxShadow: "0 6px 18px rgba(61,36,17,0.25)",
                }}>
                  <span style={{ fontSize: 26 }}>🗞</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "white" }}>Today&apos;s Current Affairs quiz</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                      {resources.caq.length} questions · instant answers
                    </span>
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>→</span>
                </button>
              ) : null}
            />
          )}
          {detailPage === "toppers"         && <TopperStoriesPage onBack={closeDetail} stories={resources.stories} />}
          {detailPage === "whats-new"       && <WhatsNewPage onBack={closeDetail} updates={resources.updates} />}
          {detailPage === "tips"            && (
            <TipsTricksPage
              onBack={closeDetail}
              tips={resources.tips}
              savedKeys={savedTipKeys}
              onToggleSave={(key, title, subtitle) => handleToggleSave("tip", key, title, subtitle)}
            />
          )}
          {detailPage === "live-classes"    && (
            <LiveClassesPage
              onBack={closeDetail}
              upcoming={upcomingClasses}
              past={pastClasses}
              attendancePct={attendancePct}
              onJoin={handleJoinClass}
              onWatchRecording={handleWatchRecording}
            />
          )}
          {detailPage === "watch-class" && watchTarget && (
            <ClassWatchPage onBack={closeDetail} target={watchTarget} />
          )}
          {detailPage === "tests" && (
            <TestSeriesPage onBack={closeDetail} tests={tests} onStart={handleStartTest} />
          )}
          {detailPage === "test-take" && testSession && (
            <TestTakePage session={testSession} onSubmit={handleSubmitTest} onExit={leaveTest} />
          )}
          {detailPage === "test-result" && testResult && (
            <TestResultPage title={testResult.title} result={testResult.result} onBack={leaveTest} />
          )}
          {detailPage === "notifications" && (
            <NotificationsPage onBack={closeDetail} items={notifications} />
          )}
          {detailPage === "progress" && (
            <ProgressPage onBack={closeDetail} progress={progress} student={{ name: profile.name, batch: profile.batches[0] ?? "", attendancePct: profile.attendancePct }} />
          )}
          {detailPage === "leaderboard" && (
            <LeaderboardPage onBack={closeDetail} engagement={engagement} />
          )}
          {(detailPage === "clat-tools" || detailPage === "ca-quiz") && (
            <ClatToolsPage
              onBack={back}
              initialTab={detailPage === "ca-quiz" ? "quiz" : "predictor"}
              vocab={resources.vocab}
              caq={resources.caq}
              nlus={resources.nlus}
              savedVocabKeys={savedVocabKeys}
              onToggleSave={(word, meaning) => handleToggleSave("vocab", word, word, meaning)}
            />
          )}
          {detailPage === "saved" && (
            <SavedItemsPage
              onBack={closeDetail}
              items={saved}
              onRemove={(kind, key) => handleToggleSave(kind, key)}
              onOpen={(kind) => openDetail(kind === "vocab" ? "clat-tools" : "tips")}
            />
          )}
          {detailPage === "certificates" && (
            <CertificatePage onBack={closeDetail} certificates={certificates} studentName={profile.name} />
          )}
          {detailPage === "topic" && topic && (
            <TopicPage
              key={topic.id}
              topic={topic}
              onBack={closeDetail}
              onStartTest={(testId) => handleStartTest(testId, "topic")}
              onAskDoubt={async (body) => {
                const res = await askTopicDoubtAction(topic.id, body);
                if (res.ok) await reloadTopic(topic.id);
                return res;
              }}
              onToggleDone={async (done) => {
                await setTopicDoneAction(topic.id, done);
                await reloadTopic(topic.id);
                router.refresh();
              }}
            />
          )}
          {detailPage === "help" && <HelpSupportPage onBack={closeDetail} />}
          {detailPage === "settings" && (
            <SettingsPage onBack={closeDetail} profile={profile} initialPrefs={notifyPrefs} onLogout={() => { logoutAction(); }} />
          )}

          {/* ── Main screens ── */}
          {!detailPage && activeScreen === "home" && (
            <HomeScreen
              onNavigate={(s) => goScreen(s as Screen)}
              onLogoClick={() => goScreen("home")}
              onToolClick={handleToolClick}
              onKnowMoreClick={handleKnowMoreClick}
              nextBooking={slots.mine[0] ? { teacher: slots.mine[0].teacher, startAt: slots.mine[0].startAt } : null}
              onOpenTests={() => openDetail("tests")}
              onOpenTutor={() => router.push("/tutor")}
              onOpenStories={() => openDetail("toppers")}
              stories={resources.stories}
            />
          )}
          {!detailPage && activeScreen === "courses" && (
            <CoursesScreen
              catalog={catalog}
              onEnroll={handleEnroll}
              onEnrollBatch={handleEnrollBatch}
              onOpenContent={(key) => openDetail(key)}
              onOpenTests={() => openDetail("tests")}
              onOpenStudy={() => goScreen("study")}
              selectedCourseId={currentCourse?.id ?? null}
              onSelectCourse={async (id) => {
                await selectCourseAction(id);
                router.refresh();
              }}
              initialTab={coursesTab}
            />
          )}
          {!detailPage && activeScreen === "study"   && (
            <StudyScreen
              videos={content.video}
              notes={content.notes}
              currentAffairs={content["current-affairs"]}
              tests={tests}
              progress={progress}
              onStartTest={handleStartTest}
              upcomingClasses={upcomingClasses}
              pastClasses={pastClasses}
              onJoinClass={handleJoinClass}
              onWatchRecording={handleWatchRecording}
              subjects={syllabus}
              onOpenTopic={handleOpenTopic}
              syllabusNav={syllabusNav}
              onSyllabusNav={setSyllabusNav}
            />
          )}
          {!detailPage && activeScreen === "doubts"  && (
            <DoubtsScreen doubts={doubts} onAskDoubt={handleAskDoubt} onFollowUp={handleFollowUp} />
          )}
        </div>

        {/* Bottom Nav — hidden on detail pages */}
        {showNav && (
          <BottomNav
            active={activeScreen}
            onChange={(s) => goScreen(s)}
            onOpenTests={() => openDetail("tests")}
          />
        )}
      </div>
    </div>
  );
}
