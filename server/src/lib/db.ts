import { createClient, type Client, type InValue, type Transaction } from '@libsql/client';
import { env } from '../env.js';
import { MIGRATIONS } from './schema.js';

/*
 * Turso (libSQL) over HTTP. The HTTP protocol is what makes this work on a
 * serverless platform: there is no connection to keep warm between invocations,
 * so a cold Vercel Function can issue a query immediately.
 */
export const db: Client = createClient({
  url: env.databaseUrl,
  authToken: env.databaseAuthToken,
});

export type SqlParams = unknown[] | Record<string, unknown>;

/**
 * libSQL binds `?` positionally and `:name` by name, while the repositories are
 * written against `?` and `@named`. Named parameters are rewritten to the colon
 * form and the object is passed straight through; positional ones need no work.
 */
export function compile(
  sql: string,
  params?: SqlParams,
): { text: string; values: InValue[] | Record<string, InValue> } {
  if (!params) return { text: sql, values: [] };

  if (Array.isArray(params)) {
    return { text: sql, values: params.map(toBindable) };
  }

  const used = new Set<string>();
  const text = sql.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_match, name: string) => {
    if (!(name in params)) throw new Error(`Missing SQL parameter @${name}`);
    used.add(name);
    return `:${name}`;
  });

  const values: Record<string, InValue> = {};
  for (const name of used) values[name] = toBindable(params[name]);

  return { text, values };
}

/**
 * SQLite stores no boolean type, and libSQL rejects `undefined` outright.
 * Normalising here keeps every call site free of the conversion.
 */
function toBindable(value: unknown): InValue {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'string') {
    return value;
  }
  if (value instanceof Uint8Array) return value;
  return JSON.stringify(value);
}

/**
 * Rows arrive with `bigint` for integer columns and `null` for missing values.
 * Narrowing bigint to number here means the mappers and JSON responses see the
 * plain numbers the API contract promises.
 */
function normaliseRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = typeof value === 'bigint' ? Number(value) : value;
  }
  return out as T;
}

export interface Queryable {
  query<T>(sql: string, params?: SqlParams): Promise<T[]>;
  one<T>(sql: string, params?: SqlParams): Promise<T | undefined>;
  run(sql: string, params?: SqlParams): Promise<number>;
}

const bind = (executor: Client | Transaction): Queryable => ({
  async query<T>(sql: string, params?: SqlParams): Promise<T[]> {
    const { text, values } = compile(sql, params);
    const result = await executor.execute({ sql: text, args: values });
    return result.rows.map((row) => normaliseRow<T>(row as unknown as Record<string, unknown>));
  },

  async one<T>(sql: string, params?: SqlParams): Promise<T | undefined> {
    const rows = await bind(executor).query<T>(sql, params);
    return rows[0];
  },

  async run(sql: string, params?: SqlParams): Promise<number> {
    const { text, values } = compile(sql, params);
    const result = await executor.execute({ sql: text, args: values });
    return Number(result.rowsAffected ?? 0);
  },
});

const root = bind(db);
export const query = root.query.bind(root);
export const one = root.one.bind(root);
export const run = root.run.bind(root);

/** Runs `fn` inside a single libSQL transaction. */
export async function transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
  const tx = await db.transaction('write');
  try {
    const result = await fn(bind(tx));
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback().catch(() => undefined);
    throw error;
  } finally {
    tx.close();
  }
}

/** SQLite has no timestamp type; the app stores ISO-8601 strings throughout. */
export const nowIso = (): string => new Date().toISOString();

export async function closePool(): Promise<void> {
  db.close();
}

/**
 * Applies the schema. Every statement is additive and guarded, so running it
 * against the existing database — which the mobile app also reads — adds only
 * what is missing and never drops or rewrites a column.
 */
export async function migrate(): Promise<void> {
  for (const statement of MIGRATIONS) {
    try {
      await db.execute(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      /* `ADD COLUMN` has no IF NOT EXISTS in SQLite; a repeat run is a no-op. */
      if (/duplicate column name/i.test(message)) continue;
      throw new Error(`Migration failed: ${message}\n  ${statement.trim().slice(0, 120)}`);
    }
  }
}
