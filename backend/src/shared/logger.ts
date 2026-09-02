import pino from 'pino';
import { env } from '../config/env';
import { getRequestContext } from './requestContext';

/**
 * Root structured logger. Every log line is enriched with the current
 * requestId/userId (from AsyncLocalStorage) when called inside a request,
 * so logs are correlate-able without threading a logger instance through
 * every function call. Sensitive fields are redacted centrally — CLAUDE.md §36.
 */
export const rootLogger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.otp',
      '*.cardNumber',
      '*.cvv',
    ],
    censor: '[REDACTED]',
  },
  ...(env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});

export const logger = {
  fatal: (obj: unknown, msg?: string) => rootLogger.fatal(withContext(obj), msg),
  error: (obj: unknown, msg?: string) => rootLogger.error(withContext(obj), msg),
  warn: (obj: unknown, msg?: string) => rootLogger.warn(withContext(obj), msg),
  info: (obj: unknown, msg?: string) => rootLogger.info(withContext(obj), msg),
  debug: (obj: unknown, msg?: string) => rootLogger.debug(withContext(obj), msg),
};

function withContext(obj: unknown): Record<string, unknown> {
  const context = getRequestContext();
  const base = typeof obj === 'object' && obj !== null ? obj : { msg: obj };
  return context ? { ...base, requestId: context.requestId, userId: context.userId } : { ...base };
}
