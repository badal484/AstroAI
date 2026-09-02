import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { runWithRequestContext } from '../shared/requestContext';

const REQUEST_ID_HEADER = 'x-request-id';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
  }
}

/**
 * Assigns/propagates a correlation ID for every request (CLAUDE.md §33/§39).
 * Accepts an inbound `x-request-id` (e.g. forwarded from the mobile/admin
 * client) so a single request can be traced end-to-end; generates one if
 * absent. The ID is echoed back on the response and bound to the async
 * context so every log line for this request carries it automatically.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const inboundId = req.header(REQUEST_ID_HEADER);
  const requestId = inboundId && inboundId.length > 0 ? inboundId : randomUUID();

  req.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);

  runWithRequestContext({ requestId }, () => next());
}
