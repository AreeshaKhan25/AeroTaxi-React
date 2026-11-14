import pg from 'pg';
import { env } from '../env.js';
import { SCHEMA_SQL } from './schema.js';

const { Pool, types } = pg;

/*
 * node-postgres hands back `bigint`/`numeric` as strings and timestamps as
 * `Date` objects. The API contract is plain numbers and ISO-8601 strings, so
 * the conversion happens once here at the driver rather than in every mapper.
 */
types.setTypeParser(types.builtins.INT8, (value) => Number.parseInt(value, 10));
types.setTypeParser(types.builtins.NUMERIC, (value) => Number.parseFloat(value));
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) => new Date(value).toISOString());
types.setTypeParser(types.builtins.TIMESTAMP, (value) => new Date(`${value}Z`).toISOString());
/* Keep DATE as the raw `YYYY-MM-DD` string instead of a Date. */
types.setTypeParser(types.builtins.DATE, (value) => value);

/** Neon and every other hosted Postgres needs TLS; a local server does not. */
const requiresTls = !/@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(env.databaseUrl);

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: env.databasePoolMax,
  ssl: requiresTls ? { rejectUnauthorized: true } : undefined,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (error) => {
  /* An idle client dropped by the pooler must not take the process down. */
  console.error('[db] idle client error:', error.message);
});

export type SqlParams = unknown[] | Record<string, unknown>;

/**
 * Compiles the two placeholder styles used across the repositories into the
 * `$1, $2, …` form Postgres expects:
 *
 *   query('… WHERE id = ?', [id])
 *   query('… VALUES (@name, @email)', { name, email })
 *
 * A named parameter used more than once is bound once and reused.
 */
export function compile(sql: string, params?: SqlParams): { text: string; values: unknown[] } {
  if (!params) return { text: sql, values: [] };

  if (Array.isArray(params)) {
    let index = 0;
    return { text: sql.replace(/\?/g, () => `$${(index += 1)}`), values: [...params] };
  }

  const values: unknown[] = [];
  const positions = new Map<string, number>();

  const text = sql.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_match, name: string) => {
    const existing = positions.get(name);
    if (existing) return `$${existing}`;

    if (!(name in params)) throw new Error(`Missing SQL parameter @${name}`);
    values.push(params[name]);
    positions.set(name, values.length);
    return `$${values.length}`;
  });

  return { text, values };
}

export interface Queryable {
  query<T>(sql: string, params?: SqlParams): Promise<T[]>;
  one<T>(sql: string, params?: SqlParams): Promise<T | undefined>;
  run(sql: string, params?: SqlParams): Promise<number>;
}

const bind = (executor: pg.Pool | pg.PoolClient): Queryable => ({
  async query<T>(sql: string, params?: SqlParams): Promise<T[]> {
    const { text, values } = compile(sql, params);
    const result = await executor.query(text, values);
    return result.rows as T[];
  },

  async one<T>(sql: string, params?: SqlParams): Promise<T | undefined> {
    const { text, values } = compile(sql, params);
    const result = await executor.query(text, values);
    return result.rows[0] as T | undefined;
  },

  async run(sql: string, params?: SqlParams): Promise<number> {
    const { text, values } = compile(sql, params);
    const result = await executor.query(text, values);
    return result.rowCount ?? 0;
  },
});

export const db: Queryable = bind(pool);
export const { query, one, run } = db;

/** Runs `fn` inside a single transaction on one dedicated client. */
export async function transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(bind(client));
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export const nowIso = (): string => new Date().toISOString();

export async function closePool(): Promise<void> {
  await pool.end();
}

export async function migrate(): Promise<void> {
  await run(SCHEMA_SQL);
}
