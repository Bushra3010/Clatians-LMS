import "server-only";
import { Pool, types, type PoolClient } from "pg";
import { scryptSync, randomBytes, createHash } from "node:crypto";
import { VOCAB, CA_QUIZ, NLUS } from "./clat-data";

// ────────────────────────────────────────────────────────────
// Connection — PostgreSQL (Supabase in prod).
// Set DATABASE_URL (the Supabase connection string, ideally the pooler /
// "Transaction" URI on port 6543) in the environment, e.g. on Vercel.
// ────────────────────────────────────────────────────────────
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL;

// Postgres returns int8 / bigint (e.g. COUNT(*)) as a string by default.
// Parse it to a JS number so all the app's numeric code keeps working exactly
// as it did under SQLite.
types.setTypeParser(20, (v) => parseInt(v, 10));

declare global {
  // eslint-disable-next-line no-var
  var __lmsPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __lmsInit: Promise<void> | undefined;
}

const pool: Pool =
  global.__lmsPool ??
  new Pool({
    connectionString,
    // Supabase requires TLS; its chain isn't in Node's default trust store,
    // so accept it without local verification (standard for Supabase clients).
    // A local dev Postgres has no TLS at all, so skip SSL for localhost.
    ssl: connectionString && !/localhost|127\.0\.0\.1/.test(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
    // Pages fire their independent queries in parallel; the pooler (port 6543)
    // multiplexes these onto a small set of real Postgres connections.
    max: 8,
    idleTimeoutMillis: 10_000,
  });
global.__lmsPool = pool;

/** Convert better-sqlite3 style `?` placeholders to Postgres `$1, $2, …`. */
function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => "$" + ++i);
}

/** Run schema + seed exactly once per process (lazy — on first query). */
function ensure(): Promise<void> {
  if (!global.__lmsInit) {
    // If init fails (e.g. a transient connection blip), clear the cached
    // promise so the next request retries instead of failing forever.
    global.__lmsInit = init().catch((e) => {
      global.__lmsInit = undefined;
      throw e;
    });
  }
  return global.__lmsInit;
}

// ────────────────────────────────────────────────────────────
// better-sqlite3-compatible async facade: await db.prepare(sql).get/all/run(...args)
// ────────────────────────────────────────────────────────────
function stmt(sql: string) {
  const text = toPg(sql);
  return {
    async get<T = Record<string, unknown>>(...args: unknown[]): Promise<T | undefined> {
      await ensure();
      const rs = await pool.query(text, args);
      return rs.rows[0] as T | undefined;
    },
    async all<T = Record<string, unknown>>(...args: unknown[]): Promise<T[]> {
      await ensure();
      const rs = await pool.query(text, args);
      return rs.rows as T[];
    },
    async run(...args: unknown[]): Promise<{ changes: number }> {
      await ensure();
      const rs = await pool.query(text, args);
      return { changes: rs.rowCount ?? 0 };
    },
  };
}

export const db = {
  prepare: (sql: string) => stmt(sql),
  /** Raw pg pool — for multi-statement / transactional work. */
  pool,
};

export function newId(): string {
  return randomBytes(9).toString("hex");
}

function hashPasswordSync(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

// UTC timestamp string in the exact "YYYY-MM-DD HH:MM:SS" shape SQLite's
// datetime('now') produced, so created_at values keep parsing/formatting the
// same across the app.
const NOW = "to_char((now() at time zone 'utc'), 'YYYY-MM-DD HH24:MI:SS')";
// Microsecond-precision variant — used where rows are inserted in rapid
// succession and must sort deterministically (AI chat messages).
const NOW_US = "to_char((now() at time zone 'utc'), 'YYYY-MM-DD HH24:MI:SS.US')";

// ────────────────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────────────────
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'student',
    status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_prefs TEXT NOT NULL DEFAULT '{"push":true,"email":true,"sms":false}';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_credit INTEGER NOT NULL DEFAULT 0;
  CREATE TABLE IF NOT EXISTS guardian_links (
    guardian_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT ${NOW}, PRIMARY KEY (guardian_id, student_id)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active', price INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  -- Catalog columns mirrored from the CLATians website's \`courses\` table, so a
  -- course looks the same in the app as it does on clatians.com. \`price\` stays
  -- the integer the checkout charges; \`fee_text\` is the website's display string.
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug TEXT;
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'offline';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT '📚';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'var(--blue-dark)';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS bg TEXT NOT NULL DEFAULT 'var(--info-border)';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT '';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS overview TEXT NOT NULL DEFAULT '';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration TEXT NOT NULL DEFAULT '';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS batch_size TEXT NOT NULL DEFAULT '';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT '';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS fee_text TEXT NOT NULL DEFAULT '';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS emi TEXT NOT NULL DEFAULT '';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS features TEXT NOT NULL DEFAULT '[]';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS includes TEXT NOT NULL DEFAULT '[]';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS curriculum TEXT NOT NULL DEFAULT '[]';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS who_for TEXT NOT NULL DEFAULT '[]';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS testimonial TEXT NOT NULL DEFAULT '{}';
  ALTER TABLE courses ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
  CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_key ON courses (slug) WHERE slug IS NOT NULL;
  -- The course a student has picked in the app (before or without buying it);
  -- it heads their home screen. Enrolled courses take precedence.
  ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_course_id TEXT REFERENCES courses(id) ON DELETE SET NULL;
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL, amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'paid', method TEXT NOT NULL DEFAULT 'upi',
    invoice_no TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS enrollments (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT ${NOW}, PRIMARY KEY (user_id, course_id)
  );
  CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL, created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS live_classes (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, subject TEXT NOT NULL DEFAULT '',
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE, teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    start_at TEXT NOT NULL, duration_min INTEGER NOT NULL DEFAULT 60, join_url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'scheduled', recording_url TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS class_attendance (
    class_id TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TEXT NOT NULL DEFAULT ${NOW}, present INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (class_id, user_id)
  );
  -- In-class chat. Private by design: each student has one thread with the
  -- class's teacher, and no student ever sees another student's messages.
  CREATE TABLE IF NOT EXISTS class_messages (
    id TEXT PRIMARY KEY, class_id TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    sender_role TEXT NOT NULL DEFAULT 'student', body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ${NOW_US}
  );
  CREATE INDEX IF NOT EXISTS class_messages_thread ON class_messages (class_id, student_id, created_at);
  CREATE TABLE IF NOT EXISTS doubts (
    id TEXT PRIMARY KEY, student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL, subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', answer TEXT NOT NULL DEFAULT '',
    answered_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS doubt_messages (
    id TEXT PRIMARY KEY, doubt_id TEXT NOT NULL REFERENCES doubts(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    sender_role TEXT NOT NULL DEFAULT 'student', body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ${NOW_US}
  );
  CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT 'mock', course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    duration_min INTEGER NOT NULL DEFAULT 60, status TEXT NOT NULL DEFAULT 'draft',
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY, test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    subject TEXT NOT NULL DEFAULT '', text TEXT NOT NULL, opt_a TEXT NOT NULL, opt_b TEXT NOT NULL,
    opt_c TEXT NOT NULL, opt_d TEXT NOT NULL, correct TEXT NOT NULL, marks REAL NOT NULL DEFAULT 1,
    negative REAL NOT NULL DEFAULT 0.25, order_idx INTEGER NOT NULL DEFAULT 0
  );
  -- The written solution shown in review. Practice papers always carry one;
  -- mocks may leave it blank and fall back to the AI explanation.
  ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT NOT NULL DEFAULT '';
  -- Passage-based sections (Reading Comprehension, Legal Principle + Facts) share
  -- one stimulus across several questions; blank for standalone questions.
  ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage TEXT NOT NULL DEFAULT '';
  CREATE TABLE IF NOT EXISTS test_attempts (
    id TEXT PRIMARY KEY, test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, score REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0, correct_cnt INTEGER NOT NULL DEFAULT 0, wrong_cnt INTEGER NOT NULL DEFAULT 0,
    unattempted INTEGER NOT NULL DEFAULT 0, answers TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'in_progress', started_at TEXT NOT NULL DEFAULT ${NOW}, submitted_at TEXT
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info', title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
    is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS content_progress (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT ${NOW}, PRIMARY KEY (user_id, content_id)
  );
  CREATE TABLE IF NOT EXISTS practice_sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL DEFAULT '', subject TEXT NOT NULL DEFAULT '', difficulty TEXT NOT NULL DEFAULT 'medium',
    total INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS booking_slots (
    id TEXT PRIMARY KEY, teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_at TEXT NOT NULL, duration_min INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'open', booked_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    topic TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL, audience TEXT NOT NULL DEFAULT 'All students',
    recipients INTEGER NOT NULL DEFAULT 0, sent_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS study_tasks (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, due_date TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT ${NOW}, updated_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '',
    interest TEXT NOT NULL DEFAULT '', demo_date TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new', notes TEXT NOT NULL DEFAULT '',
    referred_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT ${NOW}, updated_at TEXT NOT NULL DEFAULT ${NOW}
  );
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES users(id) ON DELETE SET NULL;
  ALTER TABLE leads ADD COLUMN IF NOT EXISTS reward_given INTEGER NOT NULL DEFAULT 0;
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY, actor_id TEXT, actor_name TEXT NOT NULL DEFAULT '', actor_role TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS saved_items (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL, item_key TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '', subtitle TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT ${NOW}, PRIMARY KEY (user_id, kind, item_key)
  );
  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
    data TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'published',
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL, order_idx INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS ai_threads (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New chat', created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS ai_messages (
    id TEXT PRIMARY KEY, thread_id TEXT NOT NULL REFERENCES ai_threads(id) ON DELETE CASCADE,
    role TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT ${NOW_US}
  );
  CREATE TABLE IF NOT EXISTS course_categories (
    id TEXT PRIMARY KEY, key TEXT NOT NULL UNIQUE, label TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT 'var(--blue-dark)',
    accent TEXT NOT NULL DEFAULT 'var(--blue-dark)', bg TEXT NOT NULL DEFAULT 'var(--info-border)',
    sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '', icon TEXT NOT NULL DEFAULT '📖',
    color TEXT NOT NULL DEFAULT 'var(--blue-dark)', sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY, module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'video',
    body TEXT NOT NULL DEFAULT '', video_url TEXT NOT NULL DEFAULT '',
    duration_min INTEGER NOT NULL DEFAULT 0, is_free INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  -- A lesson is a syllabus *topic*: one place holding its video (video_url),
  -- written notes (body), an optional notes PDF/link, a practice test and the
  -- doubts students raise about it.
  ALTER TABLE lessons ADD COLUMN IF NOT EXISTS notes_url TEXT NOT NULL DEFAULT '';
  ALTER TABLE lessons ADD COLUMN IF NOT EXISTS test_id TEXT REFERENCES tests(id) ON DELETE SET NULL;
  ALTER TABLE doubts ADD COLUMN IF NOT EXISTS lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL;
  CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed INTEGER NOT NULL DEFAULT 0, watch_seconds INTEGER NOT NULL DEFAULT 0,
    last_position_sec INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT ${NOW},
    PRIMARY KEY (user_id, lesson_id)
  );
  CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'offline', exam TEXT NOT NULL DEFAULT '',
    batch_code TEXT NOT NULL DEFAULT '', start_date TEXT NOT NULL DEFAULT '',
    end_date TEXT NOT NULL DEFAULT '', duration TEXT NOT NULL DEFAULT '',
    schedule TEXT NOT NULL DEFAULT '', mode TEXT NOT NULL DEFAULT '',
    seats INTEGER NOT NULL DEFAULT 30, filled INTEGER NOT NULL DEFAULT 0,
    fee INTEGER NOT NULL DEFAULT 0, original_fee INTEGER NOT NULL DEFAULT 0,
    emi TEXT NOT NULL DEFAULT '', offer TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'var(--blue-dark)', bg TEXT NOT NULL DEFAULT 'var(--info-border)',
    status TEXT NOT NULL DEFAULT 'upcoming', language TEXT NOT NULL DEFAULT 'Hinglish',
    batch_type TEXT NOT NULL DEFAULT '', chips TEXT NOT NULL DEFAULT '[]',
    faculty TEXT NOT NULL DEFAULT '[]', highlights TEXT NOT NULL DEFAULT '[]',
    syllabus TEXT NOT NULL DEFAULT '[]', description TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS batch_enrollments (
    id TEXT PRIMARY KEY, batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active', amount INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS faculty (
    id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL, designation TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '', specialization TEXT NOT NULL DEFAULT '',
    rating REAL NOT NULL DEFAULT 0, students_count TEXT NOT NULL DEFAULT '',
    experience TEXT NOT NULL DEFAULT '', avatar TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT 'var(--blue-dark)',
    bg TEXT NOT NULL DEFAULT 'var(--info-border)', tags TEXT NOT NULL DEFAULT '[]',
    bio TEXT NOT NULL DEFAULT '', education TEXT NOT NULL DEFAULT '[]',
    achievements TEXT NOT NULL DEFAULT '[]', courses TEXT NOT NULL DEFAULT '[]',
    expertise TEXT NOT NULL DEFAULT '[]', sort_order INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS faculty_assignments (
    id TEXT PRIMARY KEY, faculty_id TEXT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    batch_id TEXT REFERENCES batches(id) ON DELETE SET NULL,
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    subject TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT 'faculty',
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS mentorship_programs (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'mentorship', exam TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '', overview TEXT NOT NULL DEFAULT '',
    duration TEXT NOT NULL DEFAULT '', batch_size TEXT NOT NULL DEFAULT '',
    mode TEXT NOT NULL DEFAULT 'Online', fee INTEGER NOT NULL DEFAULT 0,
    original_fee INTEGER NOT NULL DEFAULT 0, emi TEXT NOT NULL DEFAULT '',
    features TEXT NOT NULL DEFAULT '[]', includes TEXT NOT NULL DEFAULT '[]',
    curriculum TEXT NOT NULL DEFAULT '[]', who_for TEXT NOT NULL DEFAULT '[]',
    color TEXT NOT NULL DEFAULT 'var(--purple)', bg TEXT NOT NULL DEFAULT '#EDE9FE',
    sort_order INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE IF NOT EXISTS mentorship_enrollments (
    id TEXT PRIMARY KEY, program_id TEXT NOT NULL REFERENCES mentorship_programs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active', goals TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id TEXT PRIMARY KEY, enrollment_id TEXT NOT NULL REFERENCES mentorship_enrollments(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT 'session',
    scheduled_at TEXT NOT NULL DEFAULT '', duration_min INTEGER NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'scheduled', notes TEXT NOT NULL DEFAULT '',
    mentor_notes TEXT NOT NULL DEFAULT '', student_notes TEXT NOT NULL DEFAULT '',
    action_items TEXT NOT NULL DEFAULT '[]', feedback TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '', category_color TEXT NOT NULL DEFAULT '#08BD80',
    author TEXT NOT NULL DEFAULT '', author_avatar TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '', read_time TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]', cover_image TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published', sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS exam_calendars (
    id TEXT PRIMARY KEY, exam TEXT NOT NULL UNIQUE, full_name TEXT NOT NULL,
    conducting_body TEXT NOT NULL DEFAULT '', participating_colleges INTEGER NOT NULL DEFAULT 0,
    seats INTEGER NOT NULL DEFAULT 0, duration_min INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0, total_marks INTEGER NOT NULL DEFAULT 150,
    negative_marking REAL NOT NULL DEFAULT 0.25, mode TEXT NOT NULL DEFAULT 'Online',
    sections TEXT NOT NULL DEFAULT '[]', color TEXT NOT NULL DEFAULT 'var(--blue-dark)',
    description TEXT NOT NULL DEFAULT '', important_dates TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS college_predictor (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, short_name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT '', ranking INTEGER NOT NULL DEFAULT 0,
    clat_cutoff_general INTEGER NOT NULL DEFAULT 0, clat_cutoff_obc INTEGER NOT NULL DEFAULT 0,
    clat_cutoff_sc INTEGER NOT NULL DEFAULT 0, clat_cutoff_st INTEGER NOT NULL DEFAULT 0,
    ailet_cutoff_general INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'NLU',
    established INTEGER NOT NULL DEFAULT 0, website TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'var(--blue-dark)', bg TEXT NOT NULL DEFAULT 'var(--info-border)',
    details TEXT NOT NULL DEFAULT '{}'
  );
  -- seedColleges() upserts with ON CONFLICT (name), which needs this index.
  CREATE UNIQUE INDEX IF NOT EXISTS college_predictor_name_key ON college_predictor (name);
  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    due_date TEXT NOT NULL DEFAULT '', total_marks INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'published', created_at TEXT NOT NULL DEFAULT ${NOW}
  );
  CREATE TABLE IF NOT EXISTS assignment_submissions (
    id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL DEFAULT '', file_url TEXT NOT NULL DEFAULT '',
    marks_obtained REAL, feedback TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'submitted', submitted_at TEXT NOT NULL DEFAULT ${NOW}
  );
  -- Supabase exposes every public table through its REST API to anyone holding
  -- the (public) anon key. The app talks to Postgres directly as the table
  -- owner, which RLS doesn't restrict, so RLS with no policies shuts the REST
  -- door without affecting the app. Re-runs with every schema change, so new
  -- tables are covered.
  DO $$ DECLARE r record; BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity LOOP
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
  END $$;
`;

// Advisory-lock key so concurrent serverless instances don't race on the
// initial CREATE TABLE / seed. Any stable bigint works.
const INIT_LOCK = 727727727;

// Schema-create + seed run inside ONE transaction, guarded by a transaction-
// scoped advisory lock. This is safe behind Supabase's transaction pooler
// (a session-level lock could be dropped when the backend is reassigned between
// statements; a transaction-scoped lock is held for the whole transaction and
// released automatically on COMMIT/ROLLBACK). Concurrent initializers serialize
// on the lock; the loser sees the `meta` row already claimed and skips seeding.
// Fingerprint of SCHEMA. Recorded in `meta` once applied, so a cold start
// whose schema is already in place costs one lookup instead of re-running
// every CREATE/ALTER — that DDL batch was a noticeable part of first-load time.
const SCHEMA_KEY = "schema:" + createHash("sha1").update(SCHEMA).digest("hex").slice(0, 16);

async function init(): Promise<void> {
  try {
    const applied = await pool.query("SELECT 1 FROM meta WHERE key = $1", [SCHEMA_KEY]);
    if (applied.rowCount) return;
  } catch {
    // No `meta` table yet — a brand-new database. Fall through and build it.
  }

  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock($1)", [INIT_LOCK]);
    await c.query(SCHEMA);
    const claim = await c.query("INSERT INTO meta (key) VALUES ('seeded') ON CONFLICT DO NOTHING");
    if (claim.rowCount === 1) await seed(c);
    await c.query("INSERT INTO meta (key) VALUES ($1) ON CONFLICT DO NOTHING", [SCHEMA_KEY]);
    await c.query("COMMIT");
  } catch (e) {
    try { await c.query("ROLLBACK"); } catch { /* ignore */ }
    throw e;
  } finally {
    c.release();
  }
}

// ────────────────────────────────────────────────────────────
// Seed — the demo dataset. Called once, inside init()'s transaction, only when
// this process won the `meta` claim.
// ────────────────────────────────────────────────────────────
async function seed(c: PoolClient): Promise<void> {
  {
    const id = () => randomBytes(9).toString("hex");
    const run = (sql: string, args: unknown[] = []) => c.query(toPg(sql), args);

    const adminId = id(), teacherId = id();
    const uSql = "INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)";
    await run(uSql, [adminId, "Platform Admin", "admin@clatlms.in", hashPasswordSync("admin123"), "admin", "active"]);
    await run(uSql, [teacherId, "Anita Rao", "anita@clatlms.in", hashPasswordSync("teach123"), "teacher", "active"]);

    const students: [string, string][] = [
      ["Rahul Sharma", "rahul@student.in"], ["Priya Nair", "priya@student.in"],
      ["Imran Ali", "imran@student.in"], ["Sneha Gupta", "sneha@student.in"],
    ];
    const studentIds: string[] = [];
    for (const [name, email] of students) {
      const sid = id();
      await run(uSql, [sid, name, email, hashPasswordSync("student123"), "student", "active"]);
      studentIds.push(sid);
    }

    const cSql = "INSERT INTO courses (id, name, description, status, price) VALUES (?, ?, ?, ?, ?)";
    const clat2026 = id(), clat2027 = id(), clatCrash = id();
    await run(cSql, [clat2026, "CLAT 2026", "Full-length CLAT 2026 preparation batch.", "active", 18999]);
    await run(cSql, [clat2027, "CLAT 2027 Foundation", "Two-year foundation programme.", "active", 12999]);
    await run(cSql, [clatCrash, "CLAT Crash Course", "60-day intensive sprint before the exam.", "active", 4999]);

    for (let i = 0; i < studentIds.length; i++) {
      await run("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", [studentIds[i], i % 2 === 0 ? clat2026 : clat2027]);
    }

    await run("INSERT INTO payments (id, user_id, course_id, amount, status, method, invoice_no) VALUES (?, ?, ?, ?, 'paid', 'upi', ?)",
      [id(), studentIds[0], clat2026, 18999, "CLT-100001"]);

    const conSql = "INSERT INTO content (id, title, type, body, status, author_id, course_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    await run(conSql, [id(), "Legal Reasoning: Torts Basics", "video", "https://youtu.be/jNQXAC9IVRw", "approved", teacherId, clat2026]);
    await run(conSql, [id(), "Constitution — Handwritten Notes", "notes", "https://www.constituteproject.org/constitution/India_2016.pdf", "approved", teacherId, clat2026]);
    await run(conSql, [id(), "July Current Affairs Digest", "current-affairs", "Weekly compiled current affairs: SC judgements, Parliament bills, and economy highlights.", "approved", teacherId, clat2026]);
    await run(conSql, [id(), "Logical Reasoning Set 4", "practice", "25 practice questions on syllogisms and critical reasoning.", "approved", teacherId, clat2026]);
    await run(conSql, [id(), "English: Reading Comprehension Pack", "notes", "RC practice passages with answer keys.", "pending", teacherId, clat2026]);
    await run(conSql, [id(), "Crash Course: Legal Sprint", "video", "https://youtu.be/jNQXAC9IVRw", "approved", teacherId, clatCrash]);
    await run(conSql, [id(), "Crash Course: 40 Rapid MCQs", "practice", "40 timed questions for the final sprint.", "approved", teacherId, clatCrash]);

    const clsSql = "INSERT INTO live_classes (id, title, subject, course_id, teacher_id, start_at, duration_min, join_url, status, recording_url, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const iso = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
    const yt = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
    await run(clsSql, [id(), "Landmark SC Judgements", "Legal Reasoning", clat2026, teacherId, iso(-15), 90, yt, "live", "", "Bring the case list PDF."]);
    await run(clsSql, [id(), "Reading Comprehension Drills", "English & GK", clat2026, teacherId, iso(180), 60, yt, "scheduled", "", ""]);
    await run(clsSql, [id(), "Number Systems & Averages", "Quantitative", clat2026, teacherId, iso(1440), 60, yt, "scheduled", "", ""]);
    const endedClassId = id();
    await run(clsSql, [endedClassId, "Constitution: Preamble & Rights", "Legal Reasoning", clat2026, teacherId, iso(-2880), 75, "", "ended", "https://youtu.be/jNQXAC9IVRw", "Full recording of the session."]);
    await run("INSERT INTO class_attendance (class_id, user_id) VALUES (?, ?)", [endedClassId, studentIds[0]]);

    const rahulId = studentIds[0];
    const dSql = "INSERT INTO doubts (id, student_id, course_id, subject, body, status, answer, answered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    await run(dSql, [id(), rahulId, clat2026, "Legal Reasoning", "If a principle says 'no person shall be deprived of life except by procedure established by law' and the facts say police shot someone without an FIR — what's the answer?", "answered", "The action violates Article 21 — there was no procedure established by law, so it is unconstitutional. Apply only the given principle to the facts.", teacherId]);
    await run(dSql, [id(), rahulId, clat2026, "English", "How do I finish all 5 reading-comprehension passages within 45 minutes?", "open", "", null]);

    const testId = id();
    await run("INSERT INTO tests (id, title, description, type, course_id, duration_min, status, created_by) VALUES (?, ?, ?, 'mock', ?, 30, 'published', ?)",
      [testId, "CLAT 2026 — Full Mock 1", "Full-length pattern mock covering all sections.", clat2026, teacherId]);
    const qSql = "INSERT INTO questions (id, test_id, subject, text, opt_a, opt_b, opt_c, opt_d, correct, marks, negative, order_idx) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0.25, ?)";
    const qs: [string, string, string, string, string, string, string][] = [
      ["Legal Reasoning", "A principle states: 'Whoever causes hurt shall be liable.' X pushed Y in self-defence and Y was hurt. Is X liable?", "Yes, hurt was caused", "No, self-defence is an exception not in the principle — apply principle only", "Only if Y complains", "Cannot be determined", "a"],
      ["English", "Choose the word most similar in meaning to 'Ephemeral'.", "Permanent", "Short-lived", "Colourful", "Ancient", "b"],
      ["GK & Current Affairs", "The Preamble to the Indian Constitution was amended by which Amendment Act?", "24th", "42nd", "44th", "52nd", "b"],
      ["Quantitative", "If a shopkeeper sells at 20% profit and the cost is ₹500, the selling price is:", "₹520", "₹580", "₹600", "₹620", "c"],
      ["Logical Reasoning", "All roses are flowers. Some flowers fade quickly. Therefore:", "All roses fade quickly", "Some roses fade quickly", "No valid conclusion about roses fading", "Roses never fade", "c"],
    ];
    const qIds: string[] = [];
    for (let i = 0; i < qs.length; i++) {
      const qid = id(); const q = qs[i];
      await run(qSql, [qid, testId, q[0], q[1], q[2], q[3], q[4], q[5], q[6], i]);
      qIds.push(qid);
    }
    const aSql = `INSERT INTO test_attempts (id, test_id, user_id, score, total, correct_cnt, wrong_cnt, unattempted, answers, status, submitted_at) VALUES (?, ?, ?, ?, 5, ?, ?, ?, ?, 'submitted', ${NOW})`;
    await run(aSql, [id(), testId, studentIds[1], 4, 4, 1, 0, "{}"]);
    await run(aSql, [id(), testId, studentIds[2], 2.75, 3, 1, 1, "{}"]);
    await run(aSql, [id(), testId, rahulId, 1.75, 2, 1, 2, JSON.stringify({ [qIds[0]]: "a", [qIds[1]]: "b", [qIds[2]]: "a" })]);

    const nSql = "INSERT INTO notifications (id, user_id, type, title, body, is_read) VALUES (?, ?, ?, ?, ?, ?)";
    await run(nSql, [id(), rahulId, "doubt", "Your doubt was answered", "Anita Rao replied to your Legal Reasoning doubt.", 0]);
    await run(nSql, [id(), rahulId, "class", "Live class starting soon", "Landmark SC Judgements is live now.", 0]);
    await run(nSql, [id(), rahulId, "announcement", "Welcome to CLATians", "Explore your batch content, live classes and mock tests.", 1]);

    const lSql = "INSERT INTO leads (id, name, phone, email, interest, demo_date, message, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await run(lSql, [id(), "Ananya Verma", "+91 98765 43210", "ananya@example.com", "CLAT 2026", "", "Want to know about the fee structure.", "new", ""]);
    await run(lSql, [id(), "Karan Malhotra", "+91 91234 56780", "karan@example.com", "CLAT Crash Course", "", "Interested in a demo class this weekend.", "contacted", "Called on Mon, will decide after demo."]);
    await run(lSql, [id(), "Fatima Sheikh", "+91 99887 76655", "fatima@example.com", "CLAT 2027 Foundation", "", "", "demo", "Demo booked for Saturday 4 PM."]);

    const rSql = "INSERT INTO resources (id, type, title, body, data, status, created_by, order_idx) VALUES (?, ?, ?, ?, ?, 'published', ?, ?)";
    const seedRes = async (type: string, rows: { title: string; body: string; data: object }[]) => {
      for (let i = 0; i < rows.length; i++) await run(rSql, [id(), type, rows[i].title, rows[i].body, JSON.stringify(rows[i].data), teacherId, i]);
    };
    await seedRes("tip", [
      { title: "Master Legal Reasoning", body: "Never use personal knowledge — only the given principle matters.", data: { tag: "Legal Reasoning", icon: "⚖️", color: "#3D2411", points: ["Re-read the principle before the facts.", "Apply only what the principle says.", "Watch keywords: shall, must, except.", "Eliminate options that add extra conditions."] } },
      { title: "Finish all 5 RC passages in 45 min", body: "Reading Comprehension tests inference, not reading speed.", data: { tag: "English", icon: "📖", color: "#0891B2", points: ["Read the questions before the passage.", "Inference answers are never too extreme.", "Spend max 8 minutes per passage.", "Skip and return if stuck."] } },
      { title: "Current Affairs — 30 minutes daily", body: "A consistent daily routine is all you need for GK.", data: { tag: "GK & CA", icon: "📰", color: "var(--purple)", points: ["Read one editorial daily.", "Focus: Courts, Parliament, Economy.", "Make weekly flashcards of 20 items.", "Revise last month every Sunday."] } },
      { title: "Score 8+ in Quant with minimum effort", body: "Only 10 questions — be smart about which you attempt.", data: { tag: "Quantitative", icon: "🔢", color: "var(--green)", points: ["Master Ratio, %, Averages, P&L.", "Skip anything over 90 seconds.", "Target 8/10, not perfection."] } },
    ]);
    await seedRes("story", [
      { title: "Shreya Agarwal", body: "The mock tests were exactly like the real exam.", data: { college: "NLU Delhi", rank: "AIR 3", initials: "SA", color: "var(--blue)" } },
      { title: "Varun Nair", body: "CLATians faculty made legal reasoning finally click.", data: { college: "NLU Bangalore", rank: "AIR 7", initials: "VN", color: "var(--error-text)" } },
      { title: "Priya Singh", body: "Daily practice and honest analysis got me my rank.", data: { college: "NALSAR", rank: "AIR 12", initials: "PS", color: "var(--purple)" } },
    ]);
    await seedRes("update", [
      { title: "CLAT 2026 Mock Test #8 is live", body: "A new full-length mock based on the latest CLAT pattern.", data: { tag: "New Test", icon: "📝", color: "var(--error-text)", dateLabel: "This week", more: "Open the Daily Mock Test card on Home to attempt it and see your rank.", hot: 1 } },
      { title: "NLU Spotlight — weekly live sessions", body: "NLU students share their prep experience, live.", data: { tag: "Live Event", icon: "🎓", color: "#0891B2", dateLabel: "This week", more: "Sessions appear in your Live Classes timetable with a reminder.", hot: 0 } },
      { title: "New legal-vocabulary flashcards added", body: "Fresh words with meanings and examples.", data: { tag: "Feature", icon: "💡", color: "#DB2777", dateLabel: "This week", more: "Try them under CLAT Tools → Vocabulary.", hot: 0 } },
    ]);
    await seedRes("vocab", VOCAB.map((v) => ({ title: v.word, body: v.meaning, data: { example: v.example } })));
    await seedRes("caq", CA_QUIZ.map((q) => ({ title: q.q, body: "", data: { options: q.options, correct: q.correct, explain: q.explain } })));
    await seedRes("nlu", NLUS.map((n) => ({ title: n.name, body: "", data: { city: n.city, ...n.closing } })));
  }
}
