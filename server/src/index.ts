/**
 * Local / self-hosted entry point: makes sure the schema and seed data exist,
 * then listens. Vercel uses `api/index.ts` instead, which imports the same app
 * without migrating on every cold start.
 */
import { app } from './app.js';
import { env, hasStripe } from './env.js';
import { closePool } from './lib/db.js';
import { mailerConfigured } from './mail/mailer.js';
import { bootstrapDatabase } from './seed.js';

try {
  await bootstrapDatabase({ verbose: true });
} catch (error) {
  console.error(
    '[api] database unavailable:',
    error instanceof Error ? error.message : error,
  );
  console.error('[api] check DATABASE_URL, then run `npm run db:seed`');
  process.exit(1);
}

const server = app.listen(env.port, () => {
  console.info(`[api] AeroTAXI API listening on http://localhost:${env.port}`);
  console.info(`[api] stripe: ${hasStripe() ? 'live keys detected' : 'demo mode'}`);
  console.info(`[api] mail:   ${mailerConfigured() ? 'SMTP configured' : 'disabled (logs only)'}`);
});

const shutdown = (signal: string) => () => {
  console.info(`[api] ${signal} received, shutting down`);
  server.close(() => {
    void closePool().finally(() => process.exit(0));
  });
};

process.on('SIGINT', shutdown('SIGINT'));
process.on('SIGTERM', shutdown('SIGTERM'));
