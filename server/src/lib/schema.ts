/**
 * Schema for the shared Turso (libSQL) database.
 *
 * This database predates the React rebuild — it came from the Laravel app and
 * the mobile client reads it too. So every statement here is additive and
 * guarded: `CREATE TABLE IF NOT EXISTS` for what may be missing, and bare
 * `ALTER TABLE ... ADD COLUMN` for the fields the React booking funnel captures
 * that the original schema never had. `migrate()` swallows the
 * "duplicate column name" error that a repeat run produces, which is SQLite's
 * only way to express `ADD COLUMN IF NOT EXISTS`.
 *
 * Nothing here drops, renames or retypes an existing column.
 */
export const MIGRATIONS: string[] = [
  /* ---- Tables the original schema already defines, recreated only if absent ---- */

  `CREATE TABLE IF NOT EXISTS vehicles (
    id                integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name              varchar NOT NULL,
    slug              varchar NOT NULL,
    price             numeric NOT NULL,
    short_base        numeric NOT NULL DEFAULT '0',
    short_per_mile    numeric NOT NULL DEFAULT '0',
    long_base         numeric NOT NULL DEFAULT '0',
    long_per_mile     numeric NOT NULL DEFAULT '0',
    passengers        integer NOT NULL,
    suitcases         integer NOT NULL,
    hand_luggage_note varchar,
    image             varchar NOT NULL,
    description       varchar,
    car_model         varchar,
    sort_order        integer NOT NULL DEFAULT 0,
    created_at        datetime,
    updated_at        datetime
  )`,

  `CREATE TABLE IF NOT EXISTS airports (
    id          integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    code        varchar NOT NULL,
    name        varchar NOT NULL,
    city        varchar NOT NULL,
    country     varchar NOT NULL DEFAULT 'United Kingdom',
    description text    NOT NULL DEFAULT '',
    image       varchar NOT NULL DEFAULT '',
    sort_order  integer NOT NULL DEFAULT 0,
    created_at  datetime,
    updated_at  datetime
  )`,

  `CREATE TABLE IF NOT EXISTS faqs (
    id         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    question   text    NOT NULL,
    answer     text    NOT NULL,
    sort_order integer NOT NULL DEFAULT 0,
    created_at datetime,
    updated_at datetime
  )`,

  `CREATE TABLE IF NOT EXISTS admins (
    id         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name       varchar NOT NULL,
    email      varchar NOT NULL,
    password   varchar NOT NULL,
    created_at datetime,
    updated_at datetime
  )`,

  `CREATE TABLE IF NOT EXISTS bookings (
    id             integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    reference      varchar NOT NULL,
    from_location  varchar NOT NULL,
    to_location    varchar NOT NULL,
    depart_date    date    NOT NULL,
    depart_time    varchar,
    vehicle_id     integer NOT NULL,
    passenger_name varchar,
    email          varchar,
    phone          varchar,
    flight_number  varchar,
    note_to_driver text,
    country_code   varchar,
    status         varchar NOT NULL DEFAULT 'pending',
    payment_status varchar NOT NULL DEFAULT 'unpaid',
    payment_id     varchar,
    total_price    numeric,
    created_at     datetime,
    updated_at     datetime,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS contact_messages (
    id         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name       varchar      NOT NULL,
    email      varchar      NOT NULL,
    subject    varchar,
    message    text         NOT NULL,
    read       tinyint(1)   NOT NULL DEFAULT '0',
    created_at datetime,
    updated_at datetime
  )`,

  `CREATE TABLE IF NOT EXISTS subscribers (
    id         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    email      varchar    NOT NULL,
    name       varchar,
    active     tinyint(1) NOT NULL DEFAULT '1',
    created_at datetime,
    updated_at datetime
  )`,

  `CREATE TABLE IF NOT EXISTS admin_notifications (
    id         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    type       varchar    NOT NULL,
    message    varchar    NOT NULL,
    data       text,
    read       tinyint(1) NOT NULL DEFAULT '0',
    created_at datetime,
    updated_at datetime
  )`,

  /* ---- Tables only the React app needs ---- */

  `CREATE TABLE IF NOT EXISTS zones (
    id         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    name       varchar NOT NULL,
    colour     varchar NOT NULL DEFAULT '#0C6291',
    geometry   text    NOT NULL DEFAULT '[]',
    created_at datetime,
    updated_at datetime
  )`,

  `CREATE TABLE IF NOT EXISTS promotions (
    id         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    title      varchar    NOT NULL,
    body       text       NOT NULL DEFAULT '',
    code       varchar,
    discount   numeric    NOT NULL DEFAULT 0,
    active     tinyint(1) NOT NULL DEFAULT '1',
    expires_at datetime,
    created_at datetime,
    updated_at datetime
  )`,

  /*
   * ---- Columns the React booking funnel captures that Laravel never stored ----
   * Each of these fails harmlessly with "duplicate column name" once applied.
   */
  `ALTER TABLE bookings ADD COLUMN passengers integer NOT NULL DEFAULT 1`,
  `ALTER TABLE bookings ADD COLUMN suitcases integer NOT NULL DEFAULT 0`,
  `ALTER TABLE bookings ADD COLUMN hand_luggage integer NOT NULL DEFAULT 0`,
  `ALTER TABLE bookings ADD COLUMN extras text NOT NULL DEFAULT '[]'`,
  `ALTER TABLE bookings ADD COLUMN distance varchar`,
  `ALTER TABLE bookings ADD COLUMN duration varchar`,

  /* ---- Indexes ---- */
  `CREATE UNIQUE INDEX IF NOT EXISTS bookings_reference_unique ON bookings (reference)`,
  `CREATE INDEX IF NOT EXISTS bookings_email_index ON bookings (email)`,
  `CREATE INDEX IF NOT EXISTS bookings_created_at_index ON bookings (created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS airports_code_unique ON airports (code)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS subscribers_email_unique ON subscribers (email)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS admins_email_unique ON admins (email)`,
];
