"use client";

import { useState } from "react";
import { youtubeId } from "./ClassWatchPage";
import PdfViewer from "../PdfViewer";
import { AppIcon, type IconName } from "../AppIcon";
import { ScreenHeader, IconTile, EmptyState, card, page, primaryBtn, outlineBtn, type Tone } from "../ui/kit";

export type ContentItem = {
  id: string;
  title: string;
  body: string;
  author: string | null;
  course: string | null;
  createdAt: string;
  done: boolean;
  /** The CLAT section it is filed under — Free Resources groups on this. */
  subject?: string;
  /** The topic inside that section — Free Resources lists a subject topic-wise. */
  topic?: string;
  /** True when it belongs to no batch, so every student can open it. */
  free?: boolean;
};

const meta: Record<string, { label: string; icon: IconName; tone: Tone; action: string }> = {
  video: { label: "Video Lectures", icon: "video", tone: "blue", action: "Watch" },
  notes: { label: "Study Notes", icon: "file", tone: "teal", action: "Read" },
  practice: { label: "Practice Questions", icon: "clipboard", tone: "purple", action: "Practice" },
  "current-affairs": { label: "Current Affairs", icon: "newspaper", tone: "gold", action: "Read" },
};
const fallbackMeta: { label: string; icon: IconName; tone: Tone; action: string } = { label: "Content", icon: "library", tone: "blue", action: "Open" };

function isUrl(s: string) {
  return /^(https?:\/\/|\/uploads\/)/i.test((s || "").trim());
}
function isPdf(s: string) {
  return /\.pdf($|\?)/i.test((s || "").trim());
}

/**
 * Full-screen, in-app viewer for one content item. Handles the three shapes a
 * content body can take: a YouTube link (embedded player), any other document
 * URL (embedded frame + open-in-tab fallback), or plain text (readable article).
 */
function ContentViewer({
  item,
  type,
  onBack,
  onToggleDone,
}: {
  item: ContentItem;
  type: string;
  onBack: () => void;
  onToggleDone: (id: string) => void;
}) {
  const m = meta[type] ?? fallbackMeta;
  const body = (item.body || "").trim();
  const ytId = type === "video" ? youtubeId(body) : null;
  const url = isUrl(body) ? body : null;

  return (
    <div style={page}>
      <ScreenHeader title={m.label} onBack={onBack} />

      <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <IconTile icon={m.icon} tone={m.tone} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.label}</span>
          <h2 style={{ margin: "2px 0 0", fontSize: 19, fontWeight: 800, color: "var(--ink)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{item.title}</h2>
          <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--ink-mute)" }}>{item.author ?? "Faculty"}{item.course ? ` · ${item.course}` : ""}</p>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "14px 16px 0" }}>
        {ytId ? (
          // In-app YouTube player
          <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: 18, overflow: "hidden", background: "#000", boxShadow: "0 8px 24px rgba(15,23,41,0.18)" }}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              title={item.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : url && isPdf(url) ? (
          // PDF drawn inline — phones can't show a PDF inside an iframe
          <PdfViewer key={url} url={url} title={item.title} />
        ) : url ? (
          // Embedded document (PDF / uploaded file / external page) + open fallback
          <div>
            <div style={{ ...card, position: "relative", width: "100%", height: 460, overflow: "hidden" }}>
              <iframe
                src={isPdf(url) ? `${url}#toolbar=1&view=FitH` : url}
                title={item.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              />
            </div>
            <a href={url} target="_blank" rel="noreferrer" style={{ ...primaryBtn, display: "flex", width: "100%", boxSizing: "border-box", marginTop: 10, textDecoration: "none", fontSize: 13.5 }}>
              Open in new tab <AppIcon name="link" size={15} color="white" />
            </a>
            <p style={{ margin: "8px 4px 0", fontSize: 11, color: "var(--ink-mute)", textAlign: "center" }}>
              If the {isPdf(url) ? "document" : "page"} doesn&apos;t load above, use &quot;Open in new tab&quot;.
            </p>
          </div>
        ) : (
          // Plain-text reader
          <div style={{ ...card, padding: "18px 18px 20px" }}>
            {body ? (
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{body}</p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-mute)" }}>No content was added for this item yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Mark done */}
      <div style={{ padding: "16px 16px 0" }}>
        <button
          onClick={() => onToggleDone(item.id)}
          style={item.done
            ? { ...outlineBtn, width: "100%", borderColor: "var(--green)", background: "var(--success)", color: "var(--success-text)" }
            : { ...outlineBtn, width: "100%" }}
        >
          {item.done ? <><AppIcon name="checkCircle" size={17} /> Completed — tap to undo</> : <><AppIcon name="check" size={17} /> Mark as completed</>}
        </button>
      </div>
    </div>
  );
}

export default function ContentListPage({
  onBack,
  type,
  items,
  onToggleDone,
  banner,
  subtitle,
  groupByTopic = false,
}: {
  onBack: () => void;
  type: string;
  items: ContentItem[];
  onToggleDone: (id: string) => void;
  /** Optional card shown above the list — e.g. the daily quiz on Current Affairs. */
  banner?: React.ReactNode;
  /** Shown under the title — Free Resources passes the subject being listed. */
  subtitle?: string;
  /** List under topic headings (Free Resources ▸ a subject) instead of one flat list. */
  groupByTopic?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  // Topic dropdowns: null = only the first topic open (the default).
  const [openTopics, setOpenTopics] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState("");
  const doneCount = items.filter((i) => i.done).length;
  const m = meta[type] ?? fallbackMeta;

  // In-app viewer takes over when an item is open.
  const openItem = items.find((i) => i.id === openId);
  if (openItem) {
    return <ContentViewer item={openItem} type={type} onBack={() => setOpenId(null)} onToggleDone={onToggleDone} />;
  }

  const renderRow = (it: ContentItem) => (
    <div
      key={it.id}
      onClick={() => setOpenId(it.id)}
      style={{ ...card, padding: "14px 15px", cursor: "pointer" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <IconTile icon={m.icon} tone={m.tone} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{it.title}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
            {isUrl(it.body) ? "Tap to open in the app." : it.body || "No description."}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--ink-mute)" }}>
            {it.author ?? "Faculty"}{it.course ? ` · ${it.course}` : ""}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleDone(it.id); }}
          aria-label={it.done ? "Mark not done" : "Mark done"}
          style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
            border: `1.5px solid ${it.done ? "var(--success-border)" : "var(--line-strong)"}`,
            background: it.done ? "var(--success)" : "white",
            color: it.done ? "var(--success-text)" : "var(--ink-soft)",
            borderRadius: 20, padding: "5px 10px", fontSize: 11, fontWeight: 800,
          }}
        >
          {it.done ? <><AppIcon name="check" size={12} strokeWidth={2.6} /> Done</> : "Mark done"}
        </button>
      </div>
      <div style={{ ...primaryBtn, display: "flex", width: "100%", boxSizing: "border-box", marginTop: 12, padding: "10px", fontSize: 13, boxShadow: "none" }}>
        {m.action} <AppIcon name="arrowRight" size={15} color="white" />
      </div>
    </div>
  );

  return (
    <div style={page}>
      <ScreenHeader title={m.label} subtitle={subtitle} onBack={onBack} />

      <div style={{ padding: "14px 16px 0" }}>
        {banner}

        <p style={{ margin: "0 2px 12px", fontSize: 12.5, color: "var(--ink-soft)" }}>
          {items.length} {items.length === 1 ? "item" : "items"} available · <span style={{ color: "var(--success-text)", fontWeight: 700 }}>{doneCount} done</span>
        </p>

        {items.length === 0 && (
          <EmptyState icon={m.icon} title="Nothing here yet" text={`Your teachers haven't published ${m.label.toLowerCase()} for your batch yet.`} />
        )}

        {groupByTopic ? (() => {
          const q = query.trim().toLowerCase();
          const shown = q ? items.filter((it) => it.title.toLowerCase().includes(q) || (it.topic || "").toLowerCase().includes(q)) : items;
          const groups = topicGroups(shown);
          const isOpen = (t: string, i: number) => !!q || (openTopics ? openTopics.has(t) : i === 0);
          const toggle = (t: string, i: number) => setOpenTopics((prev) => {
            const next = new Set(prev ?? (groups[0] ? [groups[0][0]] : []));
            if (isOpen(t, i)) next.delete(t); else next.add(t);
            return next;
          });
          const allOpen = groups.length > 0 && groups.every(([t], i) => isOpen(t, i));
          return (
            <>
              {items.length > 6 && (
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <AppIcon name="search" size={16} color="var(--ink-mute)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${m.label.toLowerCase()}…`} style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px 11px 36px", borderRadius: 14, border: "1px solid var(--line)", background: "white", fontSize: 13.5, color: "var(--ink)", outline: "none" }} />
                </div>
              )}
              {groups.length > 1 && !q && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 2px 10px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>{groups.length} topics</span>
                  <button onClick={() => setOpenTopics(allOpen ? new Set() : new Set(groups.map(([t]) => t)))} style={{ border: "none", background: "none", padding: 0, cursor: "pointer", fontSize: 12, fontWeight: 800, color: "var(--blue)" }}>
                    {allOpen ? "Collapse all" : "Expand all"}
                  </button>
                </div>
              )}
              {q && groups.length === 0 && <EmptyState icon="search" title="No match" text={`Nothing called "${query.trim()}" here.`} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {groups.map(([topic, list], i) => {
                  const open = isOpen(topic, i);
                  const done = list.filter((x) => x.done).length;
                  return (
                    <section key={topic} style={{ ...card, overflow: "hidden" }}>
                      <button onClick={() => toggle(topic, i)} aria-expanded={open} style={{ width: "100%", border: "none", background: open ? "var(--blue-tint)" : "white", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                        <IconTile icon={m.icon} tone={m.tone} size={38} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{topic}</span>
                          <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
                            {list.length} {list.length === 1 ? "item" : "items"}{done ? ` · ${done} done` : ""}
                          </span>
                        </span>
                        <AppIcon name="chevronDown" size={18} color="var(--ink-soft)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                      </button>
                      {open && list.map((it, j) => (
                        <div key={it.id} onClick={() => setOpenId(it.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderTop: "1px solid var(--line)", cursor: "pointer" }}>
                          <span style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, background: it.done ? "var(--success)" : "var(--surface-dim)", color: it.done ? "var(--success-text)" : "var(--ink-soft)" }}>
                            {it.done ? <AppIcon name="check" size={13} strokeWidth={3} /> : j + 1}
                          </span>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1.35 }}>{it.title}</span>
                          <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 800, color: "var(--blue)" }}>
                            <AppIcon name={type === "video" ? "play" : "arrowRight"} size={13} />{m.action}
                          </span>
                        </div>
                      ))}
                    </section>
                  );
                })}
              </div>
            </>
          );
        })() : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{items.map(renderRow)}</div>
        )}
      </div>
    </div>
  );
}

export const OTHER_TOPICS = "Other topics";

/** Items under their topic, topics A–Z with untagged material last. */
export function topicGroups(items: ContentItem[]): [string, ContentItem[]][] {
  const map = new Map<string, ContentItem[]>();
  for (const it of items) {
    const t = (it.topic || "").trim() || OTHER_TOPICS;
    map.set(t, [...(map.get(t) ?? []), it]);
  }
  return [...map.entries()].sort(([a], [b]) =>
    a === OTHER_TOPICS ? 1 : b === OTHER_TOPICS ? -1 : a.localeCompare(b));
}
