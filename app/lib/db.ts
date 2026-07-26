import "server-only";
import Database from "better-sqlite3";
import { scryptSync, randomBytes } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { VOCAB, CA_QUIZ, NLUS } from "./clat-data";

// ────────────────────────────────────────────────────────────
// Connection (singleton — survives HMR in dev)
// ────────────────────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "lms.db");

declare global {
  // eslint-disable-next-line no-var
  var __lmsDb: Database.Database | undefined;
}

function hashPasswordSync(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function createConnection(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  // Set this FIRST — Next builds open the DB from several worker processes at
  // once, and every later step (incl. switching to WAL) must wait for locks
  // rather than failing fast with SQLITE_BUSY.
  // busy_timeout FIRST so every later step waits for locks. We deliberately do
  // NOT switch to WAL: concurrently switching journal mode on a fresh file from
  // Next's ~9 build workers can deadlock in a way busy_timeout can't wait out.
  db.pragma("busy_timeout = 30000");
  db.pragma("foreign_keys = ON");
  initWithRetry(db);
  return db;
}

/** Synchronous sleep — better-sqlite3 is sync, so we can't await. */
function sleepSync(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Next spins up ~9 build workers that all import this module and race to create
 * the schema on a fresh DB. WAL's first-init can deadlock (SQLITE_BUSY) in a way
 * busy_timeout can't wait out, so we retry: the loser simply waits until the
 * winner has finished, after which migrate is a no-op and seed is already claimed.
 */
function initWithRetry(db: Database.Database) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      migrate(db);
      seed(db);
      return;
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "SQLITE_BUSY" || code === "SQLITE_LOCKED" || code === "SQLITE_PROTOCOL") {
        sleepSync(250);
        continue;
      }
      throw e;
    }
  }
  // Final try — let a real error surface rather than looping forever.
  migrate(db);
  seed(db);
}

export const db: Database.Database = global.__lmsDb ?? createConnection();
if (process.env.NODE_ENV !== "production") global.__lmsDb = db;

// ────────────────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────────────────
function migrate(db: Database.Database) {
  // Run all CREATE TABLEs as one transaction so each build worker takes the
  // write lock once (briefly) rather than churning it per statement.
  db.transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'student',   -- student | teacher | admin
      status     TEXT NOT NULL DEFAULT 'active',    -- active  | suspended
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'active',   -- active | archived
      price       INTEGER NOT NULL DEFAULT 0,       -- ₹, 0 = free
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id         TEXT PRIMARY KEY,
      user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
      course_id  TEXT REFERENCES courses(id) ON DELETE SET NULL,
      amount     INTEGER NOT NULL DEFAULT 0,
      status     TEXT NOT NULL DEFAULT 'paid',      -- paid | pending | failed
      method     TEXT NOT NULL DEFAULT 'upi',
      invoice_no TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id  TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS content (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      type       TEXT NOT NULL,                     -- video | notes | practice | current-affairs
      body       TEXT NOT NULL DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
      author_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
      course_id  TEXT REFERENCES courses(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS live_classes (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      subject       TEXT NOT NULL DEFAULT '',
      course_id     TEXT REFERENCES courses(id) ON DELETE CASCADE,
      teacher_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
      start_at      TEXT NOT NULL,                   -- ISO datetime
      duration_min  INTEGER NOT NULL DEFAULT 60,
      join_url      TEXT NOT NULL DEFAULT '',
      status        TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | live | ended | cancelled
      recording_url TEXT NOT NULL DEFAULT '',
      notes         TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS class_attendance (
      class_id  TEXT NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
      user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      present   INTEGER NOT NULL DEFAULT 1,
      PRIMARY KEY (class_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS doubts (
      id          TEXT PRIMARY KEY,
      student_id  TEXT REFERENCES users(id) ON DELETE CASCADE,
      course_id   TEXT REFERENCES courses(id) ON DELETE SET NULL,
      subject     TEXT NOT NULL DEFAULT '',
      body        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'open',   -- open | answered
      answer      TEXT NOT NULL DEFAULT '',
      answered_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tests (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT NOT NULL DEFAULT '',
      type         TEXT NOT NULL DEFAULT 'mock',    -- mock | sectional | pyq
      course_id    TEXT REFERENCES courses(id) ON DELETE SET NULL,
      duration_min INTEGER NOT NULL DEFAULT 60,
      status       TEXT NOT NULL DEFAULT 'draft',   -- draft | published
      created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id        TEXT PRIMARY KEY,
      test_id   TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      subject   TEXT NOT NULL DEFAULT '',
      text      TEXT NOT NULL,
      opt_a     TEXT NOT NULL,
      opt_b     TEXT NOT NULL,
      opt_c     TEXT NOT NULL,
      opt_d     TEXT NOT NULL,
      correct   TEXT NOT NULL,                      -- a | b | c | d
      marks     REAL NOT NULL DEFAULT 1,
      negative  REAL NOT NULL DEFAULT 0.25,
      order_idx INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS test_attempts (
      id           TEXT PRIMARY KEY,
      test_id      TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
      user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score        REAL NOT NULL DEFAULT 0,
      total        REAL NOT NULL DEFAULT 0,
      correct_cnt  INTEGER NOT NULL DEFAULT 0,
      wrong_cnt    INTEGER NOT NULL DEFAULT 0,
      unattempted  INTEGER NOT NULL DEFAULT 0,
      answers      TEXT NOT NULL DEFAULT '{}',      -- JSON {questionId: 'a'|'b'|'c'|'d'}
      status       TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | submitted
      started_at   TEXT NOT NULL DEFAULT (datetime('now')),
      submitted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       TEXT NOT NULL DEFAULT 'info',     -- doubt | class | payment | content | announcement | info
      title      TEXT NOT NULL,
      body       TEXT NOT NULL DEFAULT '',
      is_read    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_progress (
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, content_id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      phone      TEXT NOT NULL DEFAULT '',
      email      TEXT NOT NULL DEFAULT '',
      interest   TEXT NOT NULL DEFAULT '',
      demo_date  TEXT NOT NULL DEFAULT '',
      message    TEXT NOT NULL DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'new',   -- new | contacted | demo | enrolled | lost
      notes      TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id         TEXT PRIMARY KEY,
      actor_id   TEXT,
      actor_name TEXT NOT NULL DEFAULT '',
      actor_role TEXT NOT NULL DEFAULT '',
      action     TEXT NOT NULL,
      detail     TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_items (
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind       TEXT NOT NULL,                 -- tip | vocab | content
      item_key   TEXT NOT NULL,
      title      TEXT NOT NULL DEFAULT '',
      subtitle   TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, kind, item_key)
    );

    CREATE TABLE IF NOT EXISTS resources (
      id         TEXT PRIMARY KEY,
      type       TEXT NOT NULL,                 -- tip | story | update | vocab | caq
      title      TEXT NOT NULL,
      body       TEXT NOT NULL DEFAULT '',
      data       TEXT NOT NULL DEFAULT '{}',    -- JSON for type-specific fields
      status     TEXT NOT NULL DEFAULT 'published', -- published | draft
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      order_idx  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  })();

  // Defensive: add `price` to older databases that pre-date the column.
  try {
    db.prepare("SELECT price FROM courses LIMIT 1").get();
  } catch {
    db.exec("ALTER TABLE courses ADD COLUMN price INTEGER NOT NULL DEFAULT 0");
  }
}

// ────────────────────────────────────────────────────────────
// Seed — a default admin + a little demo data so the panel is not empty
// ────────────────────────────────────────────────────────────
function seed(db: Database.Database) {
  // Seed once, atomically. The whole thing is a single transaction so it takes
  // just one short write lock (kind to Next's parallel build workers), and the
  // `meta` primary key means only one process can win the claim — everyone else
  // hits UNIQUE, the transaction rolls back cleanly, and they skip.
  const run = db.transaction(() => {
    db.prepare("INSERT INTO meta (key) VALUES ('seeded')").run();

  const id = () => randomBytes(9).toString("hex");
  const insertUser = db.prepare(
    "INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const adminId = id();
  const teacherId = id();
  insertUser.run(adminId, "Platform Admin", "admin@clatlms.in", hashPasswordSync("admin123"), "admin", "active");
  insertUser.run(teacherId, "Anita Rao", "anita@clatlms.in", hashPasswordSync("teach123"), "teacher", "active");

  const students = [
    ["Rahul Sharma", "rahul@student.in"],
    ["Priya Nair", "priya@student.in"],
    ["Imran Ali", "imran@student.in"],
    ["Sneha Gupta", "sneha@student.in"],
  ];
  const studentIds = students.map(([name, email]) => {
    const sid = id();
    insertUser.run(sid, name, email, hashPasswordSync("student123"), "student", "active");
    return sid;
  });

  const insertCourse = db.prepare(
    "INSERT INTO courses (id, name, description, status, price) VALUES (?, ?, ?, ?, ?)"
  );
  const clat2026 = id();
  const clat2027 = id();
  const clatCrash = id();
  insertCourse.run(clat2026, "CLAT 2026", "Full-length CLAT 2026 preparation batch.", "active", 18999);
  insertCourse.run(clat2027, "CLAT 2027 Foundation", "Two-year foundation programme.", "active", 12999);
  insertCourse.run(clatCrash, "CLAT Crash Course", "60-day intensive sprint before the exam.", "active", 4999);

  const enroll = db.prepare("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)");
  // Seeded students are enrolled in 2026 / 2027; nobody is in the Crash Course
  // yet, so the demo student can buy it and watch access unlock.
  studentIds.forEach((sid, i) => enroll.run(sid, i % 2 === 0 ? clat2026 : clat2027));

  // A paid invoice for Rahul's CLAT 2026 enrolment, so the admin ledger isn't empty.
  db.prepare(
    "INSERT INTO payments (id, user_id, course_id, amount, status, method, invoice_no) VALUES (?, ?, ?, ?, 'paid', 'upi', ?)"
  ).run(id(), studentIds[0], clat2026, 18999, "CLT-100001");

  const insertContent = db.prepare(
    "INSERT INTO content (id, title, type, body, status, author_id, course_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  insertContent.run(id(), "Legal Reasoning: Torts Basics", "video", "https://youtu.be/jNQXAC9IVRw", "approved", teacherId, clat2026);
  insertContent.run(id(), "Constitution — Handwritten Notes", "notes", "https://www.constituteproject.org/constitution/India_2016.pdf", "approved", teacherId, clat2026);
  insertContent.run(id(), "July Current Affairs Digest", "current-affairs", "Weekly compiled current affairs: SC judgements, Parliament bills, and economy highlights.", "approved", teacherId, clat2026);
  insertContent.run(id(), "Logical Reasoning Set 4", "practice", "25 practice questions on syllogisms and critical reasoning.", "approved", teacherId, clat2026);
  // One item left pending so the admin Content Approval queue has something to review.
  insertContent.run(id(), "English: Reading Comprehension Pack", "notes", "RC practice passages with answer keys.", "pending", teacherId, clat2026);
  // Crash Course material — visible only after a student enrols in that batch.
  insertContent.run(id(), "Crash Course: Legal Sprint", "video", "https://youtu.be/jNQXAC9IVRw", "approved", teacherId, clatCrash);
  insertContent.run(id(), "Crash Course: 40 Rapid MCQs", "practice", "40 timed questions for the final sprint.", "approved", teacherId, clatCrash);

  // ── Live classes ──────────────────────────────────────────
  const insertClass = db.prepare(
    `INSERT INTO live_classes
       (id, title, subject, course_id, teacher_id, start_at, duration_min, join_url, status, recording_url, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const iso = (offsetMinutes: number) =>
    new Date(Date.now() + offsetMinutes * 60_000).toISOString();

  // Live now, upcoming, and a finished one with a recording — all for CLAT 2026.
  // join_url / recording_url are YouTube links so students watch in-app.
  insertClass.run(id(), "Landmark SC Judgements", "Legal Reasoning", clat2026, teacherId, iso(-15), 90, "https://www.youtube.com/watch?v=jNQXAC9IVRw", "live", "", "Bring the case list PDF.");
  insertClass.run(id(), "Reading Comprehension Drills", "English & GK", clat2026, teacherId, iso(180), 60, "https://www.youtube.com/watch?v=jNQXAC9IVRw", "scheduled", "", "");
  insertClass.run(id(), "Number Systems & Averages", "Quantitative", clat2026, teacherId, iso(1440), 60, "https://www.youtube.com/watch?v=jNQXAC9IVRw", "scheduled", "", "");
  const endedClassId = id();
  insertClass.run(endedClassId, "Constitution: Preamble & Rights", "Legal Reasoning", clat2026, teacherId, iso(-2880), 75, "", "ended", "https://youtu.be/jNQXAC9IVRw", "Full recording of the session.");
  // Rahul attended the past class (others didn't → shows in low-attendance reports).
  db.prepare("INSERT INTO class_attendance (class_id, user_id) VALUES (?, ?)").run(endedClassId, studentIds[0]);

  // ── Doubts (Rahul, enrolled in CLAT 2026) ─────────────────
  const rahulId = studentIds[0];
  const insertDoubt = db.prepare(
    "INSERT INTO doubts (id, student_id, course_id, subject, body, status, answer, answered_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  insertDoubt.run(
    id(), rahulId, clat2026, "Legal Reasoning",
    "If a principle says 'no person shall be deprived of life except by procedure established by law' and the facts say police shot someone without an FIR — what's the answer?",
    "answered",
    "The action violates Article 21 — there was no procedure established by law, so it is unconstitutional. Apply only the given principle to the facts.",
    teacherId
  );
  insertDoubt.run(
    id(), rahulId, clat2026, "English",
    "How do I finish all 5 reading-comprehension passages within 45 minutes?",
    "open", "", null
  );

  // ── Test series: a published mock for CLAT 2026 ───────────
  const testId = id();
  db.prepare(
    `INSERT INTO tests (id, title, description, type, course_id, duration_min, status, created_by)
     VALUES (?, ?, ?, 'mock', ?, 30, 'published', ?)`
  ).run(testId, "CLAT 2026 — Full Mock 1", "Full-length pattern mock covering all sections.", clat2026, teacherId);

  const insertQ = db.prepare(
    `INSERT INTO questions (id, test_id, subject, text, opt_a, opt_b, opt_c, opt_d, correct, marks, negative, order_idx)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0.25, ?)`
  );
  const qs: [string, string, string, string, string, string, string][] = [
    ["Legal Reasoning", "A principle states: 'Whoever causes hurt shall be liable.' X pushed Y in self-defence and Y was hurt. Is X liable?", "Yes, hurt was caused", "No, self-defence is an exception not in the principle — apply principle only", "Only if Y complains", "Cannot be determined", "a"],
    ["English", "Choose the word most similar in meaning to 'Ephemeral'.", "Permanent", "Short-lived", "Colourful", "Ancient", "b"],
    ["GK & Current Affairs", "The Preamble to the Indian Constitution was amended by which Amendment Act?", "24th", "42nd", "44th", "52nd", "b"],
    ["Quantitative", "If a shopkeeper sells at 20% profit and the cost is ₹500, the selling price is:", "₹520", "₹580", "₹600", "₹620", "c"],
    ["Logical Reasoning", "All roses are flowers. Some flowers fade quickly. Therefore:", "All roses fade quickly", "Some roses fade quickly", "No valid conclusion about roses fading", "Roses never fade", "c"],
  ];
  const qIds = qs.map((q, i) => { const qid = id(); insertQ.run(qid, testId, q[0], q[1], q[2], q[3], q[4], q[5], q[6], i); return qid; });

  // A couple of competing submitted attempts so rank / percentile are real.
  const insertAttempt = db.prepare(
    `INSERT INTO test_attempts (id, test_id, user_id, score, total, correct_cnt, wrong_cnt, unattempted, answers, status, submitted_at)
     VALUES (?, ?, ?, ?, 5, ?, ?, ?, '{}', 'submitted', datetime('now'))`
  );
  insertAttempt.run(id(), testId, studentIds[1], 4, 4, 1, 0);   // Priya: 4/5
  insertAttempt.run(id(), testId, studentIds[2], 2.75, 3, 1, 1); // Imran: 2.75/5

  // Rahul's own attempt with real answers → drives his weak-area analytics.
  // Legal (correct), English (correct), GK (wrong), Quant & Logic skipped.
  const rahulAns = JSON.stringify({ [qIds[0]]: "a", [qIds[1]]: "b", [qIds[2]]: "a" });
  db.prepare(
    `INSERT INTO test_attempts (id, test_id, user_id, score, total, correct_cnt, wrong_cnt, unattempted, answers, status, submitted_at)
     VALUES (?, ?, ?, 1.75, 5, 2, 1, 2, ?, 'submitted', datetime('now'))`
  ).run(id(), testId, rahulId, rahulAns);

  // ── Notifications for Rahul ───────────────────────────────
  const insertNotif = db.prepare(
    "INSERT INTO notifications (id, user_id, type, title, body, is_read) VALUES (?, ?, ?, ?, ?, ?)"
  );
  insertNotif.run(id(), rahulId, "doubt", "Your doubt was answered", "Anita Rao replied to your Legal Reasoning doubt.", 0);
  insertNotif.run(id(), rahulId, "class", "Live class starting soon", "Landmark SC Judgements is live now.", 0);
  insertNotif.run(id(), rahulId, "announcement", "Welcome to CLATians", "Explore your batch content, live classes and mock tests.", 1);

  // ── Admissions leads ──────────────────────────────────────
  const insertLead = db.prepare(
    "INSERT INTO leads (id, name, phone, email, interest, demo_date, message, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  insertLead.run(id(), "Ananya Verma", "+91 98765 43210", "ananya@example.com", "CLAT 2026", "", "Want to know about the fee structure.", "new", "");
  insertLead.run(id(), "Karan Malhotra", "+91 91234 56780", "karan@example.com", "CLAT Crash Course", "", "Interested in a demo class this weekend.", "contacted", "Called on Mon, will decide after demo.");
  insertLead.run(id(), "Fatima Sheikh", "+91 99887 76655", "fatima@example.com", "CLAT 2027 Foundation", "", "", "demo", "Demo booked for Saturday 4 PM.");

  // ── Editorial resources (teacher/admin-managed, student-facing) ──
  const insertRes = db.prepare(
    "INSERT INTO resources (id, type, title, body, data, status, created_by, order_idx) VALUES (?, ?, ?, ?, ?, 'published', ?, ?)"
  );
  const seedRes = (type: string, rows: { title: string; body: string; data: object }[]) =>
    rows.forEach((r, i) => insertRes.run(id(), type, r.title, r.body, JSON.stringify(r.data), teacherId, i));

  seedRes("tip", [
    { title: "Master Legal Reasoning", body: "Never use personal knowledge — only the given principle matters.", data: { tag: "Legal Reasoning", icon: "⚖️", color: "#3D2411", points: ["Re-read the principle before the facts.", "Apply only what the principle says.", "Watch keywords: shall, must, except.", "Eliminate options that add extra conditions."] } },
    { title: "Finish all 5 RC passages in 45 min", body: "Reading Comprehension tests inference, not reading speed.", data: { tag: "English", icon: "📖", color: "#0891B2", points: ["Read the questions before the passage.", "Inference answers are never too extreme.", "Spend max 8 minutes per passage.", "Skip and return if stuck."] } },
    { title: "Current Affairs — 30 minutes daily", body: "A consistent daily routine is all you need for GK.", data: { tag: "GK & CA", icon: "📰", color: "#7C3AED", points: ["Read one editorial daily.", "Focus: Courts, Parliament, Economy.", "Make weekly flashcards of 20 items.", "Revise last month every Sunday."] } },
    { title: "Score 8+ in Quant with minimum effort", body: "Only 10 questions — be smart about which you attempt.", data: { tag: "Quantitative", icon: "🔢", color: "#059669", points: ["Master Ratio, %, Averages, P&L.", "Skip anything over 90 seconds.", "Target 8/10, not perfection."] } },
  ]);

  seedRes("story", [
    { title: "Shreya Agarwal", body: "The mock tests were exactly like the real exam.", data: { college: "NLU Delhi", rank: "AIR 3", initials: "SA", color: "#3D2411" } },
    { title: "Varun Nair", body: "CLATians faculty made legal reasoning finally click.", data: { college: "NLU Bangalore", rank: "AIR 7", initials: "VN", color: "#DC2626" } },
    { title: "Priya Singh", body: "Daily practice and honest analysis got me my rank.", data: { college: "NALSAR", rank: "AIR 12", initials: "PS", color: "#7C3AED" } },
  ]);

  seedRes("update", [
    { title: "CLAT 2026 Mock Test #8 is live", body: "A new full-length mock based on the latest CLAT pattern.", data: { tag: "New Test", icon: "📝", color: "#DC2626", dateLabel: "This week", more: "Open the Daily Mock Test card on Home to attempt it and see your rank.", hot: 1 } },
    { title: "NLU Spotlight — weekly live sessions", body: "NLU students share their prep experience, live.", data: { tag: "Live Event", icon: "🎓", color: "#0891B2", dateLabel: "This week", more: "Sessions appear in your Live Classes timetable with a reminder.", hot: 0 } },
    { title: "New legal-vocabulary flashcards added", body: "Fresh words with meanings and examples.", data: { tag: "Feature", icon: "💡", color: "#DB2777", dateLabel: "This week", more: "Try them under CLAT Tools → Vocabulary.", hot: 0 } },
  ]);

  seedRes("vocab", VOCAB.map((v) => ({ title: v.word, body: v.meaning, data: { example: v.example } })));
  seedRes("caq", CA_QUIZ.map((q) => ({ title: q.q, body: "", data: { options: q.options, correct: q.correct, explain: q.explain } })));
  seedRes("nlu", NLUS.map((n) => ({ title: n.name, body: "", data: { city: n.city, ...n.closing } })));
  });

  try {
    run();
  } catch {
    // Another worker already seeded — the transaction rolled back, nothing to do.
  }
}

// ────────────────────────────────────────────────────────────
// Helpers shared across the app
// ────────────────────────────────────────────────────────────
export function newId(): string {
  return randomBytes(9).toString("hex");
}
