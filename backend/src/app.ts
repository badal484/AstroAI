import express, { type Express } from 'express';
import { env } from './config/env';
import { errorHandlerMiddleware } from './middleware/errorHandler.middleware';
import { httpLoggerMiddleware } from './middleware/httpLogger.middleware';
import { notFoundMiddleware } from './middleware/notFound.middleware';
import { defaultRateLimiter } from './middleware/rateLimiter.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { corsMiddleware, securityHeaders } from './middleware/security.middleware';
import { v1Router } from './routes/v1';

/**
 * Assembles the Express app. Deliberately does not call `listen()` — that
 * is server.ts's job (connect infra, then start) — so the app is importable
 * in tests without binding a port or touching Mongo/Redis.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.NODE_ENV === 'production');

  app.use(requestIdMiddleware);
  app.use(httpLoggerMiddleware);
  app.use(securityHeaders);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(defaultRateLimiter);

  app.use('/api/v1', v1Router);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
