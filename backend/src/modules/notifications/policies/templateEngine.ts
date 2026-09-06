import type { TemplateLocaleContent } from '@astroai/shared-types';

export const templateEngine = {
  /**
   * Replaces mustache-style tokens {{key}} with values from context data.
   */
  interpolate(text: string, data: Record<string, any> = {}): string {
    if (!text) return '';
    return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
      if (data[key] !== undefined && data[key] !== null) {
        return String(data[key]);
      }
      return match;
    });
  },

  /**
   * Resolves content in user preferred language with fallback to 'en'.
   */
  resolveLocaleContent(
    locales: Record<string, TemplateLocaleContent>,
    preferredLanguage: string = 'en',
    data: Record<string, any> = {},
  ): { title: string; body: string; actionUrl?: string; actionText?: string } {
    const localeContent = locales[preferredLanguage] || locales['en'] || Object.values(locales)[0];

    if (!localeContent) {
      return {
        title: 'AstroAI Update',
        body: 'You have a new update in AstroAI.',
      };
    }

    return {
      title: this.interpolate(localeContent.title, data),
      body: this.interpolate(localeContent.body, data),
      actionUrl: localeContent.actionUrl ? this.interpolate(localeContent.actionUrl, data) : undefined,
      actionText: localeContent.actionText,
    };
  },
};
