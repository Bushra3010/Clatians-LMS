"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import HomeScreen from "./components/HomeScreen";
import CoursesScreen, { type CatalogItem } from "./components/CoursesScreen";
import StudyScreen from "./components/StudyScreen";
import DoubtsScreen from "./components/DoubtsScreen";
import ProfileScreen, { type ProfileMenuKey } from "./components/ProfileScreen";

import ContentListPage, { type ContentItem } from "./components/detail/ContentListPage";
import AiPracticePage from "./components/detail/AiPracticePage";
import SlotsPage, { type SlotOpen, type SlotBooking } from "./components/detail/SlotsPage";
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
import HelpSupportPage from "./components/detail/HelpSupportPage";
import SettingsPage from "./components/detail/SettingsPage";

import { logoutAction } from "./lib/session-actions";
import { markNotificationsReadAction } from "./lib/notification-actions";
import { toggleContentDoneAction } from "./lib/progress-actions";
import { toggleSavedAction } from "./lib/saved-actions";
import { joinClassAction } from "./lib/class-actions";
import { askDoubtAction } from "./lib/doubt-actions";
import { payForCourseAction } from "./lib/payment-actions";
import { startTestAction, submitAttemptAction, type StartResult, type SubmitResult } from "./lib/test-actions";
import type { StudentResources } from "./lib/resource-types";

export type DoubtItem = {
  id: string;
  subject: string;
  body: string;
  status: string;
  answer: string;
  teacher: string | null;
  createdAt: string;
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
type DetailPage = "videos" | "notes" | "practice" | "ai-practice" | "current-affairs" | "toppers" | "whats-new" | "tips" | "live-classes" | "watch-class" | "slots" | "tests" | "test-take" | "test-result" | "notifications" | "progress" | "leaderboard" | "clat-tools" | "saved" | "help" | "settings" | null;

const TOPBAR_H = 90;
const BOTTOMNAV_H = 70;

interface StudentAppProps {
  upcomingClasses: LiveClassItem[];
  pastClasses: LiveClassItem[];
  attendancePct: number | null;
  content: ContentBuckets;
  doubts: DoubtItem[];
  profile: StudentProfile;
  catalog: CatalogItem[];
  tests: TestListItem[];
  notifications: NotificationItem[];
  unreadCount: number;
  progress: StudentProgress;
  engagement: Engagement;
  saved: SavedItem[];
  savedTipKeys: string[];
  savedVocabKeys: string[];
  resources: StudentResources;
  slots: { open: SlotOpen[]; mine: SlotBooking[] };
}

export default function StudentApp({ upcomingClasses, pastClasses, attendancePct, content, doubts, profile, catalog, tests, notifications, unreadCount, progress, engagement, saved, savedTipKeys, savedVocabKeys, resources, slots }: StudentAppProps) {
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState<Screen>("home");
  const [showProfile, setShowProfile] = useState(false);
  const [detailPage, setDetailPage] = useState<DetailPage>(null);
  const [watchTarget, setWatchTarget] = useState<WatchTarget | null>(null);
  const [testSession, setTestSession] = useState<Extract<StartResult, { ok: true }> | null>(null);
  const [testResult, setTestResult] = useState<{ title: string; result: Extract<SubmitResult, { ok: true }> } | null>(null);
  const [coursesTab, setCoursesTab] = useState<"all" | "mine">("all");

  useEffect(() => {
    const el = document.getElementById("screen-content");
    if (el) el.scrollTop = 0;
  }, [activeScreen, detailPage]);

  const openDetail = (page: DetailPage) => setDetailPage(page);
  const closeDetail = () => setDetailPage(null);

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
  // new tab for non-YouTube links). Live joins also record attendance.
  const openClass = (cls: LiveClassItem | undefined, kind: "live" | "recording") => {
    if (!cls) return;
    const url = kind === "live" ? cls.joinUrl : cls.recordingUrl ?? "";
    if (kind === "live") {
      joinClassAction(cls.id).then(() => router.refresh());
    }
    const ytId = youtubeId(url);
    if (ytId) {
      setWatchTarget({
        title: cls.title,
        subtitle: [cls.subject, cls.teacher].filter(Boolean).join(" · "),
        ytId,
        notes: cls.notes,
        isLive: kind === "live" && cls.status === "live",
      });
      openDetail("watch-class");
    } else if (url) {
      window.open(url, "_blank", "noopener");
    }
  };

  const allClasses = [...upcomingClasses, ...pastClasses];
  const handleJoinClass = (id: string) => openClass(allClasses.find((c) => c.id === id), "live");
  const handleWatchRecording = (cls: LiveClassItem) => openClass(cls, "recording");

  const handleAskDoubt = async (subject: string, body: string) => {
    await askDoubtAction(subject, body);
    router.refresh(); // re-fetch server props so the new doubt shows
  };

  const handleEnroll = async (courseId: string, method: string) => {
    const res = await payForCourseAction(courseId, method);
    if (res.ok) router.refresh(); // unlock the batch's content/classes
    return res;
  };

  const handleStartTest = async (testId: string): Promise<StartResult> => {
    const res = await startTestAction(testId);
    if (res.ok) {
      setTestSession(res);
      openDetail("test-take");
    }
    return res;
  };

  const handleSubmitTest = async (answers: Record<string, string>) => {
    if (!testSession) return;
    const res = await submitAttemptAction(testSession.attemptId, answers);
    if (res.ok) {
      setTestResult({ title: testSession.title, result: res });
      openDetail("test-result");
      router.refresh();
    }
  };

  const openNotifications = () => {
    openDetail("notifications");
    if (unreadCount > 0) markNotificationsReadAction().then(() => router.refresh());
  };

  const handleProfileMenu = (key: ProfileMenuKey) => {
    setShowProfile(false);
    switch (key) {
      case "progress": openDetail("progress"); break;
      case "courses": setDetailPage(null); setCoursesTab("mine"); setActiveScreen("courses"); break;
      case "tests": openDetail("tests"); break;
      case "saved": openDetail("saved"); break;
      case "achievements": openDetail("leaderboard"); break;
      case "notifications": openNotifications(); break;
      case "help": openDetail("help"); break;
      case "settings": openDetail("settings"); break;
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
    <div style={{ minHeight:"100vh", background:"#E0D7C7", display:"flex", alignItems:"flex-start", justifyContent:"center" }}>
      <div style={{ width:390, minHeight:"100vh", position:"relative", background:"#F7F3EA", overflow:"hidden" }}>

        {showProfile && (
          <ProfileScreen
            profile={profile}
            onLogout={() => { logoutAction(); }}
            onClose={() => setShowProfile(false)}
            onMenu={handleProfileMenu}
          />
        )}

        {/* Top Bar — always visible */}
        <TopBar courseName={profile.batches[0] ?? "CLAT 2026"} onProfileClick={() => setShowProfile(true)} onLogoClick={() => { setDetailPage(null); setActiveScreen("home"); }} onBellClick={openNotifications} unreadCount={unreadCount} onChangeCourse={() => { setDetailPage(null); setCoursesTab("all"); setActiveScreen("courses"); }} />

        {/* Scrollable content */}
        <div
          id="screen-content"
          style={{
            overflowY: "auto",
            height: `calc(100vh - ${TOPBAR_H}px - ${showNav ? BOTTOMNAV_H : 0}px)`,
            WebkitOverflowScrolling: "touch",
          }}
          className="no-scroll"
        >
          {/* ── Detail pages (no bottom nav) ── */}
          {detailPage === "videos"          && <ContentListPage onBack={closeDetail} type="video" items={content.video} onToggleDone={handleToggleDone} />}
          {detailPage === "notes"           && <ContentListPage onBack={closeDetail} type="notes" items={content.notes} onToggleDone={handleToggleDone} />}
          {detailPage === "practice"        && <ContentListPage onBack={closeDetail} type="practice" items={content.practice} onToggleDone={handleToggleDone} />}
          {detailPage === "ai-practice"     && <AiPracticePage onBack={closeDetail} />}
          {detailPage === "slots"           && <SlotsPage onBack={closeDetail} openSlots={slots.open} myBookings={slots.mine} />}
          {detailPage === "current-affairs" && <ContentListPage onBack={closeDetail} type="current-affairs" items={content["current-affairs"]} onToggleDone={handleToggleDone} />}
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
            <TestTakePage session={testSession} onSubmit={handleSubmitTest} onExit={() => openDetail("tests")} />
          )}
          {detailPage === "test-result" && testResult && (
            <TestResultPage title={testResult.title} result={testResult.result} onBack={() => openDetail("tests")} />
          )}
          {detailPage === "notifications" && (
            <NotificationsPage onBack={closeDetail} items={notifications} />
          )}
          {detailPage === "progress" && (
            <ProgressPage onBack={closeDetail} progress={progress} />
          )}
          {detailPage === "leaderboard" && (
            <LeaderboardPage onBack={closeDetail} engagement={engagement} />
          )}
          {detailPage === "clat-tools" && (
            <ClatToolsPage
              onBack={closeDetail}
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
          {detailPage === "help" && <HelpSupportPage onBack={closeDetail} />}
          {detailPage === "settings" && (
            <SettingsPage onBack={closeDetail} profile={profile} onLogout={() => { logoutAction(); }} />
          )}

          {/* ── Main screens ── */}
          {!detailPage && activeScreen === "home" && (
            <HomeScreen
              onNavigate={(s) => setActiveScreen(s as Screen)}
              onToolClick={handleToolClick}
              onKnowMoreClick={handleKnowMoreClick}
              liveClasses={upcomingClasses}
              onJoinClass={handleJoinClass}
              onSeeAllClasses={() => openDetail("live-classes")}
              onOpenTests={() => openDetail("tests")}
              onOpenStories={() => openDetail("toppers")}
              stories={resources.stories}
            />
          )}
          {!detailPage && activeScreen === "courses" && (
            <CoursesScreen catalog={catalog} onEnroll={handleEnroll} initialTab={coursesTab} />
          )}
          {!detailPage && activeScreen === "study"   && (
            <StudyScreen
              videos={content.video}
              notes={content.notes}
              currentAffairs={content["current-affairs"]}
              tests={tests}
              progress={progress}
              savedVocabKeys={savedVocabKeys}
              onStartTest={handleStartTest}
              onToggleVocab={(word, meaning) => handleToggleSave("vocab", word, word, meaning)}
              onOpenTools={() => openDetail("clat-tools")}
              vocab={resources.vocab}
            />
          )}
          {!detailPage && activeScreen === "doubts"  && (
            <DoubtsScreen doubts={doubts} onAskDoubt={handleAskDoubt} />
          )}
        </div>

        {/* Bottom Nav — hidden on detail pages */}
        {showNav && (
          <BottomNav
            active={activeScreen}
            onChange={(s) => { setDetailPage(null); setActiveScreen(s); }}
          />
        )}
      </div>
    </div>
  );
}
