import type { AstrologerPersona } from '@astroai/shared-types';
import { AstrologerPersonaModel } from './persona.model';

const ACTIVE_PERSONA_ID = 'active';

export const personaRepository = {
  findActive() {
    return AstrologerPersonaModel.findOne({ personaId: ACTIVE_PERSONA_ID }).exec();
  },

  setActive(persona: Omit<AstrologerPersona, 'id'>) {
    return AstrologerPersonaModel.findOneAndUpdate(
      { personaId: ACTIVE_PERSONA_ID },
      { personaId: ACTIVE_PERSONA_ID, ...persona },
      { new: true, upsert: true },
    ).exec();
  },

  resetToDefault() {
    return AstrologerPersonaModel.deleteOne({ personaId: ACTIVE_PERSONA_ID }).exec();
  },
};
