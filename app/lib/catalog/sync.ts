"server-only";

import { seedDemoSyllabus } from "./demo-syllabus";
import { db, newId } from "../db";
import { courses as bundledCourses, type Course } from "./courses";
import { batches as bundledBatches, type Batch } from "./batches";
import { defaultCourseCategories, type CourseCategory } from "./categories";
import { facultyMembers, type FacultyMember } from "./faculty";
import { SEED_NOTES, SEED_CURRENT_AFFAIRS, SEED_PAPERS, type SeedNote, type SeedPaper } from "./study-content";

// ────────────────────────────────────────────────────────────
// Catalog sync — mirrors the CLATians website's course catalog into the LMS.
//
// The website (Alok16012/clatinsweb) owns the catalog: courses, batches,
// categories and faculty. The LMS mirrors it so students see the same courses
// here as on clatians.com, and so enrollments / content / tests can hang off
// the same course rows.
//
// Source of truth, in order:
//   1. The live site, when WEBSITE_URL is set — GET /api/courses, /api/batches,
//      /api/course-categories. Those endpoints return exactly the shapes in
//      ./courses.ts and ./batches.ts, so both paths share this code.
//   2. Otherwise the bundled mirror in this folder.
//
// The sync only ever inserts and updates, never deletes: course rows are
// referenced by enrollments, content, tests, live classes and payments.
// ────────────────────────────────────────────────────────────

export type CatalogSource = "website" | "bundled";

export type SyncResult = {
  source: CatalogSource;
  websiteUrl: string | null;
  courses: number;
  batches: number;
  categories: number;
  subjects: number;
  faculty: number;
  warnings: string[];
};

/**
 * The seed ships three demo courses that already carry content, live classes,
 * tests, doubts, payments and enrollments. Rather than orphan them beside the
 * real catalog, the first sync adopts them: the matching website course claims
 * the existing row (and its id), so every foreign key survives.
 */
const LEGACY_ADOPTIONS: Record<string, string> = {
  clat: "CLAT 2026",
  "clat-online": "CLAT 2027 Foundation",
  booster: "CLAT Crash Course",
};

/** "₹1,10,000" → 110000 · "Free" → 0 · "" → 0 */
export function parseFee(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : 0;
  if (!value) return 0;
  const digits = String(value).replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

const json = (v: unknown) => JSON.stringify(v ?? []);

async function fetchCatalog<T>(base: string, path: string, warnings: string[]): Promise<T[] | null> {
  try {
    const res = await fetch(new URL(path, base), {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      warnings.push(`${path} returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      warnings.push(`${path} did not return an array`);
      return null;
    }
    return data as T[];
  } catch (e) {
    warnings.push(`${path} failed: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
}

// ── Upserts ─────────────────────────────────────────────────

async function upsertCategories(rows: CourseCategory[]): Promise<number> {
  let n = 0;
  for (let i = 0; i < rows.length; i++) {
    const c = rows[i];
    if (!c?.key) continue;
    await db.prepare(
      `INSERT INTO course_categories (id, key, label, icon, color, accent, bg, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (key) DO UPDATE SET
         label = EXCLUDED.label, icon = EXCLUDED.icon, color = EXCLUDED.color,
         accent = EXCLUDED.accent, bg = EXCLUDED.bg, sort_order = EXCLUDED.sort_order`
    ).run(newId(), c.key, c.label, c.icon ?? "📚", c.color ?? "", c.accent ?? "", c.bg ?? "", i);
    n++;
  }
  return n;
}

async function upsertCourses(rows: Course[]): Promise<number> {
  let n = 0;
  for (let i = 0; i < rows.length; i++) {
    const c = rows[i];
    if (!c?.slug) continue;

    // Find the row this course should write to: by slug, else by adopting the
    // legacy demo course of the same name (one-time, see LEGACY_ADOPTIONS).
    const bySlug = await db.prepare("SELECT id FROM courses WHERE slug = ?").get(c.slug) as { id: string } | undefined;
    let id = bySlug?.id;
    if (!id) {
      const legacyName = LEGACY_ADOPTIONS[c.slug];
      if (legacyName) {
        const legacy = await db.prepare(
          "SELECT id FROM courses WHERE name = ? AND slug IS NULL"
        ).get(legacyName) as { id: string } | undefined;
        id = legacy?.id;
      }
    }

    // Shared tail, in the column order both statements below use.
    // `description` mirrors the tagline — that's the card subtitle in the app.
    const head = [c.slug, c.title, c.tagline || ""];
    const tail = [
      c.category || "offline", c.icon || "📚", c.color || "", c.bg || "",
      c.tagline || "", c.overview || "", c.duration || "", c.batchSize || "", c.mode || "",
      c.fee || "", parseFee(c.fee), c.emi || "",
      json(c.features), json(c.includes), json(c.curriculum), json(c.whoFor),
      JSON.stringify(c.testimonial ?? {}), i,
    ];

    if (id) {
      await db.prepare(
        `UPDATE courses SET slug = ?, name = ?, description = ?, category = ?, icon = ?, color = ?, bg = ?,
           tagline = ?, overview = ?, duration = ?, batch_size = ?, mode = ?,
           fee_text = ?, price = ?, emi = ?,
           features = ?, includes = ?, curriculum = ?, who_for = ?, testimonial = ?, sort_order = ?
         WHERE id = ?`
      ).run(...head, ...tail, id);
    } else {
      await db.prepare(
        `INSERT INTO courses (id, slug, name, description, category, icon, color, bg,
           tagline, overview, duration, batch_size, mode, fee_text, price, emi,
           features, includes, curriculum, who_for, testimonial, sort_order, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
      ).run(newId(), ...head, ...tail);
    }
    n++;
  }
  return n;
}

async function upsertBatches(rows: Batch[]): Promise<number> {
  let n = 0;
  for (const b of rows) {
    if (!b?.slug) continue;
    const course = b.courseSlug
      ? (await db.prepare("SELECT id FROM courses WHERE slug = ?").get(b.courseSlug)) as { id: string } | undefined
      : undefined;

    const values = [
      b.name, course?.id ?? null, b.category || "offline", b.exam || "", b.batchCode || "",
      b.startDate || "", b.endDate || "", b.duration || "", b.schedule || "", b.mode || "",
      b.seats ?? 0, b.filled ?? 0, parseFee(b.fee), parseFee(b.originalFee),
      b.emi || "", b.offer || "", b.color || "", b.bg || "", b.status || "upcoming",
      b.language || "Hinglish", b.batchType || "",
      json(b.chips), json(b.faculty), json(b.highlights), json(b.syllabus),
      b.description || "", JSON.stringify(b.details ?? {}),
    ];

    const existing = await db.prepare("SELECT id FROM batches WHERE slug = ?").get(b.slug) as { id: string } | undefined;
    if (existing) {
      // `filled` is left alone — LMS enrollments own it once students join.
      await db.prepare(
        `UPDATE batches SET name = ?, course_id = ?, category = ?, exam = ?, batch_code = ?,
           start_date = ?, end_date = ?, duration = ?, schedule = ?, mode = ?,
           seats = ?, filled = GREATEST(filled, ?), fee = ?, original_fee = ?,
           emi = ?, offer = ?, color = ?, bg = ?, status = ?, language = ?, batch_type = ?,
           chips = ?, faculty = ?, highlights = ?, syllabus = ?, description = ?, details = ?
         WHERE id = ?`
      ).run(...values, existing.id);
    } else {
      await db.prepare(
        `INSERT INTO batches (id, slug, name, course_id, category, exam, batch_code,
           start_date, end_date, duration, schedule, mode, seats, filled, fee, original_fee,
           emi, offer, color, bg, status, language, batch_type,
           chips, faculty, highlights, syllabus, description, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(newId(), b.slug, ...values);
    }
    n++;
  }
  return n;
}

/**
 * The CLAT syllabus subjects modules hang off. The website has no subjects
 * endpoint — these are the exam's own sections, so they are fixed here.
 */
const SUBJECTS = [
  { name: "English Language", slug: "english", icon: "📖", color: "#0891B2" },
  { name: "Legal Reasoning", slug: "legal-reasoning", icon: "⚖️", color: "var(--error-text)" },
  { name: "Logical Reasoning", slug: "logical-reasoning", icon: "🧩", color: "var(--purple)" },
  { name: "Current Affairs & GK", slug: "current-affairs", icon: "📰", color: "var(--green)" },
  { name: "Quantitative Techniques", slug: "quantitative", icon: "🔢", color: "var(--warning-text)" },
];

async function upsertSubjects(): Promise<number> {
  for (let i = 0; i < SUBJECTS.length; i++) {
    const s = SUBJECTS[i];
    await db.prepare(
      `INSERT INTO subjects (id, name, slug, icon, color, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon`
    ).run(newId(), s.name, s.slug, s.icon, s.color, i);
  }
  return SUBJECTS.length;
}

async function upsertFaculty(rows: FacultyMember[]): Promise<number> {
  let n = 0;
  for (let i = 0; i < rows.length; i++) {
    const f = rows[i];
    if (!f?.name) continue;
    const existing = await db.prepare("SELECT id FROM faculty WHERE name = ?").get(f.name) as { id: string } | undefined;
    const values = [
      f.designation || "", f.subject || "", f.specialization || "", f.rating ?? 0,
      f.students || "", f.experience || "", f.avatar || "", f.photo || "",
      f.color || "var(--blue-dark)", f.bg || "var(--info-border)",
      json(f.tags), f.bio || "", json(f.education), json(f.achievements),
      json(f.courses), json(f.expertise), i,
    ];
    if (existing) {
      await db.prepare(
        `UPDATE faculty SET designation = ?, subject = ?, specialization = ?, rating = ?,
           students_count = ?, experience = ?, avatar = ?, photo = ?, color = ?, bg = ?,
           tags = ?, bio = ?, education = ?, achievements = ?, courses = ?, expertise = ?, sort_order = ?
         WHERE id = ?`
      ).run(...values, existing.id);
    } else {
      await db.prepare(
        `INSERT INTO faculty (id, name, designation, subject, specialization, rating,
           students_count, experience, avatar, photo, color, bg,
           tags, bio, education, achievements, courses, expertise, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(newId(), f.name, ...values);
    }
    n++;
  }
  return n;
}

// ── Entry point ─────────────────────────────────────────────

/**
 * Mirror the website catalog into the LMS. Safe to run repeatedly — every write
 * is an upsert keyed on the website's own slug (or category key / faculty name).
 */
export async function syncCatalog(): Promise<SyncResult> {
  const warnings: string[] = [];
  const base = process.env.WEBSITE_URL?.trim() || null;

  let courses: Course[] | null = null;
  let batches: Batch[] | null = null;
  let categories: CourseCategory[] | null = null;

  if (base) {
    courses = await fetchCatalog<Course>(base, "/api/courses", warnings);
    batches = await fetchCatalog<Batch>(base, "/api/batches", warnings);
    categories = await fetchCatalog<CourseCategory>(base, "/api/course-categories", warnings);
  }

  const source: CatalogSource = courses?.length ? "website" : "bundled";
  if (base && source === "bundled") warnings.push("Live site unreachable — used the bundled mirror.");

  const result: SyncResult = {
    source,
    websiteUrl: base,
    categories: await upsertCategories(categories?.length ? categories : defaultCourseCategories),
    courses: await upsertCourses(courses?.length ? courses : bundledCourses),
    batches: await upsertBatches(batches?.length ? batches : bundledBatches),
    subjects: await upsertSubjects(),
    faculty: await upsertFaculty(facultyMembers),
    warnings,
  };
  return result;
}

declare global {
  var __lmsCatalogReady: Promise<void> | undefined;
}

/**
 * Run the sync once, the first time the app needs a catalog. After the first
 * success in a process it costs nothing — no database round trip at all. The seed can't do this work
 * itself: it runs inside init()'s transaction, and syncCatalog() goes through
 * db.prepare(), which waits on that same init.
 */
export function ensureCatalog(): Promise<void> {
  if (!global.__lmsCatalogReady) {
    global.__lmsCatalogReady = runEnsureCatalog().catch((e) => {
      global.__lmsCatalogReady = undefined; // retry on the next request
      throw e;
    });
  }
  return global.__lmsCatalogReady;
}

async function runEnsureCatalog(): Promise<void> {
  // `meta` acts as the claim: whoever inserts the key does the work, and every
  // concurrent request sees the row already there and skips. Without this,
  // parallel first-loads each run the seed and the content lands many times over.
  const claimCatalog = await db.prepare(
    "INSERT INTO meta (key) VALUES ('catalog_synced') ON CONFLICT DO NOTHING"
  ).run();
  if (claimCatalog.changes === 1) {
    try {
      await syncCatalog();
    } catch (e) {
      await db.prepare("DELETE FROM meta WHERE key = 'catalog_synced'").run();
      throw e;
    }
  }

  // Papers reference courses by slug, so this runs after the catalog exists.
  const claimContent = await db.prepare(
    "INSERT INTO meta (key) VALUES ('study_content') ON CONFLICT DO NOTHING"
  ).run();
  if (claimContent.changes === 1) {
    try {
      await seedStudyContent();
    } catch (e) {
      await db.prepare("DELETE FROM meta WHERE key = 'study_content'").run();
      throw e;
    }
  }

  // Starter subject → chapter → topic content and the comprehension tests.
  const claimSyllabus = await db.prepare(
    "INSERT INTO meta (key) VALUES ('demo_syllabus_v1') ON CONFLICT DO NOTHING"
  ).run();
  if (claimSyllabus.changes !== 1) return;
  try {
    await seedDemoSyllabus(await contentAuthorId());
  } catch (e) {
    await db.prepare("DELETE FROM meta WHERE key = 'demo_syllabus_v1'").run();
    throw e;
  }
}

// ────────────────────────────────────────────────────────────
// Study content — the notes, current-affairs digests, practice papers and
// mock papers the app ships with. Seeded once; never overwritten afterwards,
// so an admin's edits always win.
// ────────────────────────────────────────────────────────────

/** Whoever the content is credited to — a teacher if there is one, else the admin. */
async function contentAuthorId(): Promise<string | null> {
  const row = await db.prepare(
    "SELECT id FROM users WHERE role IN ('teacher','admin') ORDER BY CASE role WHEN 'teacher' THEN 0 ELSE 1 END LIMIT 1"
  ).get() as { id: string } | undefined;
  return row?.id ?? null;
}

async function seedNotes(rows: SeedNote[], authorId: string | null): Promise<number> {
  let n = 0;
  for (const note of rows) {
    const exists = await db.prepare("SELECT 1 FROM content WHERE title = ?").get(note.title);
    if (exists) continue;
    // course_id NULL = shared CLAT material, visible to every enrolled student.
    await db.prepare(
      `INSERT INTO content (id, title, type, body, status, author_id, course_id)
       VALUES (?, ?, ?, ?, 'approved', ?, NULL)`
    ).run(newId(), note.title, note.type, note.body, authorId);
    n++;
  }
  return n;
}

async function seedPapers(rows: SeedPaper[], authorId: string | null): Promise<number> {
  let n = 0;
  for (const paper of rows) {
    const exists = await db.prepare("SELECT 1 FROM tests WHERE title = ?").get(paper.title);
    if (exists) continue;

    const course = paper.courseSlug
      ? (await db.prepare("SELECT id FROM courses WHERE slug = ?").get(paper.courseSlug)) as { id: string } | undefined
      : undefined;
    // A paper for a course nobody has synced yet would be invisible; skip it
    // rather than silently publishing it to everyone.
    if (paper.courseSlug && !course) continue;

    const testId = newId();
    await db.prepare(
      `INSERT INTO tests (id, title, description, type, course_id, duration_min, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'published', ?)`
    ).run(testId, paper.title, paper.description, paper.type, course?.id ?? null, paper.durationMin, authorId);

    for (let i = 0; i < paper.questions.length; i++) {
      const q = paper.questions[i];
      await db.prepare(
        `INSERT INTO questions (id, test_id, subject, passage, text, opt_a, opt_b, opt_c, opt_d, correct, explanation, order_idx)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(newId(), testId, q.subject, q.passage ?? "", q.text, q.a, q.b, q.c, q.d, q.correct, q.explanation, i);
    }
    n++;
  }
  return n;
}

export type StudyContentResult = { notes: number; currentAffairs: number; papers: number };

/** Idempotent — each item is keyed on its title and inserted only once. */
export async function seedStudyContent(): Promise<StudyContentResult> {
  const authorId = await contentAuthorId();
  return {
    notes: await seedNotes(SEED_NOTES, authorId),
    currentAffairs: await seedNotes(SEED_CURRENT_AFFAIRS, authorId),
    papers: await seedPapers(SEED_PAPERS, authorId),
  };
}
