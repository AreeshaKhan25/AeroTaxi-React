/**
 * Vercel Function entry point: the whole Express API as one function.
 *
 * `vercel.json` rewrites every `/api/*` request here. Depending on how the
 * rewrite is applied, the function can receive either the original path
 * (`/api/bookings`) or the rewritten one (`/`), so the path is normalised back
 * to the `/api`-prefixed form the routers are mounted on.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../server/src/app.js';

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = req.url === '/' ? '/api' : `/api${req.url}`;
  }

  (app as unknown as (request: IncomingMessage, response: ServerResponse) => void)(req, res);
}
