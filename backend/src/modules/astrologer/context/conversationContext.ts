import type { AstrologerMessage } from '@astroai/shared-types';

// Layered memory (CLAUDE.md §22): only a bounded recent window is ever
// sent verbatim — "do not send unlimited historical conversation to the
// model." Summarizing older turns into `conversationSummary` is the
// caller's job (a future chat module, which owns persistence); this
// module only windows and formats what it's given.
const MAX_RECENT_MESSAGES = 12;

export interface ConversationContext {
  recentMessages: AstrologerMessage[];
  /** Older context already condensed by the caller, or null if the
   * conversation is short enough that nothing has been summarized yet. */
  summary: string | null;
  /** True when older turns exist beyond what's included here — lets the
   * persona avoid implying it has no memory of anything earlier. */
  hasOlderHistory: boolean;
}

export function buildConversationContext(
  fullHistory: AstrologerMessage[],
  conversationSummary: string | null = null,
): ConversationContext {
  const recentMessages = fullHistory.slice(-MAX_RECENT_MESSAGES);
  return {
    recentMessages,
    summary: conversationSummary,
    hasOlderHistory: fullHistory.length > recentMessages.length || conversationSummary !== null,
  };
}
