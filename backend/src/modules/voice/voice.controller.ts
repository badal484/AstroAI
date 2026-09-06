import type { Request, Response } from 'express';
import type {
  ApiSuccessResponse,
  EndVoiceSessionInput,
  StartVoiceSessionInput,
  VoiceHeartbeatInput,
  VoiceTurnInput,
} from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { UnauthorizedError } from '../../shared/errors';
import { voiceRegistry } from './providers/voiceRegistry';
import { voiceService } from './voice.service';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    requestId: req.requestId,
  };
  res.status(status).json(body);
}

export const voiceController = {
  startSession: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const input = req.body as StartVoiceSessionInput;
    const session = await voiceService.startSession(userId, input);
    ok(req, res, session, 201);
  }),

  processTurn: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const sessionId = req.params.id as string;
    const input = req.body as VoiceTurnInput;

    const result = await voiceService.processTurn(userId, sessionId, input);
    ok(req, res, result);
  }),

  heartbeat: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const sessionId = req.params.id as string;
    const input = req.body as VoiceHeartbeatInput;

    const result = await voiceService.heartbeat(userId, sessionId, input);
    ok(req, res, result);
  }),

  endSession: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const sessionId = req.params.id as string;
    const input = req.body as EndVoiceSessionInput;

    const summary = await voiceService.endSession(userId, sessionId, input);
    ok(req, res, summary);
  }),

  getUserSessions: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const cursor = req.query.cursor as string | undefined;

    const result = await voiceService.getUserSessions(userId, { limit, cursor });
    ok(req, res, result);
  }),

  getSessionDetails: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedError();

    const sessionId = req.params.id as string;
    const details = await voiceService.getSessionDetails(sessionId);
    ok(req, res, details);
  }),

  adminListSessions: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const cursor = req.query.cursor as string | undefined;
    const status = req.query.status as any;

    const result = await voiceService.adminListSessions({ limit, cursor, status });
    ok(req, res, result);
  }),

  adminGetSessionDetails: asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.params.id as string;
    const details = await voiceService.getSessionDetails(sessionId);
    ok(req, res, details);
  }),

  adminGetConfig: asyncHandler(async (req: Request, res: Response) => {
    const routing = voiceRegistry.getRoutingCandidates();
    ok(req, res, routing);
  }),

  adminUpdateConfig: asyncHandler(async (req: Request, res: Response) => {
    const { sttCandidates, ttsCandidates } = req.body;
    voiceRegistry.setRoutingCandidates(sttCandidates, ttsCandidates);
    const updated = voiceRegistry.getRoutingCandidates();
    ok(req, res, updated);
  }),
};
