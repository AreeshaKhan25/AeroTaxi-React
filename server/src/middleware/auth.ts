import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { HttpError } from '../lib/http.js';
import { admins } from '../lib/repositories.js';

export interface AdminIdentity {
  id: number;
  name: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminIdentity;
    }
  }
}

interface TokenPayload {
  sub: number;
  email: string;
}

export function issueAdminCookie(res: Response, admin: AdminIdentity, remember: boolean): void {
  const days = remember ? env.auth.rememberDays : env.auth.sessionDays;
  const token = jwt.sign(
    { sub: admin.id, email: admin.email } satisfies TokenPayload,
    env.auth.jwtSecret,
    { expiresIn: `${days}d` },
  );

  res.cookie(env.auth.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/',
    maxAge: days * 24 * 60 * 60 * 1000,
  });
}

export function clearAdminCookie(res: Response): void {
  res.clearCookie(env.auth.cookieName, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
  });
}

/** Resolves the signed-in admin, or `undefined` when the cookie is absent/stale. */
export async function resolveAdmin(req: Request): Promise<AdminIdentity | undefined> {
  const token = req.cookies?.[env.auth.cookieName];
  if (!token || typeof token !== 'string') return undefined;

  try {
    const payload = jwt.verify(token, env.auth.jwtSecret) as unknown as TokenPayload;
    if (typeof payload?.sub !== 'number') return undefined;

    const row = await admins.findById(payload.sub);
    if (!row) return undefined;
    return { id: row.id, name: row.name, email: row.email };
  } catch {
    return undefined;
  }
}

export function attachAdmin(req: Request, _res: Response, next: NextFunction): void {
  void resolveAdmin(req)
    .then((admin) => {
      req.admin = admin;
      next();
    })
    .catch(next);
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.admin) {
    next();
    return;
  }

  void resolveAdmin(req)
    .then((admin) => {
      if (!admin) {
        next(HttpError.unauthorized('Please sign in to continue.'));
        return;
      }
      req.admin = admin;
      next();
    })
    .catch(next);
}
