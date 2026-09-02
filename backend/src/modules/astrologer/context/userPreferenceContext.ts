import type { SupportedLanguage } from '@astroai/shared-types';

export interface UserPreferenceContext {
  name: string | null;
  /** The user's stored language preference — a default/tie-breaker only.
   * The persona still follows whatever language the user's actual message
   * is written in (CLAUDE.md §19); this is not an override. */
  preferredLanguage: SupportedLanguage | null;
  isFirstMessageInConversation: boolean;
}

export function buildUserPreferenceContext(input: {
  name: string | null;
  preferredLanguage: SupportedLanguage | null;
  isFirstMessageInConversation: boolean;
}): UserPreferenceContext {
  return {
    name: input.name,
    preferredLanguage: input.preferredLanguage,
    isFirstMessageInConversation: input.isFirstMessageInConversation,
  };
}
