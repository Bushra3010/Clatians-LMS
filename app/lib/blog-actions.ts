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

function isoOf(date: string): string {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/.exec(date.trim());
  if (m) {
    const month = MONTHS.indexOf(m[2].toLowerCase());
    if (month >= 0) return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  const t = Date.parse(date);
  return Number.isNaN(t) ? "" : new Date(t).toISOString().slice(0, 10);
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** The tags the reader styles; everything else is unwrapped to its text. */
const ALLOWED = new Set(["h2", "h3", "h4", "p", "strong", "b", "em", "i", "u", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "br", "hr", "blockquote", "a", "span", "sup", "sub"]);

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
    return { ok: true, post, html: cleanHtml(cache.content.get(slug) ?? "") };
  } catch {
    return { ok: false, error: "Couldn't reach clatians.com. Check your connection and try again." };
  }
}
