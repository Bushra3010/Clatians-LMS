"server-only";

import { db, newId } from "./db";
import { auth } from "./auth";
import { revalidatePath } from "next/cache";

export type Subject = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
};

export type ModuleRow = {
  id: string;
  course_id: string;
  subject_id: string | null;
  title: string;
  description: string;
  sort_order: number;
};

export type ChapterRow = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  sort_order: number;
};

export type LessonRow = {
  id: string;
  chapter_id: string;
  title: string;
  type: string;
  body: string;
  video_url: string;
  duration_min: number;
  is_free: number;
  sort_order: number;
};

export type LessonProgress = {
  lesson_id: string;
  completed: number;
  watch_seconds: number;
  last_position_sec: number;
  completed_at: string | null;
};

export type BatchRow = {
  id: string;
  name: string;
  slug: string;
  course_id: string | null;
  category: string;
  exam: string;
  batch_code: string;
  start_date: string;
  end_date: string;
  duration: string;
  schedule: string;
  mode: string;
  seats: number;
  filled: number;
  fee: number;
  original_fee: number;
  emi: string;
  offer: string;
  color: string;
  bg: string;
  status: string;
  language: string;
  batch_type: string;
  chips: string[];
  faculty: string[];
  highlights: string[];
  syllabus: string[];
  description: string;
  details: Record<string, unknown>;
};

export type FacultyRow = {
  id: string;
  name: string;
  designation: string;
  subject: string;
  specialization: string;
  rating: number;
  students_count: string;
  experience: string;
  avatar: string;
  photo: string;
  color: string;
  bg: string;
  tags: string[];
  bio: string;
  education: string[];
  achievements: string[];
  courses: string[];
  expertise: { area: string; level: number }[];
};

// ── SUBJECTS ────────────────────────────────────────────────────
export async function listSubjects() {
  const user = await auth();
  if (!user) return [];
  return await db.prepare("SELECT * FROM subjects ORDER BY sort_order").all() as Subject[];
}

export async function createSubject(data: { name: string; slug: string; description: string; icon: string; color: string }) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const id = newId();
  await db.prepare("INSERT INTO subjects (id, name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?, ?)").run(id, data.name, data.slug, data.description, data.icon, data.color);
  revalidatePath("/admin");
  return id;
}

export async function updateSubject(id: string, data: Partial<{ name: string; description: string; icon: string; color: string; sort_order: number }>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) { sets.push(`${k} = ?`); args.push(v as string | number); }
  }
  if (!sets.length) return;
  args.push(id);
  await db.prepare(`UPDATE subjects SET ${sets.join(", ")} WHERE id = ?`).run(...args);
  revalidatePath("/admin");
}

export async function deleteSubject(id: string) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await db.prepare("DELETE FROM subjects WHERE id = ?").run(id);
  revalidatePath("/admin");
}

// ── COURSES ─────────────────────────────────────────────────────
export async function listAdminCourses() {
  const user = await auth();
  if (!user || user.role !== "admin") return [];
  return await db.prepare("SELECT c.*, cc.label as category_label FROM courses c LEFT JOIN course_categories cc ON cc.key = c.category ORDER BY c.created_at DESC").all() as (Record<string, unknown> & { category_label?: string })[];
}

export async function createCourse(data: { name: string; description: string; price: number; category: string }) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const id = newId();
  await db.prepare("INSERT INTO courses (id, name, description, price, category) VALUES (?, ?, ?, ?, ?)").run(id, data.name, data.description, data.price, data.category);
  revalidatePath("/admin");
  revalidatePath("/courses");
  return id;
}

export async function updateCourse(id: string, data: Partial<{ name: string; description: string; price: number; category: string; status: string }>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) { sets.push(`${k} = ?`); args.push(v as string | number); }
  }
  if (!sets.length) return;
  args.push(id);
  await db.prepare(`UPDATE courses SET ${sets.join(", ")} WHERE id = ?`).run(...args);
  revalidatePath("/admin");
  revalidatePath("/courses");
}

export async function deleteCourse(id: string) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await db.prepare("DELETE FROM courses WHERE id = ?").run(id);
  revalidatePath("/admin");
  revalidatePath("/courses");
}

// ── MODULES ─────────────────────────────────────────────────────
export async function listModules(courseId: string) {
  const user = await auth();
  if (!user) return [];
  return await db.prepare("SELECT m.*, s.name as subject_name FROM modules m LEFT JOIN subjects s ON s.id = m.subject_id WHERE m.course_id = ? ORDER BY m.sort_order").all(courseId) as (ModuleRow & { subject_name?: string })[];
}

export async function createModule(data: { course_id: string; subject_id?: string; title: string; description: string }) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const id = newId();
  const max = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM modules WHERE course_id = ?").get(data.course_id) as { m: number };
  await db.prepare("INSERT INTO modules (id, course_id, subject_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)").run(id, data.course_id, data.subject_id || null, data.title, data.description, max.m + 1);
  revalidatePath("/admin");
  return id;
}

export async function updateModule(id: string, data: Partial<{ title: string; description: string; subject_id: string | null }>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) { sets.push(`${k} = ?`); args.push(v as string | number | null); }
  }
  if (!sets.length) return;
  args.push(id);
  await db.prepare(`UPDATE modules SET ${sets.join(", ")} WHERE id = ?`).run(...args);
  revalidatePath("/admin");
}

export async function deleteModule(id: string) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await db.prepare("DELETE FROM modules WHERE id = ?").run(id);
  revalidatePath("/admin");
}

// ── CHAPTERS ────────────────────────────────────────────────────
export async function listChapters(moduleId: string) {
  const user = await auth();
  if (!user) return [];
  return await db.prepare("SELECT * FROM chapters WHERE module_id = ? ORDER BY sort_order").all(moduleId) as ChapterRow[];
}

export async function createChapter(data: { module_id: string; title: string; description: string }) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const id = newId();
  const max = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM chapters WHERE module_id = ?").get(data.module_id) as { m: number };
  await db.prepare("INSERT INTO chapters (id, module_id, title, description, sort_order) VALUES (?, ?, ?, ?, ?)").run(id, data.module_id, data.title, data.description, max.m + 1);
  revalidatePath("/admin");
  return id;
}

export async function updateChapter(id: string, data: Partial<{ title: string; description: string }>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) { sets.push(`${k} = ?`); args.push(v as string); }
  }
  if (!sets.length) return;
  args.push(id);
  await db.prepare(`UPDATE chapters SET ${sets.join(", ")} WHERE id = ?`).run(...args);
  revalidatePath("/admin");
}

export async function deleteChapter(id: string) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await db.prepare("DELETE FROM chapters WHERE id = ?").run(id);
  revalidatePath("/admin");
}

// ── LESSONS ─────────────────────────────────────────────────────
export async function listLessons(chapterId: string) {
  const user = await auth();
  if (!user) return [];
  return await db.prepare("SELECT * FROM lessons WHERE chapter_id = ? ORDER BY sort_order").all(chapterId) as LessonRow[];
}

export async function createLesson(data: { chapter_id: string; title: string; type: string; body: string; video_url: string; duration_min: number; is_free: number }) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const id = newId();
  const max = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM lessons WHERE chapter_id = ?").get(data.chapter_id) as { m: number };
  await db.prepare("INSERT INTO lessons (id, chapter_id, title, type, body, video_url, duration_min, is_free, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, data.chapter_id, data.title, data.type, data.body, data.video_url, data.duration_min, data.is_free, max.m + 1);
  revalidatePath("/admin");
  return id;
}

export async function updateLesson(id: string, data: Partial<{ title: string; type: string; body: string; video_url: string; duration_min: number; is_free: number }>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) { sets.push(`${k} = ?`); args.push(v as string | number); }
  }
  if (!sets.length) return;
  args.push(id);
  await db.prepare(`UPDATE lessons SET ${sets.join(", ")} WHERE id = ?`).run(...args);
  revalidatePath("/admin");
}

export async function deleteLesson(id: string) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await db.prepare("DELETE FROM lessons WHERE id = ?").run(id);
  revalidatePath("/admin");
}

// ── LESSON PROGRESS ─────────────────────────────────────────────
export async function getLessonProgress(lessonId: string) {
  const user = await auth();
  if (!user) return null;
  return await db.prepare("SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?").get(user.id, lessonId) as LessonProgress | undefined;
}

export async function updateLessonProgress(lessonId: string, data: { watch_seconds?: number; last_position_sec?: number; completed?: number }) {
  const user = await auth();
  if (!user) return;
  const existing = await db.prepare("SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?").get(user.id, lessonId) as LessonProgress | undefined;
  if (existing) {
    const sets: string[] = [];
    const args: unknown[] = [];
    if (data.watch_seconds !== undefined) { sets.push("watch_seconds = ?"); args.push(data.watch_seconds); }
    if (data.last_position_sec !== undefined) { sets.push("last_position_sec = ?"); args.push(data.last_position_sec); }
    if (data.completed !== undefined) {
      sets.push("completed = ?"); args.push(data.completed);
      // Stamp the completion time in the same UTC shape the rest of the schema uses.
      if (data.completed) sets.push("completed_at = to_char((now() at time zone 'utc'), 'YYYY-MM-DD HH24:MI:SS')");
    }
    if (sets.length) { args.push(user.id, lessonId); await db.prepare(`UPDATE lesson_progress SET ${sets.join(", ")} WHERE user_id = ? AND lesson_id = ?`).run(...args); }
  } else {
    await db.prepare("INSERT INTO lesson_progress (user_id, lesson_id, watch_seconds, last_position_sec, completed) VALUES (?, ?, ?, ?, ?)").run(user.id, lessonId, data.watch_seconds || 0, data.last_position_sec || 0, data.completed || 0);
  }
}

// ── BATCHES ─────────────────────────────────────────────────────
export async function listBatches() {
  const user = await auth();
  if (!user) return [];
  return await db.prepare("SELECT * FROM batches ORDER BY created_at DESC").all() as BatchRow[];
}

export async function listBatchesByCourse(courseId: string) {
  const user = await auth();
  if (!user) return [];
  return await db.prepare("SELECT * FROM batches WHERE course_id = ? ORDER BY created_at DESC").all(courseId) as BatchRow[];
}

export async function getBatch(slug: string) {
  const user = await auth();
  if (!user) return null;
  return await db.prepare("SELECT * FROM batches WHERE slug = ?").get(slug) as BatchRow | undefined;
}

export async function createBatch(data: Record<string, unknown>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const id = newId();
  const cols = Object.keys(data).filter(k => k !== "id").join(", ");
  const placeholders = Object.keys(data).filter(k => k !== "id").map(() => "?").join(", ");
  const values = Object.values(data).filter((_, i, arr) => Object.keys(data)[i] !== "id");
  await db.prepare(`INSERT INTO batches (id, ${cols}) VALUES (?, ${placeholders})`).run(id, ...values);
  revalidatePath("/admin");
  return id;
}

export async function updateBatch(id: string, data: Record<string, unknown>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    sets.push(`${k} = ?`); args.push(v);
  }
  args.push(id);
  await db.prepare(`UPDATE batches SET ${sets.join(", ")} WHERE id = ?`).run(...args);
  revalidatePath("/admin");
}

export async function deleteBatch(id: string) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await db.prepare("DELETE FROM batches WHERE id = ?").run(id);
  revalidatePath("/admin");
}

// ── BATCH ENROLLMENT ────────────────────────────────────────────
export async function enrollInBatch(batchId: string) {
  const user = await auth();
  if (!user) throw new Error("Unauthorized");
  const existing = await db.prepare("SELECT id FROM batch_enrollments WHERE batch_id = ? AND user_id = ?").get(batchId, user.id);
  if (existing) return { ok: true as const, enrolled: true };
  const id = newId();
  const batch = await db.prepare("SELECT fee FROM batches WHERE id = ?").get(batchId) as { fee: number } | undefined;
  await db.prepare("INSERT INTO batch_enrollments (id, batch_id, user_id, amount, status) VALUES (?, ?, ?, ?, 'active')").run(id, batchId, user.id, batch?.fee || 0);
  revalidatePath("/");
  return { ok: true as const, enrolled: true };
}

export async function listMyBatches() {
  const user = await auth();
  if (!user) return [];
  const rows = await db.prepare("SELECT b.* FROM batches b JOIN batch_enrollments be ON be.batch_id = b.id WHERE be.user_id = ? ORDER BY b.created_at DESC").all(user.id) as BatchRow[];
  return rows;
}

// ── FACULTY ─────────────────────────────────────────────────────
export async function listFaculty() {
  return await db.prepare("SELECT * FROM faculty ORDER BY sort_order, name").all() as FacultyRow[];
}

export async function getFaculty(id: string) {
  return await db.prepare("SELECT * FROM faculty WHERE id = ?").get(id) as FacultyRow | undefined;
}

export async function createFaculty(data: Partial<FacultyRow>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const id = newId();
  const { name, designation, subject, specialization, experience, avatar, color, bio } = data;
  await db.prepare("INSERT INTO faculty (id, name, designation, subject, specialization, experience, avatar, color, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, name || "", designation || "", subject || "", specialization || "", experience || "", avatar || "", color || "var(--blue-dark)", bio || "");
  revalidatePath("/admin");
  return id;
}

export async function updateFaculty(id: string, data: Partial<FacultyRow>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (k === "id" || v === undefined) continue;
    sets.push(`${k} = ?`); args.push(v);
  }
  if (sets.length) { args.push(id); await db.prepare(`UPDATE faculty SET ${sets.join(", ")} WHERE id = ?`).run(...args); }
  revalidatePath("/admin");
}

export async function deleteFaculty(id: string) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await db.prepare("DELETE FROM faculty WHERE id = ?").run(id);
  revalidatePath("/admin");
}

// ── MENTORSHIP ──────────────────────────────────────────────────
export async function listMentorshipPrograms() {
  const user = await auth();
  if (!user) return [];
  return await db.prepare("SELECT * FROM mentorship_programs WHERE status = 'active' ORDER BY sort_order").all() as Record<string, unknown>[];
}

export async function listAdminMentorship() {
  const user = await auth();
  if (!user || user.role !== "admin") return [];
  return await db.prepare("SELECT * FROM mentorship_programs ORDER BY sort_order").all() as Record<string, unknown>[];
}

export async function createMentorshipProgram(data: Record<string, unknown>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const id = newId();
  const cols = Object.keys(data).filter(k => k !== "id").join(", ");
  const placeholders = Object.keys(data).filter(k => k !== "id").map(() => "?").join(", ");
  const values = Object.values(data).filter((_, i, arr) => Object.keys(data)[i] !== "id");
  await db.prepare(`INSERT INTO mentorship_programs (id, ${cols}) VALUES (?, ${placeholders})`).run(id, ...values);
  revalidatePath("/admin");
  return id;
}

export async function updateMentorshipProgram(id: string, data: Record<string, unknown>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(data)) { sets.push(`${k} = ?`); args.push(v); }
  args.push(id);
  await db.prepare(`UPDATE mentorship_programs SET ${sets.join(", ")} WHERE id = ?`).run(...args);
  revalidatePath("/admin");
}

export async function deleteMentorshipProgram(id: string) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await db.prepare("DELETE FROM mentorship_programs WHERE id = ?").run(id);
  revalidatePath("/admin");
}

// ── BLOGS ───────────────────────────────────────────────────────
export async function listPublishedBlogs() {
  return await db.prepare("SELECT * FROM blog_posts WHERE status = 'published' ORDER BY sort_order, created_at DESC").all() as Record<string, unknown>[];
}

export async function listAdminBlogs() {
  const user = await auth();
  if (!user || user.role !== "admin") return [];
  return await db.prepare("SELECT * FROM blog_posts ORDER BY sort_order, created_at DESC").all() as Record<string, unknown>[];
}

export async function createBlogPost(data: Record<string, unknown>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const id = newId();
  const cols = Object.keys(data).filter(k => k !== "id").join(", ");
  const placeholders = Object.keys(data).filter(k => k !== "id").map(() => "?").join(", ");
  const values = Object.values(data).filter((_, i, arr) => Object.keys(data)[i] !== "id");
  await db.prepare(`INSERT INTO blog_posts (id, ${cols}) VALUES (?, ${placeholders})`).run(id, ...values);
  revalidatePath("/admin");
  return id;
}

export async function updateBlogPost(id: string, data: Record<string, unknown>) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(data)) { sets.push(`${k} = ?`); args.push(v); }
  args.push(id);
  await db.prepare(`UPDATE blog_posts SET ${sets.join(", ")} WHERE id = ?`).run(...args);
  revalidatePath("/admin");
}

export async function deleteBlogPost(id: string) {
  const user = await auth();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
  await db.prepare("DELETE FROM blog_posts WHERE id = ?").run(id);
  revalidatePath("/admin");
}

// ── COLLEGE PREDICTOR ───────────────────────────────────────────
export async function listColleges() {
  return await db.prepare("SELECT * FROM college_predictor ORDER BY ranking ASC").all() as Record<string, unknown>[];
}

export async function seedColleges() {
  const colleges = [
    { name: "NLSIU Bangalore", short_name: "NLSIU", city: "Bangalore", ranking: 1, clat_cutoff_general: 50, clat_cutoff_obc: 120, clat_cutoff_sc: 250, clat_cutoff_st: 300, type: "NLU", established: 1987, color: "var(--blue-dark)" },
    { name: "NALSAR Hyderabad", short_name: "NALSAR", city: "Hyderabad", ranking: 2, clat_cutoff_general: 200, clat_cutoff_obc: 400, clat_cutoff_sc: 800, clat_cutoff_st: 600, type: "NLU", established: 1998, color: "var(--error-text)" },
    { name: "WBNUJS Kolkata", short_name: "WBNUJS", city: "Kolkata", ranking: 3, clat_cutoff_general: 350, clat_cutoff_obc: 600, clat_cutoff_sc: 1000, clat_cutoff_st: 800, type: "NLU", established: 2006, color: "var(--green)" },
    { name: "NLU Jodhpur", short_name: "NLUJ", city: "Jodhpur", ranking: 4, clat_cutoff_general: 500, clat_cutoff_obc: 900, clat_cutoff_sc: 1500, clat_cutoff_st: 1200, type: "NLU", established: 2001, color: "var(--purple)" },
    { name: "NLU Delhi", short_name: "AILET", city: "Delhi", ranking: 5, ailet_cutoff_general: 45, ailet_cutoff_obc: 100, type: "NLU", established: 2008, color: "var(--warning-text)" },
    { name: "GNLU Gandhinagar", short_name: "GNLU", city: "Gandhinagar", ranking: 6, clat_cutoff_general: 800, clat_cutoff_obc: 1500, type: "NLU", established: 2003, color: "#0891B2" },
    { name: "NLIU Bhopal", short_name: "NLIU", city: "Bhopal", ranking: 7, clat_cutoff_general: 900, clat_cutoff_obc: 1800, type: "NLU", established: 1997, color: "#BE185D" },
    { name: "RMLNLU Lucknow", short_name: "RMLNLU", city: "Lucknow", ranking: 8, clat_cutoff_general: 1200, clat_cutoff_obc: 2200, type: "NLU", established: 2005, color: "#065f46" },
  ];
  for (const c of colleges) {
    await db.prepare("INSERT INTO college_predictor (id, name, short_name, city, ranking, clat_cutoff_general, clat_cutoff_obc, clat_cutoff_sc, clat_cutoff_st, ailet_cutoff_general, ailet_cutoff_obc, type, established, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (name) DO UPDATE SET ranking = EXCLUDED.ranking").run(newId(), c.name, c.short_name, c.city, c.ranking, c.clat_cutoff_general || 99999, c.clat_cutoff_obc || 99999, c.clat_cutoff_sc || 99999, c.clat_cutoff_st || 99999, c.ailet_cutoff_general || 99999, c.ailet_cutoff_obc || 99999, c.type, c.established, c.color);
  }
}

// ── COURSE CATEGORIES ───────────────────────────────────────────
export async function listCourseCategories() {
  return await db.prepare("SELECT * FROM course_categories ORDER BY sort_order").all() as Record<string, unknown>[];
}
