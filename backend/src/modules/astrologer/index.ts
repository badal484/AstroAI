/**
 * Public surface of the AI astrologer intelligence layer. A future chat
 * (or voice/reports) module calls `generateAstrologerResponse` and owns
 * message persistence/streaming delivery itself — this module only turns
 * a user message plus context into a safe, persona-driven response.
 */
export { generateAstrologerResponse } from './astrologer.service';
export type {
  GenerateAstrologerResponseInput,
  AstrologerResponseResult,
} from './astrologer.service';
export { personaService } from './persona/persona.service';
export { DEFAULT_PERSONA } from './persona/defaultPersona';
