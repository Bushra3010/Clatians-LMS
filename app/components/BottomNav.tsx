"use client";

type Screen = "home" | "courses" | "study" | "ai";
type Tab = Screen | "profile";

interface BottomNavProps {
  active: Tab;
  onChange: (screen: Screen) => void;
  /** Profile is a sheet over the app, so the tab opens it instead of switching screens. */
  onOpenProfile?: () => void;
}

/* Solid glyphs — at 21px a filled shape stays legible where a stroke icon muddies. */
/** Home wears the brand's own initial — a bold "C" set in the app typeface. */
const HomeIcon = ({ c }: { c: string }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill={c}>
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
  <svg width="21" height="21" viewBox="0 0 24 24" fill={c}>
    <rect x="3" y="3" width="13" height="12" rx="3.5" />
    <rect x="7" y="8" width="14" height="13" rx="3.5" />
    <path d="M10.5 12.5h7M10.5 16.5h4.5" stroke="white" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

const StudyIcon = ({ c }: { c: string }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
    <path d="M8.2 3.4L6.4 5.2l2.2 2.9 1.5-1.4-1.9-3.3zM15.8 3.4l-1.9 3.3 1.5 1.4 2.2-2.9-1.8-1.8z" fill={c} />
    <path d="M11.2 8.6v11.9L4 18.1V8.6h7.2zM12.8 8.6H20v9.5l-7.2 2.4V8.6z" fill={c} />
  </svg>
);

/** AI Prep — a friendly bot face with a spark. */
const AiIcon = ({ c }: { c: string }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill={c}>
    <path d="M9.8 4.6a4 4 0 0 1 5.6 0l4 4a4 4 0 0 1 0 5.6l-4 4a4 4 0 0 1-5.6 0l-4-4a4 4 0 0 1 0-5.6l4-4z" />
    <circle cx="10.2" cy="10.6" r="1.15" fill="white" />
    <circle cx="14.4" cy="10.6" r="1.15" fill="white" />
    <path d="M10 14.2c.8.9 3.2.9 4 0" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <path d="M20.2 2.6l.65 1.75 1.75.65-1.75.65-.65 1.75-.65-1.75-1.75-.65 1.75-.65.65-1.75z" />
  </svg>
);

const ProfileIcon = ({ c }: { c: string }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill={c}>
    <circle cx="12" cy="7.6" r="4.4" />
    <path d="M3.6 20.2a8.4 8.4 0 0 1 16.8 0 1.3 1.3 0 0 1-1.3 1.3H4.9a1.3 1.3 0 0 1-1.3-1.3z" />
  </svg>
);

const tabs: { id: Tab; label: string; Icon: ({ c }: { c: string }) => React.ReactElement }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "courses", label: "Courses", Icon: CoursesIcon },
  { id: "study", label: "My Learning", Icon: StudyIcon },
  { id: "ai", label: "AI Prep", Icon: AiIcon },
  { id: "profile", label: "Profile", Icon: ProfileIcon },
];

export default function BottomNav({ active, onChange, onOpenProfile }: BottomNavProps) {
  return (
    // Floats over the content with no backdrop of its own — only the pill is solid.
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0,
      padding: "0 14px calc(10px + env(safe-area-inset-bottom))",
      pointerEvents: "none",
      // Above the Profile sheet (z 100), so the bar stays put there too.
      zIndex: 110,
    }}>
      <div style={{
        display: "flex",
        alignItems: "stretch",
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 999,
        padding: "4px",
        boxShadow: "0 8px 24px rgba(15,23,41,0.14)",
        pointerEvents: "auto",
      }}>
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          const color = isActive ? "var(--blue)" : "var(--ink)";
          return (
            <button
              key={tab.id}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => (tab.id === "profile" ? onOpenProfile?.() : onChange(tab.id as Screen))}
              style={{
                flex: 1,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2,
                background: isActive ? "var(--blue-tint)" : "transparent",
                border: "none",
                borderRadius: 999,
                cursor: "pointer",
                padding: "6px 0 5px",
                transition: "background 0.2s",
              }}
            >
              <tab.Icon c={color} />
              <span style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, color }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
