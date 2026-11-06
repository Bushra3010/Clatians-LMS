"use server";

import { requireRole } from "./auth";

// ─────────────────────────────────────────────────────────────
// The CLATians Journal (clatians.com/blogs) inside the app. Daily Current
// Affairs notes and the other articles are written on the website; the app
// reads them from GET /api/blogs and never stores a copy.
// ─────────────────────────────────────────────────────────────

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryColor: string;
  author: string;
  /** As the website shows it, e.g. "30 Oct 2026". */
  date: string;
  /** For sorting and month filters, e.g. "2026-10-30". */
  isoDate: string;
  readTime: string;
  tags: string[];
};

type RawBlog = Partial<Record<keyof BlogPost | "content", unknown>>;
type Cache = { at: number; posts: BlogPost[]; content: Map<string, string> };

declare global {
  var __lmsBlogCache: Cache | undefined;
}

const TTL_MS = 10 * 60 * 1000;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** The website writes dates as "30 Oct 2026", "15 May, 2026" or "May 10, 2026". */
function isoOf(date: string): string {
  const d = date.trim().replace(/,/g, " ").replace(/\s+/g, " ");
  const dayFirst = /^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})$/.exec(d);
  const monthFirst = /^([A-Za-z]{3})[a-z]* (\d{1,2}) (\d{4})$/.exec(d);
  const [day, mon, year] = dayFirst ? [dayFirst[1], dayFirst[2], dayFirst[3]] : monthFirst ? [monthFirst[2], monthFirst[1], monthFirst[3]] : ["", "", ""];
  const month = MONTHS.indexOf(mon.toLowerCase());
  if (mon && month >= 0) return `${year}-${String(month + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
  const t = Date.parse(date);
  return Number.isNaN(t) ? "" : new Date(t).toISOString().slice(0, 10);
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** The tags the reader styles; everything else is unwrapped to its text. */
const ALLOWED = new Set(["h2", "h3", "h4", "p", "strong", "b", "em", "i", "u", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "br", "hr", "blockquote", "a", "span", "sup", "sub", "code"]);

/**
 * The website's post HTML, reduced to plain structure: no scripts or embeds,
 * no inline styles (the website's fonts and colours fight the app's), links
 * only to http(s) and opened outside the app.
 */
function cleanHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|noscript|form|svg)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|noscript|form|svg|input|button|img|video|audio|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (tag, name: string, attrs: string) => {
      const t = name.toLowerCase();
      if (!ALLOWED.has(t)) return "";
      if (tag.startsWith("</")) return `</${t}>`;
      if (t === "a") {
        const href = /\bhref\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs);
        const url = (href?.[2] ?? href?.[3] ?? "").trim();
        return /^https?:\/\//i.test(url) ? `<a href="${url.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">` : "<a>";
      }
      if (t === "td" || t === "th") {
        const span = /\b(colspan|rowspan)\s*=\s*["']?(\d{1,2})/gi;
        const keep = [...attrs.matchAll(span)].map((m) => `${m[1].toLowerCase()}="${m[2]}"`).join(" ");
        return keep ? `<${t} ${keep}>` : `<${t}>`;
      }
      return `<${t}>`;
    });
}

/** Older posts on the website are Markdown, newer ones HTML. */
const isHtml = (text: string) => /<(p|h[1-6]|ul|ol|div|table|br)\b/i.test(text);

const escapeHtml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inlineMd(t: string): string {
  return escapeHtml(t)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

/** The Markdown the website's older posts use: headings, lists, tables, rules, quotes. */
function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | null = null;
  const flushPara = () => { if (para.length) out.push(`<p>${inlineMd(para.join(" "))}</p>`); para = []; };
  const flushList = () => { if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inlineMd(i)}</li>`).join("")}</${list.tag}>`); list = null; };
  const flush = () => { flushPara(); flushList(); };
  const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t) { flush(); continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(t);
    if (h) { flush(); const tag = h[1].length <= 2 ? "h2" : h[1].length === 3 ? "h3" : "h4"; out.push(`<${tag}>${inlineMd(h[2].replace(/#+$/, "").trim())}</${tag}>`); continue; }
    if (/^([-*_])(\s*\1){2,}$/.test(t)) { flush(); out.push("<hr>"); continue; }

    // Table: a header row, a |---| row, then body rows.
    if (t.startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      flush();
      const head = cells(t);
      const body: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) body.push(cells(lines[i++]));
      i--;
      out.push(`<table><thead><tr>${head.map((c) => `<th>${inlineMd(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inlineMd(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }

    const ul = /^[-*+]\s+(.*)$/.exec(t);
    const ol = /^\d+[.)]\s+(.*)$/.exec(t);
    if (ul || ol) {
      flushPara();
      const tag = ul ? "ul" : "ol";
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    if (t.startsWith(">")) { flush(); out.push(`<blockquote>${inlineMd(t.replace(/^>\s?/, ""))}</blockquote>`); continue; }

    // A wrapped line continues the list item above it.
    if (list && /^\s/.test(line)) { list.items[list.items.length - 1] += " " + t; continue; }
    flushList();
    para.push(t);
  }
  flush();
  return out.join("\n");
}

async function load(): Promise<Cache> {
  const cached = global.__lmsBlogCache;
  if (cached && Date.now() - cached.at < TTL_MS) return cached;

  const base = process.env.WEBSITE_URL?.trim() || "https://clatians.com";
  try {
    const res = await fetch(new URL("/api/blogs", base), {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`/api/blogs returned ${res.status}`);
    const data: unknown = await res.json();
    if (!Array.isArray(data)) throw new Error("/api/blogs did not return a list");

    const content = new Map<string, string>();
    const posts = (data as RawBlog[])
      .filter((b) => str(b.slug) && str(b.title))
      .map((b): BlogPost => {
        const slug = str(b.slug);
        content.set(slug, str(b.content));
        const date = str(b.date);
        return {
          slug,
          title: str(b.title),
          excerpt: str(b.excerpt),
          category: str(b.category) || "Articles",
          categoryColor: str(b.categoryColor) || "#08BD80",
          author: str(b.author) || "CLATians",
          date,
          isoDate: isoOf(date),
          readTime: str(b.readTime),
          tags: Array.isArray(b.tags) ? b.tags.filter((t): t is string => typeof t === "string") : [],
        };
      })
      .sort((a, b) => b.isoDate.localeCompare(a.isoDate));

    const fresh = { at: Date.now(), posts, content };
    global.__lmsBlogCache = fresh;
    return fresh;
  } catch (e) {
    // Keep showing the last good copy if the website is briefly unreachable.
    if (cached) return cached;
    throw e;
  }
}

export async function listBlogPostsAction(): Promise<{ ok: true; posts: BlogPost[] } | { ok: false; error: string }> {
  await requireRole(["student", "teacher", "admin"]);
  try {
    return { ok: true, posts: (await load()).posts };
  } catch {
    return { ok: false, error: "Couldn't reach clatians.com. Check your connection and try again." };
  }
}

export async function getBlogPostAction(slug: string): Promise<{ ok: true; post: BlogPost; html: string } | { ok: false; error: string }> {
  await requireRole(["student", "teacher", "admin"]);
  try {
    const cache = await load();
    const post = cache.posts.find((p) => p.slug === slug);
    if (!post) return { ok: false, error: "This article is no longer on the website." };
    const raw = cache.content.get(slug) ?? "";
    return { ok: true, post, html: cleanHtml(isHtml(raw) ? raw : markdownToHtml(raw)) };
  } catch {
    return { ok: false, error: "Couldn't reach clatians.com. Check your connection and try again." };
  }
}
