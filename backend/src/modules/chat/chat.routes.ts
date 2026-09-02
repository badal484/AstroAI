import { Router } from 'express';
import {
  createConversationSchema,
  feedbackSchema,
  paginationQuerySchema,
  sendMessageSchema,
  suggestedQuestionsQuerySchema,
} from '@astroai/shared-types';
import { authenticate } from '../../middleware/authenticate.middleware';
import { createRateLimiter } from '../../middleware/rateLimiter.middleware';
import { validateBody, validateQuery } from '../../middleware/validate.middleware';
import { chatController } from './chat.controller';

export const chatRouter = Router();

chatRouter.use('/conversations', authenticate);

// Sending a message triggers a real AI Gateway call — a stricter limiter
// than the app-wide default, mirroring the auth module's own rate-limit
// rationale for its most abuse-prone/costly endpoints.
const sendMessageRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 30,
  keyPrefix: 'chat-send',
});

chatRouter.post(
  '/conversations',
  validateBody(createConversationSchema),
  chatController.createConversation,
);
chatRouter.get(
  '/conversations',
  validateQuery(paginationQuerySchema),
  chatController.listConversations,
);
chatRouter.get('/conversations/:id', chatController.getConversation);
chatRouter.delete('/conversations/:id', chatController.deleteConversation);
chatRouter.get(
  '/conversations/:id/suggested-questions',
  validateQuery(suggestedQuestionsQuerySchema),
  chatController.suggestedQuestions,
);

chatRouter.get(
  '/conversations/:id/messages',
  validateQuery(paginationQuerySchema),
  chatController.listMessages,
);
chatRouter.post(
  '/conversations/:id/messages',
  sendMessageRateLimiter,
  validateBody(sendMessageSchema),
  chatController.sendMessage,
);
chatRouter.post(
  '/conversations/:id/messages/:messageId/regenerate',
  sendMessageRateLimiter,
  chatController.regenerate,
);
chatRouter.post(
  '/conversations/:id/messages/:messageId/feedback',
  validateBody(feedbackSchema),
  chatController.submitFeedback,
);
