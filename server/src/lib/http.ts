import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodType, type ZodTypeDef } from 'zod';

/** An error with an HTTP status attached, safe to surface to clients. */
export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }

  static badRequest(message = 'Bad request', details?: unknown): HttpError {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'Unauthenticated'): HttpError {
    return new HttpError(401, message);
  }

  static forbidden(message = 'Forbidden'): HttpError {
    return new HttpError(403, message);
  }

  static notFound(message = 'Not found'): HttpError {
    return new HttpError(404, message);
  }

  static conflict(message = 'Conflict'): HttpError {
    return new HttpError(409, message);
  }

  static unprocessable(message = 'The given data was invalid', details?: unknown): HttpError {
    return new HttpError(422, message, details);
  }

  static serverError(message = 'Something went wrong'): HttpError {
    return new HttpError(500, message);
  }
}

/** Wraps an async handler so rejected promises reach the error middleware. */
export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    handler(req, res, next).catch(next);
  };

const flattenZod = (error: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
};

/** Parse-or-throw helper that turns Zod failures into a 422 response. */
export function parseOrThrow<Output>(
  schema: ZodType<Output, ZodTypeDef, unknown>,
  payload: unknown,
): Output {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw HttpError.unprocessable('The given data was invalid', flattenZod(result.error));
  }
  return result.data;
}

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(422).json({ message: 'The given data was invalid', errors: flattenZod(error) });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('[api] unhandled error:', error);
  res.status(500).json({ message: 'Something went wrong', detail: message });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ message: 'Endpoint not found' });
};
