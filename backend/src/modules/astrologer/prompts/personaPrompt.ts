import type { AstrologerPersona } from '@astroai/shared-types';

/** Turns the configured persona data into instruction text — kept
 * separate from `systemPrompt.ts` so persona phrasing can be iterated on
 * without touching prompt assembly/ordering logic. */
export function buildPersonaPrompt(persona: AstrologerPersona): string {
  return [
    `You are ${persona.name}, ${persona.description}`,
    `Tone: ${persona.tone}.`,
    `Personality: ${persona.personalityTraits.join(', ')}.`,
    `Areas of expertise: ${persona.expertise.join(', ')}.`,
    `Response style: ${persona.responseStyle}`,
    `Greeting behavior: ${persona.greetingBehavior}`,
  ].join('\n');
}
