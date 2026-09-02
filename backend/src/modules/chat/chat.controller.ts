import type { Request, Response } from 'express';
import type {
  ApiSuccessResponse,
  CreateConversationInput,
  FeedbackInput,
  PaginationQuery,
  SendMessageInput,
  SuggestedQuestionsQuery,
} from '@astroai/shared-types';
import { SupportedLanguage } from '@astroai/shared-types';
import { asyncHandler } from '../../shared/asyncHandler';
import { conversationService } from './conversation.service';
import { chatService } from './chat.service';
import { getSuggestedQuestions } from './suggestedQuestions';

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = { success: true, data, requestId: req.requestId };
  res.status(status).json(body);
}

export const chatController = {
  createConversation: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as CreateConversationInput;
    const conversation = await conversationService.create(req.user!.id, input);
    ok(req, res, conversation, 201);
  }),

  listConversations: asyncHandler(async (req: Request, res: Response) => {
    const { limit, cursor } = req.query as unknown as PaginationQuery;
    const result = await conversationService.list(req.user!.id, { limit, cursor });
    ok(req, res, result, 200);
  }),

  getConversation: asyncHandler(async (req: Request, res: Response) => {
    const conversation = await conversationService.getById(req.user!.id, req.params.id as string);
    ok(req, res, conversation, 200);
  }),

  deleteConversation: asyncHandler(async (req: Request, res: Response) => {
    await conversationService.remove(req.user!.id, req.params.id as string);
    ok(req, res, { success: true }, 200);
  }),

  suggestedQuestions: asyncHandler(async (req: Request, res: Response) => {
    const conversation = await conversationService.getById(req.user!.id, req.params.id as string);
    const { language: languageOverride } = req.query as unknown as SuggestedQuestionsQuery;
    const language = languageOverride ?? conversation.language ?? SupportedLanguage.ENGLISH;
    const questions = getSuggestedQuestions(conversation.birthProfileId !== null, language);
    ok(req, res, { questions }, 200);
  }),

  listMessages: asyncHandler(async (req: Request, res: Response) => {
    const { limit, cursor } = req.query as unknown as PaginationQuery;
    const result = await chatService.listMessages(req.user!.id, req.params.id as string, {
      limit,
      cursor,
    });
    ok(req, res, result, 200);
  }),

  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as SendMessageInput;
    const message = await chatService.sendMessage(req.user!.id, req.params.id as string, input);
    ok(req, res, message, 201);
  }),

  regenerate: asyncHandler(async (req: Request, res: Response) => {
    const message = await chatService.regenerate(
      req.user!.id,
      req.params.id as string,
      req.params.messageId as string,
    );
    ok(req, res, message, 200);
  }),

  submitFeedback: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as FeedbackInput;
    const message = await chatService.submitFeedback(
      req.user!.id,
      req.params.id as string,
      req.params.messageId as string,
      input,
    );
    ok(req, res, message, 200);
  }),
};
