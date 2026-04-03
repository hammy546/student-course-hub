import { Database } from "jsr:@db/sqlite";

export const db = new Database("./hub.db");

// Enable WAL mode for better performance + foreign key enforcement
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
  CREATE TABLE IF NOT EXISTS programmes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    title     TEXT    NOT NULL,
    level     TEXT    NOT NULL CHECK(level IN ('Undergraduate','Postgraduate')),
    description TEXT  NOT NULL DEFAULT '',
    image_url TEXT    NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 0,
    created_at TEXT   NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS modules (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    programme_id INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    year        INTEGER NOT NULL,
    image_url   TEXT    NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS staff (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    email    TEXT NOT NULL UNIQUE,
    bio      TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS programme_leaders (
    programme_id INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    staff_id     INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    PRIMARY KEY (programme_id, staff_id)
  );

  CREATE TABLE IF NOT EXISTS module_leaders (
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    staff_id  INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    PRIMARY KEY (module_id, staff_id)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT    NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS student_interests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    programme_id INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    name         TEXT    NOT NULL,
    email        TEXT    NOT NULL,
    registered_at TEXT   NOT NULL DEFAULT (datetime('now')),
    UNIQUE(programme_id, email)
  );

  -- Junction table: allows a module to appear in multiple programmes.
  -- The owning programme is still tracked via modules.programme_id;
  -- this table records every additional programme that shares the module.
  CREATE TABLE IF NOT EXISTS programme_modules (
    programme_id INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    module_id    INTEGER NOT NULL REFERENCES modules(id)    ON DELETE CASCADE,
    PRIMARY KEY (programme_id, module_id)
  );
`);

// Backfill: ensure every existing module has a row in programme_modules
// so the junction table is the single source of truth for membership.
db.exec(`
  INSERT OR IGNORE INTO programme_modules (programme_id, module_id)
  SELECT programme_id, id FROM modules;
`);

console.log("Database initialised");
