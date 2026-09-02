import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

/**
 * Validates (and coerces) `req.body` against a Zod schema, replacing it
 * with the parsed value. ZodError is mapped to a 400 VALIDATION_ERROR by
 * the centralized error middleware — see errorHandler.middleware.ts.
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Same as validateBody but for `req.query` — kept separate because Express
 * types req.query as ParsedQs, not an arbitrary assignable object. */
export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      Object.assign(req.query, schema.parse(req.query));
      next();
    } catch (error) {
      next(error);
    }
  };
}
