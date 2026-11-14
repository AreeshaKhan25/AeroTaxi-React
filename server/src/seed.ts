/**
 * Idempotent database bootstrap.
 *
 *   npm run db:seed     seeds anything that is missing
 *   npm run db:reset    drops the seeded reference tables first (`--fresh`)
 *
 * Bookings, messages and subscribers are never touched by `--fresh`.
 */
import bcrypt from 'bcryptjs';
import { env } from './env.js';
import { db, migrate, nowIso } from './lib/db.js';
import { airportSeeds, faqSeeds, vehicleSeeds } from './lib/seed-data.js';

const count = (table: string): number =>
  (db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;

function seedAirports(): number {
  const insert = db.prepare(
    `INSERT INTO airports (code, name, city, country, description, image, sort_order, created_at, updated_at)
     VALUES (@code, @name, @city, @country, @description, @image, @sortOrder, @timestamp, @timestamp)`,
  );
  const exists = db.prepare('SELECT 1 AS hit FROM airports WHERE code = ?');

  let inserted = 0;
  const timestamp = nowIso();
  db.transaction(() => {
    for (const airport of airportSeeds) {
      if (exists.get(airport.code)) continue;
      insert.run({ ...airport, timestamp });
      inserted += 1;
    }
  })();
  return inserted;
}

function seedVehicles(): number {
  const insert = db.prepare(
    `INSERT INTO vehicles (
        name, slug, price, short_base, short_per_mile, long_base, long_per_mile,
        passengers, suitcases, hand_luggage_note, image, description, car_model,
        sort_order, created_at, updated_at
     ) VALUES (
        @name, @slug, @price, @shortBase, @shortPerMile, @longBase, @longPerMile,
        @passengers, @suitcases, @handLuggageNote, @image, @description, @carModel,
        @sortOrder, @timestamp, @timestamp
     )`,
  );
  const exists = db.prepare('SELECT 1 AS hit FROM vehicles WHERE slug = ?');

  let inserted = 0;
  const timestamp = nowIso();
  db.transaction(() => {
    for (const vehicle of vehicleSeeds) {
      if (exists.get(vehicle.slug)) continue;
      insert.run({ ...vehicle, timestamp });
      inserted += 1;
    }
  })();
  return inserted;
}

function seedFaqs(): number {
  const insert = db.prepare(
    `INSERT INTO faqs (question, answer, sort_order, created_at, updated_at)
     VALUES (@question, @answer, @sortOrder, @timestamp, @timestamp)`,
  );
  const exists = db.prepare('SELECT 1 AS hit FROM faqs WHERE question = ?');

  let inserted = 0;
  const timestamp = nowIso();
  db.transaction(() => {
    for (const faq of faqSeeds) {
      if (exists.get(faq.question)) continue;
      insert.run({ ...faq, timestamp });
      inserted += 1;
    }
  })();
  return inserted;
}

function seedAdmin(): boolean {
  const existing = db
    .prepare('SELECT 1 AS hit FROM admins WHERE email = ? COLLATE NOCASE')
    .get(env.seedAdmin.email);
  if (existing) return false;

  const timestamp = nowIso();
  db.prepare(
    `INSERT INTO admins (name, email, password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    env.seedAdmin.name,
    env.seedAdmin.email,
    bcrypt.hashSync(env.seedAdmin.password, 12),
    timestamp,
    timestamp,
  );
  return true;
}

export function bootstrapDatabase(options: { verbose?: boolean } = {}): void {
  migrate();

  const results = {
    airports: seedAirports(),
    vehicles: seedVehicles(),
    faqs: seedFaqs(),
    admin: seedAdmin(),
  };

  if (options.verbose) {
    console.log(
      `[db] airports +${results.airports} (${count('airports')} total), ` +
        `vehicles +${results.vehicles} (${count('vehicles')} total), ` +
        `faqs +${results.faqs} (${count('faqs')} total)`,
    );
    if (results.admin) {
      console.log(`[db] admin created: ${env.seedAdmin.email} / ${env.seedAdmin.password}`);
    }
  }
}

function freshReferenceData(): void {
  db.exec('DELETE FROM airports; DELETE FROM vehicles; DELETE FROM faqs;');
  db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('airports', 'vehicles', 'faqs')`);
  console.log('[db] cleared airports, vehicles and faqs');
}

const invokedDirectly =
  process.argv[1]?.replace(/\\/g, '/').endsWith('server/src/seed.ts') ?? false;

if (invokedDirectly) {
  migrate();
  if (process.argv.includes('--fresh')) freshReferenceData();
  bootstrapDatabase({ verbose: true });
  console.log(`[db] ready at ${env.databaseFile}`);
}
