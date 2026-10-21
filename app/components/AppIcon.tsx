"use client";

// ─────────────────────────────────────────────────────────────
// Line icons for the app. The app never prints emoji — every
// pictogram on screen comes from here (stroke icons, 24×24 grid).
// ─────────────────────────────────────────────────────────────

const PATHS = {
  landmark: <><path d="M3 21h18" /><path d="M5 21V10" /><path d="M9.5 21V10" /><path d="M14.5 21V10" /><path d="M19 21V10" /><path d="M12 3 3 8h18z" /></>,
  scale: <><path d="M12 3v18" /><path d="M7 21h10" /><path d="M5 7h14" /><path d="m5 7-3 7a3 3 0 0 0 6 0z" /><path d="m19 7-3 7a3 3 0 0 0 6 0z" /></>,
  graduation: <><path d="M22 10 12 5 2 10l10 5z" /><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  laptop: <><rect x="4" y="5" width="16" height="11" rx="2" /><path d="M2 20h20" /></>,
  clipboard: <><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4h6v3H9z" /><path d="M9 12h6" /><path d="M9 16h4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a6 6 0 0 1 3.5 6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 10h18" /></>,
  flag: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  language: <><path d="M4 5h9" /><path d="M8.5 3v2" /><path d="M11 5c-1 4-3.5 7-7 9" /><path d="M6 9c1.5 2.5 3.5 4 6 5" /><path d="m13 21 4-9 4 9" /><path d="M14.5 18h5" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7.5v.5" /></>,
  gift: <><rect x="3" y="8" width="18" height="5" rx="1" /><path d="M5 13v8h14v-8" /><path d="M12 8v13" /><path d="M12 8C10 4 6.5 4.5 7 7c.3 1 2 1 5 1z" /><path d="M12 8c2-4 5.5-3.5 5-1-.3 1-2 1-5 1z" /></>,
  list: <><path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></>,
  book: <><path d="M3 5a2 2 0 0 1 2-2h6v17H5a2 2 0 0 0-2 2z" /><path d="M21 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2z" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
  video: <><rect x="2" y="6" width="14" height="12" rx="2" /><path d="m16 10 6-3v10l-6-3z" /></>,
  file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></>,
  newspaper: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h6" /><path d="M7 12h10" /><path d="M7 16h10" /></>,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  chart: <><path d="M3 20h18" /><path d="m4 16 5-5 4 3 7-7" /><path d="M15 7h5v5" /></>,
  award: <><circle cx="12" cy="9" r="6" /><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" /></>,
  flame: <path d="M12 21c4 0 7-2.7 7-6.5 0-3.5-2.5-5.5-3.5-8.5-1.5 2-2 3-3.5 3.5C12 7 11.5 4.5 9 3c.5 3-1.5 5-3 7-1 1.3-1 2.5-1 4.5C5 18.3 8 21 12 21z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  play: <path d="M7 4v16l13-8z" />,
  arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  megaphone: <><path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M19 6a8 8 0 0 1 0 12" /></>,
  puzzle: <path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></>,
  calculator: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /><path d="M8 16h.01" /><path d="M12 16h.01" /><path d="M16 16h.01" /></>,
  smartphone: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  bank: <><path d="M3 21h18" /><path d="M4 10h16" /><path d="M12 3 3 8h18z" /><path d="M6 10v8" /><path d="M10 10v8" /><path d="M14 10v8" /><path d="M18 10v8" /></>,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  flask: <><path d="M9 3h6" /><path d="M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3" /><path d="M7 15h10" /></>,
  library: <><path d="M4 4h4v16H4z" /><path d="M10 4h4v16h-4z" /><path d="m16 5 3.5-1 2.5 15.5-3.5 1z" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4" /><path d="m15.4 6.5-6.8 4" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  more: <><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function AppIcon({ name, size = 18, color = "currentColor", strokeWidth = 2, fill = "none", style }: {
  name: IconName; size?: number; color?: string; strokeWidth?: number; fill?: string; style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block", ...style }} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

/** The icon for a course, picked from what it is (its emoji `icon` from the website is never shown). */
export function courseIconName(c: { slug?: string; name?: string; category?: string }): IconName {
  const s = `${c.slug ?? ""} ${c.name ?? ""}`.toLowerCase();
  if (s.includes("counsel")) return "compass";
  if (c.category === "mentorship" || s.includes("mentor")) return "users";
  if (c.category === "mock" || s.includes("mock")) return "clipboard";
  if (s.includes("ailet")) return "scale";
  if (s.includes("cuet")) return "graduation";
  if (s.includes("olet") || s.includes("lsat")) return "target";
  if (s.includes("booster") || s.includes("crash")) return "flame";
  if (c.category === "online") return "laptop";
  return "landmark";
}

/** The icon for a CLAT subject. */
export function subjectIconName(name: string): IconName {
  const n = name.toLowerCase();
  if (n.includes("english")) return "book";
  if (n.includes("legal") || n.includes("law")) return "scale";
  if (n.includes("logic")) return "puzzle";
  if (n.includes("current") || n.includes("gk") || n.includes("general knowledge")) return "globe";
  if (n.includes("quant") || n.includes("math")) return "calculator";
  return "library";
}

/** The icon for a "what you get" card, guessed from its title. */
export function featureIconName(title: string): IconName {
  const t = title.toLowerCase();
  const map: [string, IconName][] = [
    ["magazine", "newspaper"], ["material", "book"], ["book", "book"], ["note", "file"], ["mentor", "user"],
    ["special", "star"], ["english", "language"], ["doubt", "chat"], ["performance", "chart"], ["track", "chart"],
    ["test", "clipboard"], ["mock", "clipboard"], ["live", "video"], ["video", "video"], ["record", "video"],
    ["library", "library"], ["counsel", "compass"], ["session", "calendar"],
  ];
  return map.find(([k]) => t.includes(k))?.[1] ?? "sparkle";
}
