# PROJECT_CONTEXT.md — CLATians LMS

> Handoff for continuing this project on another machine / new Claude session.
> Last updated: 1 Aug 2026 (uncommitted work session: doubt follow-up threads, persisted notification prefs, student AI-Tutor entry points, course-completion certificates, referral rewards (₹500 credit + checkout auto-apply), admin bulk enroll, admin global student search, parent/guardian portal, `"notes"` detail-key collision fix, removed 4 dead dummy detail pages, fixed server-actions crash from a type re-export in `ai-actions.ts`). Keep this file current.

---

## 1. Project Overview & Objective
CLATians LMS is a **CLAT (India Common Law Admission Test) coaching-institute learning platform**. Single Next.js app serving three roles from one codebase:
- **Student** — mobile-style app (`/`): courses, live classes, tests, doubts, AI tools, progress, payments.
- **Teacher** — console (`/teacher/*`): content, classes, tests, doubts, 1:1 slots, attendance.
- **Admin** — panel (`/admin/*`): users, admissions/leads, courses, payments, content approval, announcements, audit.

Objective: a production-ready, hybrid (online + offline) coaching platform with AI assistance, deployed on Vercel + Supabase.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16.2.6**, App Router, React **19.2.4**, TypeScript 5 |
| Runtime | Node **v20.18.1** |
| Styling | Tailwind CSS **v4** (admin/teacher) + heavy inline styles (student components) |
| DB | **Supabase Postgres** via `pg` (Pool) |
| AI | **Google Gemini** via `@google/genai` (model `gemini-flash-latest`) |
| Uploads | `@vercel/blob` (prod) or local `data/` dir (dev) |
| Auth | Custom — `scrypt` (node crypto), cookie session. No external auth lib. |
| Deploy | GitHub → **Vercel** (auto-deploy on push) |

**Key deps:** `next`, `react`, `pg`, `@google/genai`, `@vercel/blob`. `better-sqlite3` is a **devDependency only** (legacy from the pre-Supabase SQLite version; not used at runtime).

⚠️ **AGENTS.md rule:** "This is NOT the Next.js you know." This Next.js version has breaking changes — **read `node_modules/next/dist/docs/` before writing Next-specific code.** `CLAUDE.md` just imports `AGENTS.md`.

---

## 3. Important Folders & Files

| Path | Purpose |
|---|---|
| `app/page.tsx` | Student root — loads **all** student data server-side, passes to `StudentApp`. |
| `app/StudentApp.tsx` | Big client component — student SPA shell; `detailPage` state switches sub-pages. |
| `app/components/` | Shared UI. `detail/` = student sub-pages. `manage/` = admin/teacher managers. |
| `app/admin/(panel)/` | Admin pages (route group `(panel)` shares `AdminShell.tsx` nav + `layout.tsx`). |
| `app/teacher/(panel)/` | Teacher pages (`TeacherShell.tsx` nav). |
| `app/lib/*.ts` | Server logic: DB, auth, and per-domain `*-actions.ts` (server actions). |
| `app/lib/db.ts` | DB Pool + init + **schema (`SCHEMA`)** + demo **seed** + sqlite-style async facade. |
| `app/lib/auth.ts` | `scrypt` hashing, sessions, `requireRole`/`requireAdmin`, `Role` type. |
| `app/lib/dates.ts` | **Timezone helpers** — `parseServerDate`, `fmtIST`, `datetimeLocalToUtcISO`, `toDatetimeLocalIST`. |
| `proxy.ts` | Renamed **middleware** — optimistic cookie gate for `/admin`,`/teacher` (real checks are per-page). |
| `next.config.ts` | `serverActions.bodySizeLimit: "55mb"` (for uploads). |
| `.env.example` | Env var template (placeholders). |
| `AGENTS.md` / `CLAUDE.md` | Agent rules (Next.js caveat). |
| `blueprint.html` | Standalone interactive architecture map (reference only). |
| `scripts/backup-db.mjs` | `npm run backup` — DB backup helper. |

**Reusable primitives added this session:** `ExportCsvButton.tsx` (RFC-4180 CSV + BOM), `ListFilter.tsx` (DOM-based instant search), `AiText.tsx` (safe markdown), `BulkContentBar.tsx`.

---

## 4. Database, Auth & Roles

**Driver / facade:** `pg.Pool`. `db.prepare(sql).get()/.all()/.run()` mimics better-sqlite3 but is **async (await every call)**. `?` placeholders auto-translate to `$n` (`toPg`). `.run()` returns `{ changes }`.

**Init:** On cold start, `init()` takes a `pg_advisory_xact_lock` (pooler-safe) and runs `SCHEMA` (all `CREATE TABLE IF NOT EXISTS` + a few `ALTER ... ADD COLUMN IF NOT EXISTS`), then seeds demo data once (guarded by a `meta` row claim). Init promise cached in `global.__lmsInit`.

**Tables (28):** `users, sessions, meta, courses, enrollments, payments, content, content_progress, live_classes, class_attendance, doubts, doubt_messages, tests, questions, test_attempts, notifications, leads, audit_log, saved_items, resources, ai_threads, ai_messages, practice_sessions, booking_slots, announcements, study_tasks, notes, guardian_links`. (Columns added: `users.notify_prefs` JSON, `users.referral_credit` INT, `leads.reward_given` INT.)

**Roles:** `student | teacher | admin | parent` — parent lands on `/parent` (login redirect + root redirect + proxy matcher all cover it).

**Auth:** Password = `scrypt` hash (`salt:hash`). Session token row in `sessions`, cookie `lms_session` (httpOnly, 7-day). `requireRole(["..."])` / `requireAdmin()` guard server components/actions. Roles: **`student` | `teacher` | `admin`**.

**Demo seed logins** (created on first DB init — demo data, safe to share):

| Role | Email | Password |
|---|---|---|
| Admin | admin@clatlms.in | admin123 |
| Teacher | anita@clatlms.in | teach123 |
| Students | rahul@student.in, priya@student.in, imran@student.in, sneha@student.in | student123 |

---

## 5. Features — Completed

**Student:** courses (browse → detail+syllabus → checkout+GST → invoice → gated content unlock; enrolled course detail shows a **"Start learning"** panel that jumps straight into each content section; non-enrolled shows a locked syllabus), **in-app content viewer** (`ContentListPage` — tap any item: YouTube plays embedded, PDFs/uploads open in an embedded frame + open-in-tab fallback, plain-text notes/practice/CA render in a full reader; mark-done inside the viewer), live classes (join→attendance, watch recordings), test series (take → result/rank → **Explain-with-AI**), doubts (+ **follow-up threads**: chat-style back-and-forth on every doubt), notifications, saved content, **AI Tutor** chat (entry points: TopBar, Home banner, profile menu), **AI Practice** (instant quiz, counts to streak), **AI Study Coach**, progress + **printable report**, **Study Planner**, **Notes** (notebook), **Payments & Invoices** (printable), **1:1 slot booking**, **Refer-a-Friend**, self-service **change password**, **notification preferences (persisted per-user)**, **course-completion certificates** (printable, unlocked at 100% content completion; deterministic cert number, no DB storage), CLAT tools (predictor/CA quiz/**AI vocab**).

**Teacher:** content submit + **AI current-affairs digest**, classes (schedule/recurring/edit-reschedule, recordings, roster, **manual attendance**), tests (create/edit, add + **AI-generate** MCQs, delete question, **item analytics**: per-question + per-section + results CSV export), doubts (+ **AI draft reply** + **follow-up threads**: student follow-up reopens the doubt, teacher reply re-answers, both notified), **1:1 slots**, attendance (per-student **drill-down** + CSV), workload dashboard.

**Admin:** users (CRUD + role edit + **password reset** + **create/link parent accounts**), leads/admissions (pipeline + notes + **convert-to-student** + referral source + search + CSV), courses (full CRUD + enroll/unenroll + **bulk enroll** + roster), classes, **1:1 slots** oversight, attendance (CSV), progress, leaderboard, tests, **content approval** (full preview + **bulk approve/reject** + search + CSV), announcements (+ persistent history), payments (**record offline fee** + revenue-by-batch + CSV), audit log, revenue+funnel dashboard, **global student search** (sidebar box → `/admin/search`: per-student attendance/tests/fees/credit summary).

**Parent portal** (`/parent`, role `parent`): read-only per-child dashboard — attendance (red <75%), study-material %, mock tests (avg/best), open doubts, fees paid + last invoice, next class. Parents created/linked from Admin → Users (one parent can follow several children via `guardian_links`).

**Cross-cutting:** notifications on all key events; IST timezone everywhere; cross-browser date parsing; reusable CSV export + search primitives.

---

## 6. Features — Partially Complete / Placeholder

| Item | State |
|---|---|
| File uploads | Works only if `BLOB_READ_WRITE_TOKEN` set; else writes to local `data/` (won't persist on Vercel serverless). **Needs a Vercel Blob store.** |
| Settings notification toggles (push/email/SMS) | **Persisted** now (`users.notify_prefs` JSON + `updateNotifyPrefsAction`); delivery provider still not wired (in-app only). |
| Notifications channel | In-app only. Email/SMS/WhatsApp would fan out from existing `notify()` calls once a provider is added. |
| Payments | **Simulated** (test-mode) gateway; no real payment provider. Offline recording is real. |
| Referral rewards | **DONE** — ₹500 credit per enrolled referral (`REFERRAL_REWARD` in `referral.ts`, awarded once per lead via `leads.reward_given` + `awardReferralIfDue` in `referral-server.ts`); credit auto-applies as a discount in `payForCourseAction`; shown on student ReferPage + admin search. |

---

## 7. Features — Not Started (candidates)
Dark mode; real payment gateway; email/SMS provider. *(Done since this list was written: doubt follow-up threads, certificates, referral rewards, bulk enroll, global student search, parent portal.)*

---

## 8. Bugs, Errors & Known Limitations

| Item | Detail |
|---|---|
| **AI free-tier quota** | Gemini free tier ≈ **20 generations/day per model**. On exhaustion, actions return a friendly "Daily AI limit reached" message. Fix = enable billing on the Google AI project, or wait for daily reset. Not a code bug. |
| **Uploads don't persist** | Without `BLOB_READ_WRITE_TOKEN`, uploads save to local disk and are lost on serverless redeploy. |
| **Dev schema cache** | Dev server caches DB init in `global.__lmsInit`. Adding a **table/column** does NOT auto-apply on hot reload — must create it directly in the DB (see §16) or fully restart. Fresh Vercel cold start does run `SCHEMA`. |
| **Exposed secrets** | Supabase DB password, Gemini key, and a Vercel token were pasted in an earlier chat → **treat as compromised; rotate.** |
| `LiveClassesPage` "Today/Tomorrow" label | Computed in browser-local time; correct on IST devices, may be off on a device set to another timezone. Minor. **Needs verification** if targeting non-IST users. |
| Git identity mismatch | `git config user` = `clatianscrm-lang`; remote owner = `Bushra3010`. **Needs verification** that pushes go to the intended account/repo. |

No known compile/type errors — `tsc --noEmit` passes clean as of last commit.

---

## 9. Key Technical & Design Decisions

- **One app, three roles** via route groups + role guards; student UI is a client SPA driven by `detailPage` state.
- **SQLite-compatible async DB facade** over `pg` — lets code read like better-sqlite3; **always `await`**.
- **Schema-as-code**: `SCHEMA` string in `db.ts` with idempotent `CREATE/ALTER IF NOT EXISTS`; runs on cold start.
- **Timezone = IST (`Asia/Kolkata`)**. Two timestamp shapes: (a) `created_at` etc. stored `"YYYY-MM-DD HH:MM:SS"` **UTC** (space, no T/Z) — parse with `parseServerDate`; (b) class/slot `start_at` stored full-ISO UTC, where a `datetime-local` input is interpreted as IST (`+05:30`) via `datetimeLocalToUtcISO`. **Always format with `fmtIST`.** Do not use bare `new Date(iso)` on server timestamps (Safari fails; wrong TZ on Chrome).
- **Server Actions** for all mutations; forms use `action={serverAction}` or client components call actions directly (return values for optimistic UI).
- **Notifications** via `notify(userId,type,title,body)` / `notifyMany(...)`; types: `doubt|class|payment|content|announcement|info`.
- **Referral code** = first 6 hex of user id, uppercased (deterministic; no stored code).
- **AI graceful degradation** — `aiConfigured()` gates AI; errors mapped to friendly text (`friendlyAiError`).

---

## 10. APIs, Integrations, External Services

| Service | Use | Notes |
|---|---|---|
| Supabase Postgres | Primary DB | Use **pooler** URL (port 6543) for serverless. |
| Google Gemini (`@google/genai`) | All AI | `gemini-flash-latest`, structured JSON output for MCQs/digests/vocab. |
| Vercel Blob | File storage | Optional; token auto-added when a Blob store exists. |
| Vercel | Hosting/CI | Project `clatians-lms`; auto-deploy on push to `main`. |
| GitHub | Repo | `github.com/Bushra3010/Clatians-LMS` (**verify owner**). |
| Netlify | `netlify.toml` present | **Needs verification** — Vercel is the active target per this project's history. |

---

## 11. Environment Variables (names only — placeholders)

See `.env.example`. Required/optional:

| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes** | Supabase Postgres pooler connection string. Fallbacks: `POSTGRES_URL`, `SUPABASE_DB_URL`. |
| `GEMINI_API_KEY` | Optional | Gemini AI. Fallback: `GOOGLE_API_KEY`. Without it AI shows "off". |
| `BLOB_READ_WRITE_TOKEN` | Optional | Vercel Blob (upload persistence). |

Never commit real values. `.env*` is gitignored.

---

## 12. Local Setup (new laptop)

```bash
git clone https://github.com/Bushra3010/Clatians-LMS.git
cd Clatians-LMS   # (repo folder; local dir may be named clatinslms-main)
npm install
cp .env.example .env.local     # then fill DATABASE_URL (and GEMINI_API_KEY if using AI)
npm run dev                    # http://localhost:3000
```
First run auto-creates tables + seeds demo data in the target DB. Log in with a demo account (§4). Node 20+ required.

---

## 13. Build / Test / Deploy Commands

| Command | Does |
|---|---|
| `npm run dev` | Local dev (Turbopack) at :3000 |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit -p tsconfig.json` | **Typecheck (use as the primary verification gate)** |
| `npm run backup` | DB backup (`scripts/backup-db.mjs`) |
| Deploy | `git push origin main` → Vercel auto-deploys. No manual step. |

There is **no automated test suite** — verification = `tsc --noEmit` + compiling the route (`curl` a page) + manual UI check.

---

## 14. What To Build Next (priority order)

1. **[Ops, not code] Rotate exposed secrets** (Supabase pw, Gemini key, Vercel token); update `.env.local` + Vercel env; redeploy.
2. **[Ops] Enable Gemini billing** (or accept 20/day) so AI features are demoable.
3. **Vercel Blob store** so teacher uploads persist (create store → `BLOB_READ_WRITE_TOKEN` auto-set → redeploy).
4. ~~Doubt follow-up threads~~ ✅ DONE (`doubt_messages` + `postDoubtMessageAction`; student & teacher UIs).
5. ~~Course-completion certificate~~ ✅ DONE (`CertificatePage.tsx`; eligibility computed in `page.tsx`, print-window pattern).
6. ~~Persist Settings notification prefs~~ ✅ DONE (delivery provider still pending — email/SMS).
7. Dark mode; real payment gateway. *(Confirm need first.)*

---

## 15. Step-by-Step Guidance & Likely Files (next features)

**Doubt threads:** add `doubt_messages` table (`id, doubt_id, sender_id, body, created_at`) → migrate DB (§16) → extend `doubt-actions.ts` (post message; keep `answerDoubtAction` or wrap it) → update teacher `doubts/page.tsx` + `DoubtAnswerForm.tsx` and student `DoubtsScreen.tsx` to render a thread → notify the other party. Files: `db.ts`, `doubt-actions.ts`, `app/teacher/(panel)/doubts/*`, `app/components/DoubtsScreen.tsx`, `app/page.tsx` (load thread).

**Certificate:** compute eligibility (e.g., course content 100% done) in `app/page.tsx`; add a client page like `MyPaymentsPage.printInvoice` (new print-window). Files: `app/page.tsx`, new `components/detail/CertificatePage.tsx`, `StudentApp.tsx` + `ProfileScreen.tsx` (menu entry). No DB change.

**Persist notification prefs:** add `notification_prefs` columns/table → action to save → read into `SettingsPage`. Files: `db.ts`, new `*-actions.ts`, `SettingsPage.tsx`, `app/page.tsx`.

**General pattern for a new student sub-page:** create `components/detail/XPage.tsx` → add key to `DetailPage` union + render + nav case in `StudentApp.tsx` → add `ProfileMenuKey` + menu item in `ProfileScreen.tsx` → load data in `app/page.tsx` and pass as a prop.

---

## 16. Warnings — Don't Break These

- **`await` every DB call** — the facade is async.
- **Format all timestamps with `fmtIST`**; never `new Date(serverTimestamp)` directly. For `datetime-local` storage use `datetimeLocalToUtcISO`, and `toDatetimeLocalIST` to prefill edit forms.
- **Adding a table/column:** put it in `SCHEMA` in `db.ts` **and** apply it to the live DB directly (dev caches init). Pattern used this session: run a one-off `node` script with `pg` against `DATABASE_URL` doing `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Verify with `to_regclass`/`information_schema`.
- **Server-only leakage:** `ai.ts` imports `server-only`. Import AI **actions** from `ai-actions.ts` into clients — never `ai.ts` directly (**exception:** `import type` from `ai.ts` is fine — type-only, erased at build). Removing a dep requires a **dev server restart** (stale module graph caused a past "Router action dispatched before initialization" outage).
- **Never `export type {...}` (re-export) from a "use server" file.** This Next version's server-actions loader turns every export into a runtime server reference — a type re-export crashes module evaluation at runtime ("PracticeMCQ is not defined", broke ALL server actions). Locally-declared `export type Foo = ...` aliases are fine.
- **`revalidatePath("/")` inside a server action remounts the student SPA** (client state resets → user lands on Home mid-flow). Prefer client-side `router.refresh()` after the action for student-facing mutations.
- **Restart dev after dependency or schema changes.**
- **Don't change `next.config.ts` bodySizeLimit down** (breaks uploads).
- Read `node_modules/next/dist/docs/` before Next-specific patterns (per AGENTS.md).
- Keep `ExportCsvButton` / `ListFilter` selectors consistent when editing those lists (e.g., filter selectors exclude the empty-state row).

---

## 17. Testing Checklist (manual)

- [ ] `npx tsc --noEmit` passes.
- [ ] App builds (`npm run build`) / dev compiles each touched route (200 or 307).
- [ ] Login works for all 3 demo roles; wrong password rejected; suspended user blocked.
- [ ] Student: enroll (free + paid) → content unlocks → invoice shows + prints.
- [ ] Student: take a test → result/rank → Explain-with-AI (if quota) → teacher sees item analytics + results CSV.
- [ ] Class scheduled shows correct **IST** time to student; reschedule notifies batch; cancel notifies batch.
- [ ] Teacher marks manual attendance → student % + drill-down update; CSV exports.
- [ ] 1:1 slot: teacher publishes → student books (no double-book) → both notified; Home banner shows next booking.
- [ ] Doubt asked → teacher answers (AI draft optional) → student notified.
- [ ] Admin: record offline payment → student invoice appears; convert lead → new student can log in.
- [ ] Referral: open `/enquiry?ref=CODE` → code prefilled → submit → lead shows "🎁 referrer"; referrer notified.
- [ ] Study Planner / Notes: add/edit/delete persists across reload.
- [ ] Content approval: bulk approve/reject works; author notified.
- [ ] Search + CSV export work on Users / Leads / Content / Attendance / Payments.
- [ ] Times display in IST across student, teacher, admin.

---

## 18. Prompt for the Next Claude Session

```
You are continuing an existing, working project: CLATians LMS (Next.js 16 + Supabase + Gemini).

Before doing ANYTHING:
1. Read PROJECT_CONTEXT.md in the repo root fully. It is the source of truth.
2. Note AGENTS.md: this Next.js has breaking changes — consult node_modules/next/dist/docs/ before Next-specific code.
3. Inspect the actual code you'll touch before editing (read the file, its imports, and related actions).

How to work:
- Continue from the current status in PROJECT_CONTEXT.md §14 (next-feature priorities). Confirm with me which item to start if unclear.
- Preserve all existing working functionality — do not rewrite what already works; make minimal, targeted changes.
- Work on ONE feature at a time. Before editing, briefly explain the plan (files, approach) in 2–4 lines.
- Follow the project's patterns: await all DB calls; format times with fmtIST; import AI via ai-actions.ts (never ai.ts) in clients; add new tables/columns to db.ts SCHEMA AND apply them directly to the live DB (dev caches init); restart dev after dep/schema changes.
- After every important change, verify: run `npx tsc --noEmit -p tsconfig.json` and compile the touched route; report the result honestly.
- Keep responses concise to save tokens. No large code dumps unless asked.
- When a major feature is complete and committed, UPDATE PROJECT_CONTEXT.md (features/§ sections) accordingly.
- Never print or commit real secrets. Env vars are placeholders only.

Deploy = git push origin main (Vercel auto-deploys). Commit only when I ask.
Start by reading PROJECT_CONTEXT.md and telling me the current status + your proposed next step.
```

---
*Maintained by the team. Update §5–§8 and §14 whenever a feature ships.*
