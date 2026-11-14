import fs from 'node:fs';
import path from 'node:path';
import Database, { type Database as SqliteDatabase } from 'better-sqlite3';
import { env } from '../env.js';

fs.mkdirSync(path.dirname(env.databaseFile), { recursive: true });

export const db: SqliteDatabase = new Database(env.databaseFile);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Schema mirrors the original Laravel migrations so existing data shapes stay
 * recognisable, with `created_at` / `updated_at` kept as ISO-8601 strings.
 */
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS airports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      code        TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      city        TEXT    NOT NULL,
      country     TEXT    NOT NULL DEFAULT 'United Kingdom',
      description TEXT    NOT NULL DEFAULT '',
      image       TEXT    NOT NULL DEFAULT '',
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      name              TEXT    NOT NULL,
      slug              TEXT    NOT NULL UNIQUE,
      price             REAL    NOT NULL DEFAULT 0,
      short_base        REAL    NOT NULL DEFAULT 0,
      short_per_mile    REAL    NOT NULL DEFAULT 0,
      long_base         REAL    NOT NULL DEFAULT 0,
      long_per_mile     REAL    NOT NULL DEFAULT 0,
      passengers        INTEGER NOT NULL DEFAULT 1,
      suitcases         INTEGER NOT NULL DEFAULT 0,
      hand_luggage_note TEXT,
      image             TEXT    NOT NULL DEFAULT '',
      description       TEXT,
      car_model         TEXT,
      sort_order        INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      question   TEXT    NOT NULL,
      answer     TEXT    NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      reference      TEXT    NOT NULL UNIQUE,
      from_location  TEXT    NOT NULL,
      to_location    TEXT    NOT NULL,
      depart_date    TEXT    NOT NULL,
      depart_time    TEXT,
      vehicle_id     INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      passenger_name TEXT,
      email          TEXT,
      phone          TEXT,
      country_code   TEXT,
      flight_number  TEXT,
      note_to_driver TEXT,
      passengers     INTEGER NOT NULL DEFAULT 1,
      suitcases      INTEGER NOT NULL DEFAULT 0,
      hand_luggage   INTEGER NOT NULL DEFAULT 0,
      extras         TEXT    NOT NULL DEFAULT '[]',
      distance       TEXT,
      duration       TEXT,
      status         TEXT    NOT NULL DEFAULT 'pending',
      payment_status TEXT    NOT NULL DEFAULT 'unpaid',
      payment_id     TEXT,
      total_price    REAL    NOT NULL DEFAULT 0,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS bookings_status_idx       ON bookings(status);
    CREATE INDEX IF NOT EXISTS bookings_payment_idx      ON bookings(payment_status);
    CREATE INDEX IF NOT EXISTS bookings_created_at_idx   ON bookings(created_at);

    CREATE TABLE IF NOT EXISTS contact_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL,
      subject    TEXT,
      message    TEXT    NOT NULL,
      read       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL UNIQUE,
      name       TEXT,
      active     INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      type       TEXT    NOT NULL,
      message    TEXT    NOT NULL,
      data       TEXT,
      read       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      subject         TEXT    NOT NULL,
      message         TEXT    NOT NULL,
      recipient_count INTEGER NOT NULL DEFAULT 0,
      sent_count      INTEGER NOT NULL DEFAULT 0,
      status          TEXT    NOT NULL DEFAULT 'queued',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS zones (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      colour     TEXT    NOT NULL DEFAULT '#f59e0b',
      geometry   TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export const nowIso = (): string => new Date().toISOString();

/** Run a set of statements inside a single transaction. */
export function transaction<T>(fn: () => T): T {
  return db.transaction(fn)();
}
