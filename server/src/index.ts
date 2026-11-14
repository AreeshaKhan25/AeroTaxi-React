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
import { bootstrapDatabase } from './seed.js';

bootstrapDatabase({ verbose: true });

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

/* Lightweight request log — enough to debug locally without a dependency. */
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

/* In production the API also serves the built React bundle. */
const distDir = path.resolve(env.isProduction ? process.cwd() : '.', 'dist');
if (env.isProduction && fs.existsSync(distDir)) {
  app.use(express.static(distDir, { index: false, maxAge: '1y' }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.info(`[api] AeroTAXI API listening on http://localhost:${env.port}`);
  console.info(`[api] stripe: ${hasStripe() ? 'live keys detected' : 'demo mode'}`);
  console.info(`[api] mail:   ${mailerConfigured() ? 'SMTP configured' : 'disabled (logs only)'}`);
});

const shutdown = (signal: string) => () => {
  console.info(`[api] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown('SIGINT'));
process.on('SIGTERM', shutdown('SIGTERM'));
