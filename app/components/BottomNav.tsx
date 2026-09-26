"use client";

type Screen = "home" | "courses" | "study" | "doubts";
type Tab = Screen | "tests";

interface BottomNavProps {
  active: Screen;
  onChange: (screen: Screen) => void;
  /** Tests live on a detail page, so the tab hands off instead of switching screens. */
  onOpenTests?: () => void;
}

/* Solid glyphs — at 25px a filled shape stays legible where a stroke icon muddies. */
/** Home wears the brand's own initial — a bold "C" set in the app typeface. */
const HomeIcon = ({ c }: { c: string }) => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill={c}>
    <text
      x="12" y="12"
      textAnchor="middle" dominantBaseline="central"
      fontFamily="var(--font-poppins), sans-serif"
      fontSize="23" fontWeight={800}
      fill={c}
    >
      C
    </text>
  </svg>
);

const CoursesIcon = ({ c }: { c: string }) => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill={c}>
    <rect x="3" y="3" width="13" height="12" rx="3.5" />
    <rect x="7" y="8" width="14" height="13" rx="3.5" />
    <path d="M10.5 12.5h7M10.5 16.5h4.5" stroke="white" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

const StudyIcon = ({ c }: { c: string }) => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
    <path d="M8.2 3.4L6.4 5.2l2.2 2.9 1.5-1.4-1.9-3.3zM15.8 3.4l-1.9 3.3 1.5 1.4 2.2-2.9-1.8-1.8z" fill={c} />
    <path d="M11.2 8.6v11.9L4 18.1V8.6h7.2zM12.8 8.6H20v9.5l-7.2 2.4V8.6z" fill={c} />
  </svg>
);

const DoubtsIcon = ({ c }: { c: string }) => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill={c}>
    <path d="M9.8 4.6a4 4 0 0 1 5.6 0l4 4a4 4 0 0 1 0 5.6l-4 4a4 4 0 0 1-5.6 0l-4-4a4 4 0 0 1 0-5.6l4-4z" />
    <circle cx="10.2" cy="10.6" r="1.15" fill="white" />
    <circle cx="14.4" cy="10.6" r="1.15" fill="white" />
    <path d="M10 14.2c.8.9 3.2.9 4 0" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M20.2 2.6l.65 1.75 1.75.65-1.75.65-.65 1.75-.65-1.75-1.75-.65 1.75-.65.65-1.75z" />
  </svg>
);

const TestsIcon = ({ c }: { c: string }) => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill={c}>
    <path d="M9 2.6h6a1.6 1.6 0 0 1 0 3.2H9a1.6 1.6 0 0 1 0-3.2z" />
    <path d="M6.4 4.4h1.2a3 3 0 0 0 2.6 3h3.6a3 3 0 0 0 2.6-3h1.2A2.4 2.4 0 0 1 20 6.8v12.8a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 19.6V6.8a2.4 2.4 0 0 1 2.4-2.4z" />
    <path d="M8 15.5c2.4.6 4.4-.4 6.4-2.6" stroke="white" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    <path d="M13.4 18.2l4.9-4.9 1.7 1.7-4.9 4.9-2.2.5.5-2.2z" fill={c} stroke="white" strokeWidth="1.1" />
  </svg>
);

const tabs: { id: Tab; label: string; Icon: ({ c }: { c: string }) => React.ReactElement }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "courses", label: "Courses", Icon: CoursesIcon },
  { id: "study", label: "Study", Icon: StudyIcon },
  { id: "doubts", label: "Doubts", Icon: DoubtsIcon },
  { id: "tests", label: "Tests", Icon: TestsIcon },
];

export default function BottomNav({ active, onChange, onOpenTests }: BottomNavProps) {
  return (
    <div style={{
      flexShrink: 0,
      padding: "6px 10px calc(10px + env(safe-area-inset-bottom))",
      background: "var(--app-bg)",
      zIndex: 50,
    }}>
      <div style={{
        display: "flex",
        alignItems: "stretch",
        background: "var(--surface)",
        borderRadius: 999,
        padding: "6px",
        boxShadow: "0 6px 18px rgba(15,23,41,0.10)",
      }}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const color = isActive ? "var(--blue)" : "var(--ink)";
          return (
            <button
              key={tab.id}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => (tab.id === "tests" ? onOpenTests?.() : onChange(tab.id as Screen))}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                background: isActive ? "var(--blue-tint)" : "transparent",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
                padding: "9px 0 8px",
                transition: "background 0.2s",
              }}
            >
              <tab.Icon c={color} />
              <span style={{ fontSize: 11.5, fontWeight: isActive ? 600 : 500, color }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
