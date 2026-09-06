import { describe, expect, it } from 'vitest';
import { templateEngine } from '../../../src/modules/notifications/policies/templateEngine';

describe('Template Engine', () => {
  it('interpolates single and multiple token variables into string', () => {
    const template = 'Hello {{name}}, you have {{credits}} credits remaining in your {{currency}} wallet.';
    const result = templateEngine.interpolate(template, {
      name: 'Priya',
      credits: 50,
      currency: 'Vedic',
    });

    expect(result).toBe('Hello Priya, you have 50 credits remaining in your Vedic wallet.');
  });

  it('preserves unknown tokens when variable is not provided', () => {
    const template = 'Hello {{name}}, your promo code is {{code}}.';
    const result = templateEngine.interpolate(template, { name: 'Arjun' });

    expect(result).toBe('Hello Arjun, your promo code is {{code}}.');
  });

  it('resolves localized content based on user preferred language', () => {
    const locales = {
      en: {
        title: 'Welcome {{name}}',
        body: 'Start your journey.',
      },
      hi: {
        title: 'नमस्ते {{name}}',
        body: 'अपनी यात्रा शुरू करें।',
      },
    };

    const enResult = templateEngine.resolveLocaleContent(locales, 'en', { name: 'Aarav' });
    expect(enResult.title).toBe('Welcome Aarav');
    expect(enResult.body).toBe('Start your journey.');

    const hiResult = templateEngine.resolveLocaleContent(locales, 'hi', { name: 'Aarav' });
    expect(hiResult.title).toBe('नमस्ते Aarav');
    expect(hiResult.body).toBe('अपनी यात्रा शुरू करें।');
  });

  it('falls back to English when requested language is unavailable', () => {
    const locales = {
      en: {
        title: 'Welcome {{name}}',
        body: 'Start your journey.',
      },
    };

    const result = templateEngine.resolveLocaleContent(locales, 'es', { name: 'Carlos' });
    expect(result.title).toBe('Welcome Carlos');
  });
});
