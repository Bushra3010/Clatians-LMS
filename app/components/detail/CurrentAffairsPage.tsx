"use client";

import { useEffect, useMemo, useState } from "react";
import { AppIcon } from "../AppIcon";
import { listBlogPostsAction, getBlogPostAction, getBlogQuestionsAction, type BlogPost, type BlogQuestionSet } from "../../lib/blog-actions";
import { shareText } from "../../lib/share";
import { heroSurface, ScreenHeader, Segmented, Pill } from "../ui/kit";

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
  return <ScreenHeader title={label} onBack={onBack} right={right} />;
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

function Reader({ slug, onBack, onPractice }: { slug: string; onBack: () => void; onPractice?: () => void }) {
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
            {onPractice && (
              <button onClick={onPractice} className="press" style={{ ...card, width: "100%", border: "1.5px solid var(--blue)", cursor: "pointer", textAlign: "left", padding: "13px 14px", marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--blue-tint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AppIcon name="clipboard" size={20} color="var(--blue)" /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>Practise this blog&apos;s questions</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>Tap an answer, see if you got it right</span>
                </span>
                <AppIcon name="arrowRight" size={16} color="var(--blue)" />
              </button>
            )}
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
  const [tab, setTab] = useState<"blogs" | "practice">("blogs");
  const [practiceSlug, setPracticeSlug] = useState<string | null>(null);

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

  if (practiceSlug) return <PracticeSession slug={practiceSlug} onBack={() => setPracticeSlug(null)} />;
  if (openSlug) return <Reader slug={openSlug} onBack={() => setOpenSlug(null)} onPractice={() => setPracticeSlug(openSlug)} />;

  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 24 }}>
      <BackBar label="Current Affairs" onBack={onBack} />

      <div style={{ padding: "14px 14px 0" }}>
        <Segmented<"blogs" | "practice">
          tabs={[{ key: "blogs", label: "Blogs", icon: "newspaper" }, { key: "practice", label: "Question Practice", icon: "clipboard" }]}
          active={tab}
          onChange={setTab}
          style={{ marginBottom: 14 }}
        />
      </div>

      {tab === "practice" ? (
        <PracticeList posts={posts} error={error} onRetry={() => { setError(""); setAttempt((n) => n + 1); }} onOpen={setPracticeSlug} />
      ) : (
      <div style={{ padding: "0 14px 0" }}>
        {/* Journal header, as on clatians.com/blogs */}
        <div style={{ ...heroSurface, padding: "16px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--blue-dark)", background: "#CFFB6B", padding: "4px 10px", borderRadius: 8 }}>
            <AppIcon name="newspaper" size={12} color="var(--blue-dark)" />The CLATians Journal
          </span>
          <p style={{ position: "relative", margin: "10px 0 4px", fontSize: 20, fontWeight: 700, color: "white" }}>CLAT Prep <span style={{ color: "var(--gold)" }}>Insights</span></p>
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
      )}
    </div>
  );
}

// ── Question Practice: the "Possible CLAT Questions" from each daily post ──

/** Daily CA posts, newest first — each one is a practice set. */
function PracticeList({ posts, error, onRetry, onOpen }: { posts: BlogPost[] | null; error: string; onRetry: () => void; onOpen: (slug: string) => void }) {
  const [shown, setShown] = useState(PAGE);
  const daily = (posts ?? []).filter((p) => p.category === DEFAULT_CATEGORY);

  return (
    <div style={{ padding: "0 14px 0" }}>
      <div style={{ ...heroSurface, padding: 16, marginBottom: 14 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--blue-dark)", background: "#CFFB6B", padding: "4px 10px", borderRadius: 8 }}>
          <AppIcon name="clipboard" size={12} color="var(--blue-dark)" />Question Practice
        </span>
        <p style={{ margin: "10px 0 4px", fontSize: 20, fontWeight: 700, color: "white" }}>Practise each day&apos;s <span style={{ color: "var(--gold)" }}>CA questions</span></p>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>The CLAT-style questions from every daily blog, topic-wise, with instant answers.</p>
      </div>

      {!posts && !error && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[0, 1, 2].map((i) => <div key={i} style={{ ...card, padding: 16 }}><Skeleton lines={2} /></div>)}</div>}
      {!posts && error && <ErrorCard text={error} onRetry={onRetry} />}
      {posts && daily.length === 0 && <ErrorCard text="No daily current affairs posts yet." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {daily.slice(0, shown).map((p) => (
          <button key={p.slug} onClick={() => onOpen(p.slug)} className="press" style={{ ...card, border: "none", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "var(--blue-tint)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--blue)" }}>
              <span style={{ fontSize: 15, fontWeight: 900, lineHeight: 1 }}>{p.isoDate ? Number(p.isoDate.slice(8, 10)) : "—"}</span>
              <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", marginTop: 2 }}>{p.isoDate ? MONTH_NAMES[Number(p.isoDate.slice(5, 7)) - 1]?.slice(0, 3) : ""}</span>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>{p.date ? `Questions · ${p.date}` : "Daily questions"}</span>
              <span style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", marginTop: 3, fontSize: 11.5, color: "var(--text-muted)" }}>{p.excerpt || p.title}</span>
            </span>
            <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: "var(--blue)", display: "inline-flex", alignItems: "center", gap: 3 }}>Practise<AppIcon name="chevronRight" size={14} /></span>
          </button>
        ))}
      </div>
      {daily.length > shown && (
        <button onClick={() => setShown((n) => n + PAGE)} style={{ width: "100%", marginTop: 12, cursor: "pointer", borderRadius: 14, padding: "12px", fontSize: 13, fontWeight: 800, border: "1.5px solid var(--blue)", background: "white", color: "var(--blue)" }}>
          Show more ({daily.length - shown} left)
        </button>
      )}
    </div>
  );
}

/** Questions per practice set — a day's 55 become 25 + 25 + 5. */
const SET_SIZE = 25;

type FlatQuestion = BlogQuestionSet["questions"][number] & { topic: string };

/** One post's questions in sets of 25: pick a set, tap an option to check it. */
function PracticeSession({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [state, setState] = useState<{ post: BlogPost; sets: BlogQuestionSet[] } | { error: string } | null>(null);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [setIdx, setSetIdx] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    getBlogQuestionsAction(slug).then((r) => { if (live) setState(r.ok ? { post: r.post, sets: r.sets } : { error: r.error }); });
    return () => { live = false; };
  }, [slug]);

  const all: FlatQuestion[] = state && "sets" in state ? state.sets.flatMap((t) => t.questions.map((q) => ({ ...q, topic: t.topic }))) : [];
  const chunks: FlatQuestion[][] = [];
  for (let i = 0; i < all.length; i += SET_SIZE) chunks.push(all.slice(i, i + SET_SIZE));
  const stats = (qs: FlatQuestion[]) => ({
    answered: qs.filter((q) => picked[q.id] !== undefined).length,
    correct: qs.filter((q) => picked[q.id] === q.answer).length,
  });

  const scroller = () => document.getElementById("screen-content")?.scrollTo({ top: 0 });
  const openSet = (i: number | null) => { setSetIdx(i); scroller(); };

  // ── One set ──
  if (state && "post" in state && setIdx !== null && chunks[setIdx]) {
    const qs = chunks[setIdx];
    const st = stats(qs);
    const finished = st.answered === qs.length;
    return (
      <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
        <BackBar label={`Set ${setIdx + 1} of ${chunks.length}`} onBack={() => openSet(null)} />
        <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ ...card, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: "var(--ink-primary)" }}>{state.post.date} · Set {setIdx + 1}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{st.answered}/{qs.length} answered · {st.correct} correct</span>
            </span>
            {st.answered > 0 && (
              <button onClick={() => setPicked((p) => { const n = { ...p }; for (const q of qs) delete n[q.id]; return n; })} style={{ border: "none", background: "none", color: "var(--blue)", fontSize: 12, fontWeight: 800, cursor: "pointer", padding: 0 }}>Reset</button>
            )}
          </div>

          <div style={{ ...card, overflow: "hidden" }}>
            {qs.map((q, qi) => {
              const choice = picked[q.id];
              const shown = choice !== undefined;
              const newTopic = qi === 0 || qs[qi - 1].topic !== q.topic;
              return (
                <div key={q.id} style={{ padding: "12px 14px", borderTop: qi ? "1px solid var(--line)" : "none" }}>
                  {newTopic && <p style={{ margin: "0 0 8px", fontSize: 10.5, fontWeight: 800, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{q.topic}</p>}
                  <p style={{ margin: "0 0 9px", fontSize: 13.5, fontWeight: 700, color: "var(--ink-primary)", lineHeight: 1.5 }}><span style={{ color: "var(--blue)" }}>Q{setIdx * SET_SIZE + qi + 1}.</span> {q.text}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {q.options.map((o, oi) => {
                      const right = shown && oi === q.answer;
                      const wrong = shown && oi === choice && oi !== q.answer;
                      return (
                        <button key={oi} disabled={shown} onClick={() => setPicked((p) => ({ ...p, [q.id]: oi }))} style={{
                          display: "flex", alignItems: "center", gap: 9, textAlign: "left", cursor: shown ? "default" : "pointer",
                          padding: "9px 11px", borderRadius: 12, fontSize: 13, lineHeight: 1.4,
                          border: `1.5px solid ${right ? "var(--success-border)" : wrong ? "var(--error-text)" : "var(--line)"}`,
                          background: right ? "var(--success)" : wrong ? "var(--error)" : "white",
                          color: right ? "var(--success-text)" : wrong ? "var(--error-text)" : "var(--text-secondary)",
                        }}>
                          <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, background: right ? "var(--green)" : wrong ? "var(--error-text)" : "var(--surface-dim)", color: right || wrong ? "white" : "var(--text-muted)" }}>
                            {right ? <AppIcon name="check" size={12} strokeWidth={3} color="white" /> : wrong ? <AppIcon name="close" size={12} strokeWidth={3} color="white" /> : "ABCD"[oi]}
                          </span>
                          <span style={{ flex: 1 }}>{o}</span>
                        </button>
                      );
                    })}
                  </div>
                  {shown && <div style={{ marginTop: 8 }}><Pill tone={choice === q.answer ? "green" : "red"}>{choice === q.answer ? "Correct" : `Answer: ${"ABCD"[q.answer]}`}</Pill></div>}
                </div>
              );
            })}
          </div>

          {finished && (
            <div style={{ ...heroSurface, padding: 16, color: "white", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.72)" }}>Set {setIdx + 1} done</p>
              <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: "var(--gold)" }}>{st.correct}/{qs.length}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.72)" }}>{Math.round((st.correct / qs.length) * 100)}% correct</p>
            </div>
          )}

          <button onClick={() => openSet(setIdx + 1 < chunks.length ? setIdx + 1 : null)} className="press" style={{ width: "100%", cursor: "pointer", borderRadius: 14, padding: 13, fontSize: 13.5, fontWeight: 800, border: "none", background: "linear-gradient(135deg,var(--blue-dark),var(--blue))", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {setIdx + 1 < chunks.length ? <>Next: Set {setIdx + 2} <AppIcon name="arrowRight" size={15} color="white" /></> : "Back to all sets"}
          </button>
        </div>
      </div>
    );
  }

  // ── The day's sets ──
  const total = stats(all);
  return (
    <div style={{ background: "var(--app-bg)", minHeight: "100%", paddingBottom: 28 }}>
      <BackBar label="Question Practice" onBack={onBack} />
      <div style={{ padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        {!state && <div style={{ ...card, padding: 18 }}><Skeleton lines={6} /></div>}
        {state && "error" in state && <ErrorCard text={state.error} />}
        {state && "post" in state && (
          <>
            <div style={{ ...heroSurface, padding: 16, color: "white" }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{state.post.date}</p>
              <p style={{ margin: "4px 0 12px", fontSize: 15.5, fontWeight: 700, lineHeight: 1.35 }}>{state.post.title}</p>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 14, padding: "9px 4px" }}>
                {[{ v: all.length, l: "Questions" }, { v: chunks.length, l: "Sets" }, { v: total.correct, l: "Correct" }].map((x, i) => (
                  <div key={x.l} style={{ flex: 1, textAlign: "center", borderLeft: i ? "1px solid rgba(255,255,255,0.16)" : "none" }}>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--gold)" }}>{x.v}</p>
                    <p style={{ margin: "1px 0 0", fontSize: 10.5, color: "rgba(255,255,255,0.7)" }}>{x.l}</p>
                  </div>
                ))}
              </div>
            </div>

            {chunks.length === 0 && <ErrorCard text="This blog has no practice questions." />}

            {chunks.map((qs, i) => {
              const st = stats(qs);
              const done = st.answered === qs.length;
              const topics = [...new Set(qs.map((q) => q.topic))];
              return (
                <button key={i} onClick={() => openSet(i)} className="press" style={{ ...card, border: "none", cursor: "pointer", textAlign: "left", padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: done ? "var(--success)" : "var(--blue-tint)", color: done ? "var(--success-text)" : "var(--blue)" }}>
                    <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.06em" }}>SET</span>
                    <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{i + 1}</span>
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink-primary)" }}>{qs.length} questions</span>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{topics.length} topics · {topics.join(", ")}</span>
                    {st.answered > 0 && <span style={{ display: "block", fontSize: 11.5, fontWeight: 800, color: done ? "var(--success-text)" : "var(--blue)", marginTop: 3 }}>{done ? `Done · ${st.correct}/${qs.length} correct` : `${st.answered}/${qs.length} answered`}</span>}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 800, color: "var(--blue)", display: "inline-flex", alignItems: "center", gap: 3 }}>{st.answered ? "Continue" : "Start"}<AppIcon name="chevronRight" size={14} /></span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
