// Creates a consistent, timestamped backup of the SQLite database.
// Usage:  npm run backup
// Uses SQLite's online backup API so it is safe to run while the app is live.

import Database from "better-sqlite3";
import { mkdirSync, readdirSync, statSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, "data", "lms.db");
const BACKUP_DIR = path.join(ROOT, "backups");
const KEEP = 10; // retain the newest N backups

function main() {
  try {
    statSync(DB_PATH);
  } catch {
    console.error(`No database found at ${DB_PATH} — start the app once to create it.`);
    process.exit(1);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(BACKUP_DIR, `lms-${stamp}.db`);

  const db = new Database(DB_PATH, { readonly: true });
  db.backup(dest)
    .then(() => {
      db.close();
      console.log(`✓ Backup written: ${path.relative(ROOT, dest)}`);
      prune();
    })
    .catch((err) => {
      db.close();
      console.error("Backup failed:", err.message);
      process.exit(1);
    });
}

// Keep only the newest KEEP backups.
function prune() {
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("lms-") && f.endsWith(".db"))
    .map((f) => ({ f, t: statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const { f } of files.slice(KEEP)) {
    try { rmSync(path.join(BACKUP_DIR, f)); } catch {}
  }
}

main();
