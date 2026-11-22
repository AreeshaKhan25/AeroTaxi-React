import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(here, '..');
export const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');

const bool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const int = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * The Turso dashboard gives a `https://<db>.turso.io/v2/pipeline` URL, but the
 * client wants the bare origin and appends the protocol path itself. Passing
 * the full pipeline URL through makes every request 404.
 */
function normaliseLibsqlUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (trimmed.startsWith('file:')) return trimmed;
  return trimmed.replace(/\/v2\/pipeline$/, '');
}

const list = (value: string | undefined, fallback: string[] = []): string[] => {
  if (!value) return fallback;
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

export const env = {
  nodeEnv,
  isProduction,
  port: int(process.env.API_PORT ?? process.env.PORT, 4000),
  appUrl: (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/+$/, ''),
  corsOrigins: list(process.env.CORS_ORIGIN, ['http://localhost:5173', 'http://127.0.0.1:5173']),

  /*
   * Turso (libSQL). The same database backs the mobile client, so this is the
   * shared source of truth rather than a copy.
   *
   * TURSO_DATABASE_URL is the canonical name; TURSO_HTTP_URL is accepted
   * because that is what the Turso dashboard hands you, and its `/v2/pipeline`
   * suffix is trimmed since the client appends its own path. A local
   * `file:` URL still works for offline development.
   */
  databaseUrl: normaliseLibsqlUrl(
    process.env.TURSO_DATABASE_URL ??
      process.env.TURSO_HTTP_URL ??
      process.env.DATABASE_URL ??
      'file:server/data/aerotaxi.db',
  ),

  databaseAuthToken: process.env.TURSO_AUTH_TOKEN ?? undefined,

  isServerless: Boolean(process.env.VERCEL),

  auth: {
    jwtSecret: process.env.JWT_SECRET ?? 'aerotaxi-development-secret-change-me',
    sessionDays: int(process.env.SESSION_DAYS, 7),
    rememberDays: int(process.env.REMEMBER_DAYS, 30),
    cookieName: 'aerotaxi_admin',
  },

  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME ?? 'Admin',
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@aerotaxi.com',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'admin123',
  },

  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
  },

  mail: {
    host: process.env.MAIL_HOST ?? '',
    port: int(process.env.MAIL_PORT, 587),
    secure: bool(process.env.MAIL_SECURE, false),
    user: process.env.MAIL_USERNAME ?? '',
    password: process.env.MAIL_PASSWORD ?? '',
    fromAddress: process.env.MAIL_FROM_ADDRESS ?? 'supportaerotaxi@gmail.com',
    fromName: process.env.MAIL_FROM_NAME ?? 'AeroTAXI',
    adminRecipients: list(process.env.ADMIN_EMAILS, ['supportaerotaxi@gmail.com']),
  },

  aviationstackKey: process.env.AVIATIONSTACK_API_KEY ?? '',
} as const;

/** A Stripe key that is present and not one of the historical placeholders. */
export const hasStripe = (): boolean => {
  const { secretKey, publishableKey } = env.stripe;
  const placeholder = (value: string) =>
    !value || value.includes('REPLACE') || value.includes('YOUR_KEY');
  return !placeholder(secretKey) && !placeholder(publishableKey);
};

export const hasMailer = (): boolean => Boolean(env.mail.host && env.mail.user);
