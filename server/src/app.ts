import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env, hasStripe } from './env.js';
import { errorHandler, notFoundHandler } from './lib/http.js';
import { attachAdmin } from './middleware/auth.js';
import { adminRouter } from './routes/admin.js';
import { bookingsRouter } from './routes/bookings.js';
import { catalogRouter } from './routes/catalog.js';
import { contactRouter } from './routes/contact.js';
import { mailerConfigured } from './mail/mailer.js';

/**
 * Builds the Express application. Kept free of side effects such as listening
 * or migrating so the same app can run as a long-lived server (`server/src/index.ts`)
 * or as a single Vercel Function (`api/index.ts`).
 */
export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: env.isProduction ? env.corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  /* Lightweight request log — enough to debug locally and in Runtime Logs. */
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      if (req.path.startsWith('/api')) {
        console.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
      }
    });
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      environment: env.nodeEnv,
      runtime: env.isServerless ? 'vercel-function' : 'node-server',
      stripe: hasStripe() ? 'live' : 'demo',
      mail: mailerConfigured() ? 'smtp' : 'disabled',
      time: new Date().toISOString(),
    });
  });

  app.use('/api/admin', attachAdmin, adminRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api', contactRouter);
  app.use('/api', catalogRouter);

  app.use('/api', notFoundHandler);

  /*
   * A self-hosted production process also serves the built React bundle.
   * On Vercel the CDN serves `dist/`, and `express.static` is ignored there.
   */
  if (env.isProduction && !env.isServerless) {
    const distDir = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir, { index: false, maxAge: '1y' }));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
