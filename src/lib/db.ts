import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "hdstream.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      google_id TEXT UNIQUE,
      email_verified INTEGER DEFAULT 0,
      two_factor_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('reset', '2fa', 'email_verify')),
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS watch_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
      season INTEGER,
      episode INTEGER,
      progress REAL DEFAULT 0,
      duration REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, media_id, media_type, season, episode)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      media_id INTEGER NOT NULL,
      media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
      added_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, media_id, media_type)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS genre_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      genre_id INTEGER NOT NULL,
      genre_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, genre_id)
    )
  `);

  const tableInfo = db.prepare("PRAGMA table_info('users')").all() as any[];
  const has2fa = tableInfo.some((c: any) => c.name === "two_factor_enabled");
  if (!has2fa) {
    db.exec("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0");
  }
  const hasEmailVerified = tableInfo.some((c: any) => c.name === "email_verified");
  if (!hasEmailVerified) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0");
  }
  const hasUsername = tableInfo.some((c: any) => c.name === "username");
  if (!hasUsername) {
    db.exec("ALTER TABLE users ADD COLUMN username TEXT");
  }
  const hasGreetingPref = tableInfo.some((c: any) => c.name === "greeting_preference");
  if (!hasGreetingPref) {
    db.exec("ALTER TABLE users ADD COLUMN greeting_preference TEXT DEFAULT 'first_name'");
  }
  const hasAvatarUrl = tableInfo.some((c: any) => c.name === "avatar_url");
  if (!hasAvatarUrl) {
    db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT");
  }
  const hasTheme = tableInfo.some((c: any) => c.name === "theme");
  if (!hasTheme) {
    db.exec("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'red'");
  }
  const hasDarkMode = tableInfo.some((c: any) => c.name === "dark_mode");
  if (!hasDarkMode) {
    db.exec("ALTER TABLE users ADD COLUMN dark_mode INTEGER DEFAULT 1");
  }
}
