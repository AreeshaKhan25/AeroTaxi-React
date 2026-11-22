/**
 * Idempotent database bootstrap.
 *
 *   npm run db:seed     creates the schema and seeds anything that is missing
 *   npm run db:reset    clears the seeded reference tables first (`--fresh`)
 *
 * Bookings, messages and subscribers are never touched by `--fresh`.
 */
import bcrypt from 'bcryptjs';
import { env } from './env.js';
import { closePool, migrate, nowIso, one, run, transaction } from './lib/db.js';
import { airportSeeds, faqSeeds, vehicleSeeds } from './lib/seed-data.js';

const count = async (table: string): Promise<number> => {
  /* Table names come from this file only, never from user input. */
  const row = await one<{ c: number }>(`SELECT COUNT(*) AS c FROM ${table}`);
  return Number(row?.c ?? 0);
};

async function seedAirports(): Promise<number> {
  const timestamp = nowIso();

  return transaction(async (tx) => {
    let inserted = 0;
    for (const airport of airportSeeds) {
      const exists = await tx.one<{ hit: number }>(
        'SELECT 1 AS hit FROM airports WHERE code = ?',
        [airport.code],
      );
      if (exists) continue;

      await tx.run(
        `INSERT INTO airports (code, name, city, country, description, image, sort_order, created_at, updated_at)
         VALUES (@code, @name, @city, @country, @description, @image, @sortOrder, @timestamp, @timestamp)`,
        { ...airport, timestamp },
      );
      inserted += 1;
    }
    return inserted;
  });
}

async function seedVehicles(): Promise<number> {
  const timestamp = nowIso();

  return transaction(async (tx) => {
    let inserted = 0;
    for (const vehicle of vehicleSeeds) {
      const exists = await tx.one<{ hit: number }>(
        'SELECT 1 AS hit FROM vehicles WHERE slug = ?',
        [vehicle.slug],
      );
      if (exists) continue;

      await tx.run(
        `INSERT INTO vehicles (
            name, slug, price, short_base, short_per_mile, long_base, long_per_mile,
            passengers, suitcases, hand_luggage_note, image, description, car_model,
            sort_order, created_at, updated_at
         ) VALUES (
            @name, @slug, @price, @shortBase, @shortPerMile, @longBase, @longPerMile,
            @passengers, @suitcases, @handLuggageNote, @image, @description, @carModel,
            @sortOrder, @timestamp, @timestamp
         )`,
        { ...vehicle, timestamp },
      );
      inserted += 1;
    }
    return inserted;
  });
}

async function seedFaqs(): Promise<number> {
  const timestamp = nowIso();

  return transaction(async (tx) => {
    let inserted = 0;
    for (const faq of faqSeeds) {
      const exists = await tx.one<{ hit: number }>(
        'SELECT 1 AS hit FROM faqs WHERE question = ?',
        [faq.question],
      );
      if (exists) continue;

      await tx.run(
        `INSERT INTO faqs (question, answer, sort_order, created_at, updated_at)
         VALUES (@question, @answer, @sortOrder, @timestamp, @timestamp)`,
        { ...faq, timestamp },
      );
      inserted += 1;
    }
    return inserted;
  });
}

async function seedAdmin(): Promise<boolean> {
  const existing = await one<{ hit: number }>(
    'SELECT 1 AS hit FROM admins WHERE lower(email) = lower(?)',
    [env.seedAdmin.email],
  );
  if (existing) return false;

  const timestamp = nowIso();
  await run(
    `INSERT INTO admins (name, email, password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      env.seedAdmin.name,
      env.seedAdmin.email,
      bcrypt.hashSync(env.seedAdmin.password, 12),
      timestamp,
      timestamp,
    ],
  );
  return true;
}

export async function bootstrapDatabase(options: { verbose?: boolean } = {}): Promise<void> {
  await migrate();

  const results = {
    airports: await seedAirports(),
    vehicles: await seedVehicles(),
    faqs: await seedFaqs(),
    admin: await seedAdmin(),
  };

  if (options.verbose) {
    console.log(
      `[db] airports +${results.airports} (${await count('airports')} total), ` +
        `vehicles +${results.vehicles} (${await count('vehicles')} total), ` +
        `faqs +${results.faqs} (${await count('faqs')} total)`,
    );
    if (results.admin) {
      console.log(`[db] admin created: ${env.seedAdmin.email}`);
    }
  }
}

/**
 * SQLite has no TRUNCATE; DELETE plus resetting the AUTOINCREMENT counter in
 * `sqlite_sequence` is the equivalent. Bookings, messages and subscribers are
 * never touched — this only clears the reference tables the seed owns.
 */
async function resetTable(table: string): Promise<void> {
  await run(`DELETE FROM ${table}`);
  await run('DELETE FROM sqlite_sequence WHERE name = ?', [table]);
}

async function freshReferenceData(): Promise<void> {
  await resetTable('airports');
  await resetTable('faqs');

  /* Bookings reference vehicles, so only clear the fleet when nothing uses it. */
  const bookingCount = await count('bookings');
  if (bookingCount === 0) {
    await resetTable('vehicles');
    console.log('[db] cleared airports, vehicles and faqs');
  } else {
    console.log(
      `[db] cleared airports and faqs; kept vehicles (${bookingCount} bookings reference them)`,
    );
  }
}

const invokedDirectly = process.argv[1]?.replace(/\\/g, '/').endsWith('server/src/seed.ts') ?? false;

if (invokedDirectly) {
  const host = (() => {
    try {
      return new URL(env.databaseUrl).host;
    } catch {
      return 'the configured database';
    }
  })();

  try {
    await migrate();
    if (process.argv.includes('--fresh')) await freshReferenceData();
    await bootstrapDatabase({ verbose: true });
    console.log(`[db] ready on ${host}`);
  } catch (error) {
    console.error('[db] seed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
