import type { AstrologerPersona } from '@astroai/shared-types';
import { personaService } from '../../astrologer/persona/persona.service';
import { DEFAULT_PERSONA } from '../../astrologer/persona/defaultPersona';

export const personaManager = {
  async getActivePersona(): Promise<AstrologerPersona> {
    try {
      return await personaService.getActivePersona();
    } catch {
      return DEFAULT_PERSONA;
    }
  },
};
