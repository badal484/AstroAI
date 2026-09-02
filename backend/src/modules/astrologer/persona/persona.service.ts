import type { AstrologerPersona } from '@astroai/shared-types';
import { redis } from '../../../lib/redis';
import { personaRepository } from './persona.repository';
import { DEFAULT_PERSONA } from './defaultPersona';

const CACHE_KEY = 'astrologer:persona:active';
const CACHE_TTL_SECONDS = 60;

function toPersona(doc: {
  name: string;
  description: string;
  tone: string;
  personalityTraits: string[];
  expertise: string[];
  supportedLanguages: string[];
  responseStyle: string;
  greetingBehavior: string;
  prohibitedBehaviors: string[];
}): AstrologerPersona {
  return {
    id: 'active',
    name: doc.name,
    description: doc.description,
    tone: doc.tone,
    personalityTraits: doc.personalityTraits,
    expertise: doc.expertise,
    supportedLanguages: doc.supportedLanguages as AstrologerPersona['supportedLanguages'],
    responseStyle: doc.responseStyle,
    greetingBehavior: doc.greetingBehavior,
    prohibitedBehaviors: doc.prohibitedBehaviors,
  };
}

export const personaService = {
  /** The currently active persona — an admin override if one has been set,
   * else `DEFAULT_PERSONA`. Never throws: a missing/invalid override falls
   * back to the default rather than breaking every AI response. */
  async getActivePersona(): Promise<AstrologerPersona> {
    const cached = await redis.get(CACHE_KEY);
    if (cached) return JSON.parse(cached) as AstrologerPersona;

    const override = await personaRepository.findActive();
    const persona = override ? toPersona(override) : DEFAULT_PERSONA;

    await redis.set(CACHE_KEY, JSON.stringify(persona), 'EX', CACHE_TTL_SECONDS);
    return persona;
  },

  async setActivePersona(persona: Omit<AstrologerPersona, 'id'>): Promise<void> {
    await personaRepository.setActive(persona);
    await redis.del(CACHE_KEY);
  },

  async resetToDefaultPersona(): Promise<void> {
    await personaRepository.resetToDefault();
    await redis.del(CACHE_KEY);
  },
};
