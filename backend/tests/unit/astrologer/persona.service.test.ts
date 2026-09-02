import { beforeEach, describe, expect, it } from 'vitest';
import { SupportedLanguage } from '@astroai/shared-types';
import { redis } from '../../../src/lib/redis';
import { personaService } from '../../../src/modules/astrologer/persona/persona.service';
import { DEFAULT_PERSONA } from '../../../src/modules/astrologer/persona/defaultPersona';

beforeEach(async () => {
  await redis.flushall();
  await personaService.resetToDefaultPersona();
});

describe('personaService', () => {
  it('returns the built-in default persona when no admin override exists', async () => {
    const persona = await personaService.getActivePersona();
    expect(persona.name).toBe(DEFAULT_PERSONA.name);
    expect(persona.prohibitedBehaviors).toEqual(DEFAULT_PERSONA.prohibitedBehaviors);
  });

  it('returns an admin-configured override once one is set, and it takes effect immediately', async () => {
    await personaService.setActivePersona({
      name: 'Luna',
      description: 'A calm, minimalist astrologer persona for testing.',
      tone: 'quiet and precise',
      personalityTraits: ['calm'],
      expertise: ['Vedic astrology'],
      supportedLanguages: [SupportedLanguage.ENGLISH],
      responseStyle: 'brief',
      greetingBehavior: 'greets once',
      prohibitedBehaviors: ['never guarantees anything'],
    });

    const persona = await personaService.getActivePersona();
    expect(persona.name).toBe('Luna');
    expect(persona.tone).toBe('quiet and precise');
  });

  it('falls back to the default again after resetting', async () => {
    await personaService.setActivePersona({
      name: 'Luna',
      description: 'Custom persona.',
      tone: 'quiet',
      personalityTraits: ['calm'],
      expertise: ['Vedic astrology'],
      supportedLanguages: [SupportedLanguage.ENGLISH],
      responseStyle: 'brief',
      greetingBehavior: 'greets once',
      prohibitedBehaviors: ['never guarantees anything'],
    });
    expect((await personaService.getActivePersona()).name).toBe('Luna');

    await personaService.resetToDefaultPersona();

    expect((await personaService.getActivePersona()).name).toBe(DEFAULT_PERSONA.name);
  });
});
