import cors from 'cors';
import type { CorsOptions } from 'cors';
import helmet from 'helmet';
import { env } from '../config/env';
import { ForbiddenError } from '../shared/errors';

/**
 * helmet defaults + a strict CORS allowlist. Mobile traffic is not
 * browser-originated so CORS restricts the admin panel's origin(s) only —
 * never `*` (ARCHITECTURE.md §15).
 */
export const securityHeaders = helmet();

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (no Origin header) and any explicitly allowed origin.
    if (!origin || env.CORS_ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new ForbiddenError(`Origin ${origin} is not allowed`));
  },
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
