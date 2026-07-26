"use client";

type Screen = "home" | "courses" | "study" | "doubts";

interface BottomNavProps {
  active: Screen;
  onChange: (screen: Screen) => void;
}

const NavHomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
      fill={active ? "#3D2411" : "none"}
      stroke={active ? "#3D2411" : "#9CA3AF"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NavCoursesIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="3"
      fill={active ? "#F6ECD9" : "none"}
      stroke={active ? "#3D2411" : "#9CA3AF"}
      strokeWidth="1.8" />
    <path d="M8 8h8M8 12h8M8 16h5"
      stroke={active ? "#3D2411" : "#9CA3AF"}
      strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const NavStudyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      fill="white" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

const NavDoubtsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      fill={active ? "#F6ECD9" : "none"}
      stroke={active ? "#3D2411" : "#9CA3AF"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8.5" cy="11" r="1" fill={active ? "#3D2411" : "#9CA3AF"} />
    <circle cx="12" cy="11" r="1" fill={active ? "#3D2411" : "#9CA3AF"} />
    <circle cx="15.5" cy="11" r="1" fill={active ? "#3D2411" : "#9CA3AF"} />
  </svg>
);

const tabs = [
  { id: "home" as Screen, label: "Home" },
  { id: "courses" as Screen, label: "Courses" },
  { id: "study" as Screen, label: "Study" },
  { id: "doubts" as Screen, label: "Doubts" },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      width: "390px",
      height: "70px",
      background: "white",
      borderTop: "1.5px solid #F0F0F5",
      display: "flex",
      alignItems: "stretch",
      zIndex: 50,
      boxShadow: "0 -6px 24px rgba(0,0,0,0.10)",
    }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const isStudy = tab.id === "study";
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px 0 8px",
              position: "relative",
            }}
          >
            {/* Active indicator line */}
            {isActive && !isStudy && (
              <div style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 28,
                height: 3,
                borderRadius: "0 0 4px 4px",
                background: "linear-gradient(90deg, #3D2411, #8A5A08)",
              }} />
            )}

            {isStudy ? (
              <div style={{
                background: "linear-gradient(135deg, #3D2411 0%, #5C3A00 100%)",
                borderRadius: "16px",
                padding: "8px 18px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                marginTop: "-14px",
                boxShadow: "0 6px 18px rgba(61,36,17,0.40)",
                minWidth: 72,
              }}>
                <NavStudyIcon />
                <span style={{ fontSize: "10px", fontWeight: 700, color: "white", letterSpacing: "0.3px" }}>
                  Study
                </span>
              </div>
            ) : (
              <>
                <div style={{
                  width: 36, height: 36,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 10,
                  background: isActive ? "#F6ECD9" : "transparent",
                  transition: "background 0.2s",
                }}>
                  {tab.id === "home" && <NavHomeIcon active={isActive} />}
                  {tab.id === "courses" && <NavCoursesIcon active={isActive} />}
                  {tab.id === "doubts" && <NavDoubtsIcon active={isActive} />}
                </div>
                <span style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#3D2411" : "#9CA3AF",
                  letterSpacing: "0.2px",
                }}>
                  {tab.label}
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
