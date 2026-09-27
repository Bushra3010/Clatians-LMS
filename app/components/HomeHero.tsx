"use client";

import { useEffect, useRef, useState } from "react";
import type { Banner } from "../lib/resource-types";

const AUTO_MS = 4000;
/** After the student swipes, hold the auto-advance off this long. */
const PAUSE_MS = 7000;

/**
 * Swipeable home carousel: the built-in first slide, then the admin's image
 * banners. Slides snap one at a time and advance on their own.
 */
export function HeroCarousel({ first, banners, onOpen }: {
  first: React.ReactNode;
  banners: Banner[];
  onOpen: (link: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const heldUntil = useRef(0);
  const count = banners.length + 1;

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => {
      if (Date.now() < heldUntil.current || document.hidden) return;
      const el = trackRef.current;
      if (!el) return;
      const cur = Math.round(el.scrollLeft / el.clientWidth);
      goTo((cur + 1) % count);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [count]);

  const hold = () => { heldUntil.current = Date.now() + PAUSE_MS; };

  return (
    <div>
      <div
        ref={trackRef}
        className="no-scroll"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        onTouchStart={hold}
        onPointerDown={hold}
        style={{
          display: "flex",
          overflowX: count > 1 ? "auto" : "hidden",
          scrollSnapType: "x mandatory",
          overscrollBehaviorX: "contain",
          // Room for the cards' drop shadow, which overflow would otherwise clip.
          paddingBottom: 14, marginBottom: -14,
        }}
      >
        <Slide>{first}</Slide>
        {banners.map((b, i) => (
          <Slide key={i}>
            <button
              onClick={() => b.link && onOpen(b.link)}
              aria-label={b.title}
              className={b.link ? "press" : undefined}
              style={{
                display: "block", width: "100%", height: "100%", padding: 0, border: "none",
                borderRadius: 24, overflow: "hidden", background: "var(--blue-dark)",
                cursor: b.link ? "pointer" : "default",
                boxShadow: "0 10px 28px rgba(11,92,255,0.22)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image}
                alt={b.title}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
                style={{ display: "block", width: "100%", height: "100%", minHeight: "100%", objectFit: "cover" }}
              />
            </button>
          </Slide>
        ))}
      </div>

      {count > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => { hold(); goTo(i); }}
              style={{
                width: i === index ? 20 : 7, height: 7, padding: 0, border: "none", borderRadius: 999,
                background: i === index ? "var(--blue)" : "rgba(11,92,255,0.22)",
                transition: "width 0.3s, background 0.3s", cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: "0 0 100%", scrollSnapAlign: "start", padding: "4px 16px 0", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

const AVATAR_BG = [
  "linear-gradient(135deg,var(--blue),var(--blue-dark))",
  "linear-gradient(135deg,var(--gold),var(--gold-dark))",
  "linear-gradient(135deg,#8B5CF6,#6D28D9)",
  "linear-gradient(135deg,#10B981,#047857)",
  "linear-gradient(135deg,#F43F5E,#BE123C)",
  "linear-gradient(135deg,#06B6D4,#0E7490)",
];

/**
 * Three overlapping student avatars that keep cycling through everyone who
 * recommends the tools — a quiet "lots of students use this" signal.
 */
export function RecommenderStack({ initials }: { initials: string[] }) {
  const pool = initials.length ? initials : ["AG", "RM"];
  const [start, setStart] = useState(0);

  useEffect(() => {
    if (pool.length <= 3) return;
    const t = setInterval(() => setStart((s) => (s + 1) % pool.length), 2400);
    return () => clearInterval(t);
  }, [pool.length]);

  const shown = Array.from({ length: Math.min(3, pool.length) }, (_, i) => (start + i) % pool.length);

  return (
    <div style={{ display: "flex" }} aria-label="Recommended by students">
      {shown.map((p, i) => (
        <div
          // Keyed by who is in the slot, so each change replays the flip-in.
          key={`${i}-${p}`}
          className="avatar-flip"
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: AVATAR_BG[p % AVATAR_BG.length],
            border: "2.5px solid white",
            marginLeft: i === 0 ? 0 : -10,
            zIndex: 3 - i,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            animationDelay: `${i * 110}ms`,
          }}
        >
          {pool[p]}
        </div>
      ))}
    </div>
  );
}
