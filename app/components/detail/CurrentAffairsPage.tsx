"use client";

import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "../AppIcon";
import { listBlogPostsAction, getBlogPostAction, type BlogPost } from "../../lib/blog-actions";
import { shareText } from "../../lib/share";

// ─────────────────────────────────────────────────────────────
// Current Affairs = the website's blog (The CLATians Journal,
// clatians.com/blogs): same posts, categories and month filter, read in-app.
// ─────────────────────────────────────────────────────────────

const PAGE = 15;
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DEFAULT_CATEGORY = "Current Affairs";

const card: React.CSSProperties = { background: "white", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" };

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${MONTH_NAMES[Number(m) - 1]?.slice(0, 3) ?? ""} ${y}`;
}

function BackBar({ label, onBack, right }: { label: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 0" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)", fontSize: 14, fontWeight: 700, padding: 0 }}>
        <AppIcon name="chevronRight" size={20} strokeWidth={2.5} style={{ transform: "rotate(180deg)" }} />
        {label}
      </button>
      {right}
    </div>
  );
}

function CategoryPill({ post }: { post: BlogPost }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: `${post.categoryColor}1A`, color: post.categoryColor, whiteSpace: "nowrap" }}>
      {post.category}
    </span>
  );
}

function Meta({ post }: { post: BlogPost }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AppIcon name="user" size={12} />{post.author}</span>
      {post.date && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AppIcon name="calendar" size={12} />{post.date}</span>}
      {post.readTime && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><AppIcon name="clock" size={12} />{post.readTime}</span>}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, cursor: "pointer", borderRadius: 20, padding: "7px 13px", fontSize: 12, fontWeight: 700,
      border: active ? "1.5px solid var(--blue)" : "1.5px solid var(--line)",
      background: active ? "var(--blue)" : "white", color: active ? "white" : "var(--text-secondary)",
    }}>{children}</button>
  );
}

const articleCss = `
.ca-article { font-size: 14.5px; line-height: 1.7; color: var(--text-secondary); word-wrap: break-word; }
.ca-article h2 { font-size: 17px; line-height: 1.35; font-weight: 800; color: var(--ink-primary); margin: 22px 0 6px; }
.ca-article h3 { font-size: 15px; font-weight: 800; color: var(--ink-primary); margin: 16px 0 4px; }
.ca-article h4 { font-size: 14px; font-weight: 800; color: var(--ink-primary); margin: 14px 0 4px; }
.ca-article > :first-child { margin-top: 0; }
.ca-article p { margin: 0 0 10px; }
.ca-article ul, .ca-article ol { margin: 0 0 12px; padding-left: 20px; }
.ca-article ul { list-style: disc; }
.ca-article ol { list-style: decimal; }
.ca-article li { margin: 0 0 5px; display: list-item; }
.ca-article li::marker { color: var(--blue); }
.ca-article strong, .ca-article b { color: var(--ink-primary); }
.ca-article hr { border: none; border-top: 1px solid var(--line); margin: 18px 0; }
.ca-article a { color: var(--blue); font-weight: 700; }
.ca-article blockquote { margin: 0 0 12px; padding: 8px 12px; border-left: 3px solid var(--blue); background: var(--blue-tint); border-radius: 0 10px 10px 0; }
.ca-article table { display: block; overflow-x: auto; border-collapse: collapse; margin: 6px 0 14px; font-size: 12.5px; line-height: 1.5; max-width: 100%; }
.ca-article th, .ca-article td { border: 1px solid var(--line); padding: 7px 9px; text-align: left; vertical-align: top; min-width: 90px; }
.ca-article th { background: var(--surface-dim); color: var(--ink-primary); font-weight: 800; }
`;

function Reader({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [state, setState] = useState<{ post: BlogPost; html: string } | { error: string } | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let live = true;
    getBlogPostAction(slug).then((r) => { if (live) setState(r.ok ? { post: r.post, html: r.html } : { error: r.error }); });
    return () => { live = false; };
  }, [slug]);

  const url = `https://clatians.com/blogs/${slug}`;
  const share = async () => {
    const title = state && "post" in state ? state.post.title : "CLATians Current Affairs";
    const r = await shareText(title, url);
    if (r === "copied") { setNote("Link copied"); setTimeout(() => setNote(""), 1500); }
  };

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
      <style>{articleCss}</style>
      <BackBar label="Current Affairs" onBack={onBack} right={
        <button onClick={share} aria-label="Share article" style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <AppIcon name="share" size={16} color="var(--ink-primary)" />
          {note && <span style={{ position: "absolute", right: 0, top: 42, fontSize: 11, fontWeight: 700, color: "white", background: "rgba(0,0,0,0.6)", padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap" }}>{note}</span>}
        </button>
      } />

      <div style={{ padding: "14px 14px 0" }}>
        {!state && <div style={{ ...card, padding: 18 }}><Skeleton lines={8} /></div>}
        {state && "error" in state && <ErrorCard text={state.error} />}
        {state && "post" in state && (
          <>
            <div style={{ padding: "0 2px 12px" }}>
              <CategoryPill post={state.post} />
              <h1 style={{ margin: "10px 0 8px", fontSize: 20, lineHeight: 1.3, fontWeight: 900, color: "var(--ink-primary)" }}>{state.post.title}</h1>
              <Meta post={state.post} />
            </div>
            <div style={{ ...card, padding: "18px 16px 8px" }}>
              {state.html.trim()
                ? <div className="ca-article" dangerouslySetInnerHTML={{ __html: state.html }} />
                : <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7 }}>{state.post.excerpt}</p>}
            </div>
            {state.post.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                {state.post.tags.map((t) => (
                  <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: "white", border: "1px solid var(--line)", color: "var(--text-muted)" }}>#{t}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Skeleton({ lines }: { lines: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} style={{ height: 12, borderRadius: 6, background: "var(--surface-dim)", width: `${[92, 80, 96, 70, 88][i % 5]}%` }} />
      ))}
    </div>
  );
}

function ErrorCard({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div style={{ ...card, padding: "26px 18px", textAlign: "center" }}>
      <AppIcon name="newspaper" size={30} color="var(--text-disabled)" />
      <p style={{ margin: "8px 0 0", fontSize: 13.5, fontWeight: 700, color: "var(--ink-primary)" }}>{text}</p>
      {onRetry && <button onClick={onRetry} style={{ marginTop: 12, border: "none", borderRadius: 12, padding: "9px 18px", background: "var(--blue)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Try again</button>}
    </div>
  );
}

export default function CurrentAffairsPage({ onBack, banner }: {
  onBack: () => void;
  /** Optional card above the list — the daily Current Affairs quiz. */
  banner?: React.ReactNode;
}) {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [month, setMonth] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    listBlogPostsAction().then((r) => {
      if (!live) return;
      if (r.ok) { setPosts(r.posts); setError(""); } else setError(r.error);
    });
    return () => { live = false; };
  }, [attempt]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts ?? []) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => (a[0] === DEFAULT_CATEGORY ? -1 : b[0] === DEFAULT_CATEGORY ? 1 : b[1] - a[1]));
  }, [posts]);

  const inCategory = useMemo(() => (posts ?? []).filter((p) => category === "all" || p.category === category), [posts, category]);
  const months = useMemo(() => [...new Set(inCategory.map((p) => p.isoDate.slice(0, 7)).filter(Boolean))], [inCategory]);

  const q = query.trim().toLowerCase();
  const list = inCategory.filter((p) =>
    (month === "all" || p.isoDate.startsWith(month)) &&
    (!q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))));
  const [featured, ...rest] = list;

  const pickCategory = (c: string) => { setCategory(c); setMonth("all"); setShown(PAGE); };

  if (openSlug) return <Reader slug={openSlug} onBack={() => setOpenSlug(null)} />;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <BackBar label="Current Affairs" onBack={onBack} />

      <div style={{ padding: "14px 14px 0" }}>
        {/* Journal header, as on clatians.com/blogs */}
        <div style={{ borderRadius: 18, padding: "16px", marginBottom: 14, background: "linear-gradient(135deg,#060d1f,#0D1837)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -50, width: 170, height: 170, borderRadius: "50%", background: "#08BD80", opacity: 0.16, filter: "blur(30px)" }} />
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: "#08BD80", background: "rgba(8,189,128,0.12)", border: "1px solid rgba(8,189,128,0.3)", padding: "4px 10px", borderRadius: 20 }}>
            <AppIcon name="newspaper" size={12} color="#08BD80" />The CLATians Journal
          </span>
          <p style={{ position: "relative", margin: "10px 0 4px", fontSize: 18, fontWeight: 900, color: "white" }}>CLAT Prep Insights</p>
          <p style={{ position: "relative", margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>Daily current affairs notes and expert articles from CLATians faculty, updated regularly.</p>
        </div>

        {banner}

        {/* Search */}
        <label style={{ ...card, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 12 }}>
          <AppIcon name="search" size={17} color="var(--text-muted)" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }} placeholder="Search topics, e.g. Supreme Court, BRICS" style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, background: "transparent", color: "var(--ink-primary)", minWidth: 0 }} />
          {query && <button onClick={() => setQuery("")} aria-label="Clear search" style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}><AppIcon name="close" size={16} color="var(--text-muted)" /></button>}
        </label>

        {/* Categories */}
        {posts && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 8, scrollbarWidth: "none" }}>
            {categories.map(([c, n]) => <Chip key={c} active={category === c} onClick={() => pickCategory(c)}>{c} ({n})</Chip>)}
            <Chip active={category === "all"} onClick={() => pickCategory("all")}>All ({posts.length})</Chip>
          </div>
        )}

        {/* Months */}
        {months.length > 1 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 12, scrollbarWidth: "none" }}>
            <Chip active={month === "all"} onClick={() => { setMonth("all"); setShown(PAGE); }}>All months</Chip>
            {months.map((m) => <Chip key={m} active={month === m} onClick={() => { setMonth(m); setShown(PAGE); }}>{monthLabel(m)}</Chip>)}
          </div>
        )}

        {!posts && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ ...card, padding: 16 }}><Skeleton lines={3} /></div>)}
          </div>
        )}
        {!posts && error && <ErrorCard text={error} onRetry={() => { setError(""); setAttempt((n) => n + 1); }} />}

        {posts && list.length === 0 && <ErrorCard text={q ? `Nothing matches "${query.trim()}".` : "No articles here yet."} />}

        {/* Latest post, large */}
        {featured && (
          <button onClick={() => setOpenSlug(featured.slug)} style={{ ...card, width: "100%", border: "none", cursor: "pointer", textAlign: "left", padding: 0, overflow: "hidden", marginBottom: 12, display: "block" }}>
            <div style={{ height: 6, background: featured.categoryColor }} />
            <div style={{ padding: "14px 15px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <CategoryPill post={featured} />
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Latest</span>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "var(--ink-primary)", lineHeight: 1.35 }}>{featured.title}</p>
              {featured.excerpt && <p style={{ margin: "0 0 10px", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{featured.excerpt}</p>}
              <Meta post={featured} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, fontSize: 13, fontWeight: 800, color: "var(--blue)" }}>Read now <AppIcon name="arrowRight" size={14} color="var(--blue)" /></span>
            </div>
          </button>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rest.slice(0, shown).map((p) => (
            <button key={p.slug} onClick={() => setOpenSlug(p.slug)} style={{ ...card, border: "none", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${p.categoryColor}1A`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: p.categoryColor }}>
                {p.isoDate ? (
                  <>
                    <span style={{ fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{Number(p.isoDate.slice(8, 10))}</span>
                    <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", marginTop: 2 }}>{MONTH_NAMES[Number(p.isoDate.slice(5, 7)) - 1]?.slice(0, 3)}</span>
                  </>
                ) : <AppIcon name="newspaper" size={20} color={p.categoryColor} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)", lineHeight: 1.35 }}>{p.title}</span>
                <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{[p.category, p.readTime].filter(Boolean).join(" · ")}</span>
              </span>
              <AppIcon name="chevronRight" size={16} color="var(--text-disabled)" />
            </button>
          ))}
        </div>

        {rest.length > shown && (
          <button onClick={() => setShown((n) => n + PAGE)} style={{ width: "100%", marginTop: 12, cursor: "pointer", borderRadius: 14, padding: "12px", fontSize: 13, fontWeight: 800, border: "1.5px solid var(--blue)", background: "white", color: "var(--blue)" }}>
            Show more ({rest.length - shown} left)
          </button>
        )}
      </div>
    </div>
  );
}
