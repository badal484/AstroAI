import pinoHttp from 'pino-http';
import { rootLogger } from '../shared/logger';

/**
 * Access-log middleware. Uses the request-scoped requestId set by
 * requestIdMiddleware (which must run before this) rather than generating
 * its own, so access logs and application logs share one ID.
 */
export const httpLoggerMiddleware = pinoHttp({
  logger: rootLogger,
  genReqId: (req) => (req as unknown as { requestId: string }).requestId,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },
});
